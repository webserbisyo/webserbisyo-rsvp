import { NextResponse } from "next/server";

export function notImplementedJson(scope: string) {
  return NextResponse.json(
    {
      status: "not_implemented",
      scope,
      message: "Foundation scaffold placeholder.",
    },
    { status: 501 },
  );
}

export function publicApiSuccessJson<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function publicApiErrorJson({
  code,
  fieldErrors,
  message,
  scope,
  status,
}: {
  code: string;
  fieldErrors?: Record<string, string[] | undefined>;
  message: string;
  scope: string;
  status: number;
}) {
  return NextResponse.json(
    {
      error: {
        code,
        ...(fieldErrors ? { fieldErrors } : {}),
        message,
        scope,
      },
    },
    { status },
  );
}

export function notFoundJson(scope: string, message = "Resource not found.") {
  return publicApiErrorJson({
    code: "not_found",
    message,
    scope,
    status: 404,
  });
}
