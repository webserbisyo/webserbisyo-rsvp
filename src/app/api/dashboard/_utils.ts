import { AuthenticationError, PermissionError } from "@/lib/permissions";

const DASHBOARD_DTO_HEADERS = {
  "Cache-Control": "private, no-store",
} as const;

export function dashboardJson<T>(data: T, init?: ResponseInit) {
  return Response.json(
    {
      data,
      ok: true,
    },
    {
      ...init,
      headers: {
        ...DASHBOARD_DTO_HEADERS,
        ...init?.headers,
      },
    },
  );
}

export function dashboardErrorJson(error: unknown, scope: string) {
  if (error instanceof AuthenticationError) {
    return safeErrorJson("unauthorized", "Please sign in again to continue.", 401);
  }

  if (error instanceof PermissionError) {
    return safeErrorJson(
      "forbidden",
      "You do not have permission to view this dashboard data.",
      403,
    );
  }

  console.error(`[api/dashboard/${scope}] Dashboard DTO failed`, {
    name: error instanceof Error ? error.name : "UnknownError",
  });

  return safeErrorJson("internal_error", "Dashboard data could not be loaded.", 500);
}

function safeErrorJson(error: string, message: string, status: number) {
  return Response.json(
    {
      error,
      message,
      ok: false,
    },
    {
      headers: DASHBOARD_DTO_HEADERS,
      status,
    },
  );
}
