export type DraftSaveReason =
  | "auto"
  | "conflict-merge"
  | "explicit-keep-local"
  | "manual"
  | "navigation-flush";

export type DraftSaveStatus =
  | "clean"
  | "conflict"
  | "debounce-pending"
  | "dirty"
  | "failed"
  | "saving";

export type DraftSaveResponse<T> =
  | { status: "saved"; savedAt: string; savedRevision: number }
  | { serverRevision: number; status: "conflict" }
  | { error: string; retryable: boolean; status: "failed" };

export type DraftSaveControllerState<T> = {
  baseline: T;
  conflictRevision: number | null;
  current: T;
  draftVersion: number;
  errorMessage: string | null;
  isDirty: boolean;
  savedAt: string | null;
  savedRevision: number;
  status: DraftSaveStatus;
};

type TimerScheduler = {
  clear: (timer: ReturnType<typeof setTimeout>) => void;
  set: (callback: () => void, delayMs: number) => ReturnType<typeof setTimeout>;
};

type DraftSaveControllerOptions<T> = {
  autoSaveEnabled: boolean;
  debounceMs: number;
  initialContent: T;
  initialSavedAt: string | null;
  initialSavedRevision: number;
  onChange?: () => void;
  onSaved?: (content: T, savedAt: string, savedRevision: number) => void | Promise<void>;
  persist: (input: {
    content: T;
    expectedRevision: number;
    reason: DraftSaveReason;
    saveAttemptId: number;
    mutationId: string;
  }) => Promise<DraftSaveResponse<T>>;
  scheduler?: TimerScheduler;
};

const MAX_AUTOMATIC_RETRIES = 3;

const defaultTimerScheduler: TimerScheduler = {
  clear: (timer) => globalThis.clearTimeout(timer),
  set: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
};

/**
 * Framework-independent, single-writer draft persistence state machine. It keeps
 * exactly one active request and one coalesced reason for the latest rendered draft.
 */
export class DraftSaveController<T> {
  private active: Promise<boolean> | null = null;
  private autoSaveEnabled: boolean;
  private baseline: T;
  private conflictRevision: number | null = null;
  private current: T;
  private draftVersion = 0;
  private errorMessage: string | null = null;
  private pendingReason: DraftSaveReason | null = null;
  private savedAt: string | null;
  private savedRevision: number;
  private saveAttemptId = 0;
  private status: DraftSaveStatus = "clean";
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly scheduler: TimerScheduler;

  constructor(private readonly options: DraftSaveControllerOptions<T>) {
    this.autoSaveEnabled = options.autoSaveEnabled;
    this.baseline = clone(options.initialContent);
    this.current = clone(options.initialContent);
    this.savedAt = options.initialSavedAt;
    this.savedRevision = options.initialSavedRevision;
    this.scheduler = options.scheduler ?? defaultTimerScheduler;
  }

  getState(): DraftSaveControllerState<T> {
    return {
      baseline: clone(this.baseline),
      conflictRevision: this.conflictRevision,
      current: clone(this.current),
      draftVersion: this.draftVersion,
      errorMessage: this.errorMessage,
      isDirty: this.isDirty(),
      savedAt: this.savedAt,
      savedRevision: this.savedRevision,
      status: this.status,
    };
  }

  updateDraft(next: T) {
    if (areEqual(next, this.current)) return;
    this.current = clone(next);
    this.draftVersion += 1;
    this.errorMessage = null;

    if (this.active) {
      if (this.autoSaveEnabled) this.pendingReason = "auto";
      this.emit();
      return;
    }
    if (this.status !== "conflict") {
      this.status = this.autoSaveEnabled ? "debounce-pending" : "dirty";
      if (this.autoSaveEnabled) this.schedule();
    }
    this.emit();
  }

  setAutoSaveEnabled(enabled: boolean) {
    this.autoSaveEnabled = enabled;
    if (!enabled) {
      this.clearTimer();
      if (this.pendingReason === "auto") this.pendingReason = null;
      if (!this.active && this.status !== "conflict" && this.isDirty()) this.status = "dirty";
      this.emit();
      return;
    }
    if (!this.active && this.status !== "conflict" && this.isDirty()) this.schedule();
    this.emit();
  }

  saveNow() {
    this.clearTimer();
    return this.request("manual");
  }

  flush() {
    this.clearTimer();
    return this.request("navigation-flush");
  }

  retry() {
    return this.request("manual");
  }

