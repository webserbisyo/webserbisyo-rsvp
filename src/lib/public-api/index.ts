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
