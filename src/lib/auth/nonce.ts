/**
 * Cryptographic Nonce Helper: Ensures strict 1:1 synchronization between
 * Google Identity Services (which requires a SHA-256 hashed nonce) and
 * Supabase GoTrue (which expects the raw unhashed nonce in signInWithIdToken).
 */
export async function generateNoncePair(): Promise<{ rawNonce: string; hashedNonce: string }> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const rawNonce = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");

  const encoder = new TextEncoder();
  const encoded = encoder.encode(rawNonce);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashedNonce = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return { rawNonce, hashedNonce };
}
