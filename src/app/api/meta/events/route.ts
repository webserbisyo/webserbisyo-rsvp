import { NextResponse } from "next/server";
import {
  MetaAcquisitionEventSchema,
  getCanonicalSourcePath,
} from "@/lib/meta/acquisition-events";
import {
  getCanonicalMetaAcquisitionUrl,
  isAllowedMetaAcquisitionOrigin,
} from "@/lib/meta/acquisition-origin";
import { sendMetaCapiAcquisitionEvent } from "@/server/services/send-meta-capi-acquisition-event";

export async function POST(request: Request) {
  if (!isAllowedMetaAcquisitionOrigin(request)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > 4096) {
    return NextResponse.json({ ok: false }, { status: 413 });
  }

  const parsed = MetaAcquisitionEventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !getCanonicalSourcePath(parsed.data.sourcePath)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const clientIpAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;
  const clientUserAgent = request.headers.get("user-agent") ?? null;

  await sendMetaCapiAcquisitionEvent({
    ...parsed.data,
    clientIpAddress,
    clientUserAgent,
    eventSourceUrl: getCanonicalMetaAcquisitionUrl(request, parsed.data.sourcePath),
  });

  return NextResponse.json({ ok: true }, { status: 202 });
}
