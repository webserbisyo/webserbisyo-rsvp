export type MetaPixelResolutionContext = "application_funnel";

export type MetaPixelCandidate = {
  id: string;
  isActive?: boolean;
  pixelId: string;
  trackingScope: string;
  updatedAt?: string | null;
};

const scopesByContext: Record<MetaPixelResolutionContext, readonly string[]> = {
  application_funnel: ["application", "global_public"],
};

/**
 * Selects exactly one Pixel for events that require a browser/CAPI pair.
 * Scope precedence is deliberate; updated_at is only a deterministic tie-breaker
 * within the same scope.
 */
export function resolveMetaPixelForContext(
  candidates: readonly MetaPixelCandidate[],
  context: MetaPixelResolutionContext,
) {
  const scopes = scopesByContext[context];

  return candidates
    .filter(
      (candidate) =>
        candidate.isActive !== false &&
        Boolean(candidate.pixelId.trim()) &&
        scopes.includes(candidate.trackingScope),
    )
    .sort((left, right) => {
      const scopeDifference =
        scopes.indexOf(left.trackingScope) - scopes.indexOf(right.trackingScope);

      if (scopeDifference !== 0) {
        return scopeDifference;
      }

      const updatedDifference = timestamp(right.updatedAt) - timestamp(left.updatedAt);

      if (updatedDifference !== 0) {
        return updatedDifference;
      }

      return left.id.localeCompare(right.id);
    })[0] ?? null;
}

function timestamp(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);

  return Number.isFinite(parsed) ? parsed : 0;
}