  /** Lets navigation await an already-submitted snapshot without scheduling another write. */
  waitForActive() {
    return this.active ?? Promise.resolve(true);
  }

  /** Called only after the UI has fetched the latest authoritative server draft. */
  adoptLatest(server: T, savedRevision: number, savedAt: string | null) {
    this.clearTimer();
    this.baseline = clone(server);
    this.current = clone(server);
    this.savedRevision = savedRevision;
    this.savedAt = savedAt;
    this.conflictRevision = null;
    this.errorMessage = null;
    this.pendingReason = null;
    this.status = "clean";
    this.emit();
  }

  /** Prepares a validated merged draft against the latest authoritative revision. */
  prepareReconciledDraft(server: T, merged: T, savedRevision: number, savedAt: string | null) {
    this.clearTimer();
    this.baseline = clone(server);
    this.current = clone(merged);
    this.draftVersion += 1;
    this.savedRevision = savedRevision;
    this.savedAt = savedAt;
    this.conflictRevision = null;
    this.errorMessage = null;
    this.status = this.isDirty() ? "dirty" : "clean";
    this.emit();
  }

  saveReconciled(reason: "conflict-merge" | "explicit-keep-local") {
    return this.request(reason);
  }

  dispose() {
    this.clearTimer();
  }

  private schedule() {
    this.clearTimer();
    if (!this.autoSaveEnabled || !this.isDirty() || this.active) return;
    this.status = "debounce-pending";
    this.timer = this.scheduler.set(() => {
      this.timer = null;
      // The setting is intentionally re-read when the callback fires.
      if (this.autoSaveEnabled) void this.request("auto");
    }, this.options.debounceMs);
  }

  private clearTimer() {
    if (this.timer) this.scheduler.clear(this.timer);
    this.timer = null;
  }

  private request(reason: DraftSaveReason): Promise<boolean> {
    if (
      this.status === "conflict" &&
      reason !== "conflict-merge" &&
      reason !== "explicit-keep-local"
    ) {
      return Promise.resolve(false);
    }
    if (this.active) {
      this.pendingReason = reason;
      return this.active;
    }
    if (!this.isDirty()) {
      this.status = "clean";
      this.emit();
      return Promise.resolve(true);
    }

    const run = this.run(reason);
    this.active = run;
    return run;
  }

  private async run(firstReason: DraftSaveReason): Promise<boolean> {
    let reason: DraftSaveReason | null = firstReason;
    try {
      while (reason) {
        const snapshot = clone(this.current);
        const snapshotVersion = this.draftVersion;
        const expectedRevision = this.savedRevision;
        const attemptId = ++this.saveAttemptId;
        this.status = "saving";
        this.errorMessage = null;
        this.emit();

        let response: DraftSaveResponse<T>;
        let retries = 0;
        do {
          response = await this.options.persist({
          content: snapshot,
          expectedRevision,
          mutationId: createMutationId(),
            reason,
            saveAttemptId: attemptId,
          });
          if (response.status !== "failed" || reason !== "auto" || !response.retryable) break;
          retries += 1;
        } while (retries <= MAX_AUTOMATIC_RETRIES);

        if (response.status === "failed") {
          this.status = "failed";
          this.errorMessage = response.error;
          this.emit();
          return false;
        }
        if (response.status === "conflict") {
          this.status = "conflict";
          this.conflictRevision = response.serverRevision;
          this.errorMessage = "Another saved version was found. Review the conflict before saving.";
          this.pendingReason = null;
          this.emit();
          return false;
        }

        this.baseline = snapshot;
        this.savedRevision = response.savedRevision;
        this.savedAt = response.savedAt;
        this.conflictRevision = null;
        this.errorMessage = null;
        const saved = this.options.onSaved?.(clone(snapshot), response.savedAt, response.savedRevision);
        if (saved) await saved;

        const pending = this.pendingReason;
        this.pendingReason = null;
        if (!this.isDirty()) {
          this.status = "clean";
          this.emit();
          return true;
        }
        if (pending && (pending !== "auto" || this.autoSaveEnabled)) {
          reason = pending;
          continue;
        }
        this.status = "dirty";
        if (this.autoSaveEnabled && this.draftVersion > snapshotVersion) this.schedule();
        this.emit();
        return true;
      }
      return true;
    } finally {
      this.active = null;
      this.emit();
    }
  }

  private isDirty() {
    return !areEqual(this.current, this.baseline);
  }

  private emit() {
    this.options.onChange?.();
  }
}

function createMutationId() {
  return typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function areEqual(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}
