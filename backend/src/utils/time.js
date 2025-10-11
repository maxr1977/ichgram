const UNIT_TO_MS = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

export const parseDurationToMs = (value) => {
  if (typeof value === 'number') {
    return value;
  }

  const regex = /^(\d+)([smhd])$/;
  const match = value?.toString().trim().match(regex);

  if (!match) {
    return 0;
  }

  const [, amount, unit] = match;
  return Number(amount) * (UNIT_TO_MS[unit] ?? 0);
};
