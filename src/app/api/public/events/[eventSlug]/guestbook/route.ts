import { notImplementedJson } from "@/lib/public-api";

export async function GET() {
  return notImplementedJson("public-guestbook-read");
}

export async function POST() {
  return notImplementedJson("public-guestbook-submit");
}
