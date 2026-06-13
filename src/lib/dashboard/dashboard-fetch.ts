export class DashboardFetchError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "DashboardFetchError";
    this.status = status;
  }
}

type DashboardSuccessPayload<T> = {
  data: T;
  ok: true;
};

type DashboardErrorPayload = {
  error?: string;
  message?: string;
  ok: false;
};

export async function fetchDashboardDto<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
    },
  });
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new DashboardFetchError(getSafeErrorMessage(payload, response.status), response.status);
  }

  if (!isDashboardSuccessPayload<T>(payload)) {
    throw new DashboardFetchError("Dashboard data could not be loaded.", response.status);
  }

  return payload.data;
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getSafeErrorMessage(payload: unknown, status: number) {
  if (isDashboardErrorPayload(payload)) {
    return payload.message || payload.error || getFallbackMessage(status);
  }

  return getFallbackMessage(status);
}

function getFallbackMessage(status: number) {
  if (status === 401) {
    return "Please sign in again to continue.";
  }

  if (status === 403) {
    return "You do not have permission to view this dashboard data.";
  }

  return "Dashboard data could not be loaded.";
}

function isDashboardSuccessPayload<T>(payload: unknown): payload is DashboardSuccessPayload<T> {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "ok" in payload &&
      (payload as { ok?: unknown }).ok === true &&
      "data" in payload,
  );
}

function isDashboardErrorPayload(payload: unknown): payload is DashboardErrorPayload {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "ok" in payload &&
      (payload as { ok?: unknown }).ok === false,
  );
}
