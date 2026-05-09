export function epley(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function brzycki(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps >= 37) return 0;
  if (reps === 1) return weight;
  return weight * (36 / (37 - reps));
}

export function calc(weight: number, reps: number, formula: 'epley' | 'brzycki'): number {
  const raw = formula === 'brzycki' ? brzycki(weight, reps) : epley(weight, reps);
  return Math.round(raw * 10) / 10;
}

export function warmupWeight(workingWeight: number): number {
  return Math.round((workingWeight * 0.5) / 2.5) * 2.5;
}

export function backOffWeight(workingWeight: number): number {
  return Math.round((workingWeight * 0.9) / 2.5) * 2.5;
}
