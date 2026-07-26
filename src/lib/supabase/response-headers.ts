type SupabaseResponseHeaders = Record<string, string> | undefined;

export function applySupabaseResponseHeaders(
  target: Headers,
  responseHeaders: SupabaseResponseHeaders,
) {
  if (!responseHeaders) {
    return;
  }

  for (const [name, value] of Object.entries(responseHeaders)) {
    target.set(name, value);
  }
}
