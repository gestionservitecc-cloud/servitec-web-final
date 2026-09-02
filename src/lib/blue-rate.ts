export function resolveBlueReferenceFactor(base: number, reference: number) {
  if (!Number.isFinite(base) || base <= 0) return 1;
  if (!Number.isFinite(reference) || reference <= 0) return 1;
  return reference / base;
}
