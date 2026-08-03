export type DraftPath = readonly string[];

export type DraftThreeWayMergeResult<T> = {
  localChanges: DraftPath[];
  overlappingPaths: DraftPath[];
  serverChanges: DraftPath[];
  merged: T;
};

const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Calculates a conservative object merge. Arrays are treated as indivisible values so
 * two editors cannot silently combine reordered or independently inserted items.
 */
export function mergeEventWebsiteDraftThreeWay<T>(input: {
  base: T;
  local: T;
  server: T;
}): DraftThreeWayMergeResult<T> {
  assertSafeValue(input.base);
  assertSafeValue(input.local);
  assertSafeValue(input.server);

  const localChanges = collectChangedPaths(input.base, input.local);
  const serverChanges = collectChangedPaths(input.base, input.server);
  const overlappingPaths = localChanges.filter((localPath) =>
    serverChanges.some((serverPath) => pathsOverlap(localPath, serverPath)),
  );
  const merged = applyPaths(input.server, input.local, localChanges);

  return { localChanges, merged, overlappingPaths, serverChanges };
}

export function hasOverlappingDraftChanges<T>(input: { base: T; local: T; server: T }) {
  return mergeEventWebsiteDraftThreeWay(input).overlappingPaths.length > 0;
}

export function assertSafeEventWebsiteDraftMergeValue(value: unknown): void {
  assertSafeValue(value);
}

function collectChangedPaths(base: unknown, next: unknown, path: string[] = []): DraftPath[] {
  if (areEqual(base, next)) return [];
  if (!isPlainRecord(base) || !isPlainRecord(next) || Array.isArray(base) || Array.isArray(next)) {
    return [path];
  }

  const keys = new Set([...Object.keys(base), ...Object.keys(next)]);
  const paths: DraftPath[] = [];
  for (const key of [...keys].sort()) {
    rejectUnsafeKey(key);
    paths.push(...collectChangedPaths(base[key], next[key], [...path, key]));
  }
  return paths;
}

function applyPaths<T>(server: T, local: T, paths: DraftPath[]): T {
  const target = clone(server) as unknown;
  if (paths.some((path) => path.length === 0)) return clone(local);
  for (const path of paths) applyPath(target, local, path);
  return target as T;
}

function applyPath(target: unknown, source: unknown, path: DraftPath) {
  if (!isPlainRecord(target) || !isPlainRecord(source)) {
    throw new Error("Cannot apply a draft merge path to a non-object value.");
  }

  let targetCursor = target;
  let sourceCursor = source;
  for (const key of path.slice(0, -1)) {
    rejectUnsafeKey(key);
    const sourceValue = sourceCursor[key];
    if (!isPlainRecord(sourceValue)) {
      throw new Error("Cannot traverse an unsafe draft merge path.");
    }
    if (!isPlainRecord(targetCursor[key])) targetCursor[key] = {};
    targetCursor = targetCursor[key] as Record<string, unknown>;
    sourceCursor = sourceValue;
  }

  const key = path[path.length - 1]!;
  rejectUnsafeKey(key);
  if (Object.hasOwn(sourceCursor, key)) {
    targetCursor[key] = clone(sourceCursor[key]);
  } else {
    delete targetCursor[key];
  }
}

function pathsOverlap(left: DraftPath, right: DraftPath) {
  const length = Math.min(left.length, right.length);
  return left.slice(0, length).every((part, index) => part === right[index]);
}

function assertSafeValue(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(assertSafeValue);
    return;
  }
  if (!isPlainRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    rejectUnsafeKey(key);
    assertSafeValue(child);
  }
}

function rejectUnsafeKey(key: string) {
  if (UNSAFE_KEYS.has(key)) throw new Error(`Unsafe draft merge key: ${key}`);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function areEqual(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}
