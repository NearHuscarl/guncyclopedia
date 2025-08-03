// https://chatgpt.com/share/688f83f3-92e0-8010-ae87-780c262d6050
export function computeMaxRicochetDamage(
  baseDamage: number,
  numberOfBounces: number,
  chanceToDieOnBounce: number,
  damageMultiplierOnBounce: number,
): number {
  const survivalChance = 1 - chanceToDieOnBounce;
  const finalDamage = baseDamage * damageMultiplierOnBounce;

  // Special case: if it always survives, just return N * bounce damage
  if (survivalChance === 1) {
    return numberOfBounces * finalDamage;
  }

  const s = survivalChance;
  const n = numberOfBounces;

  // Step 1: compute expected number of successful bounces using geometric sum
  const expectedBounces = (s * (1 - Math.pow(s, n))) / (1 - s);

  // Step 2: each bounce deals partial damage, so apply multiplier
  const expectedBounceDamage = expectedBounces * finalDamage;

  return expectedBounceDamage;
}
