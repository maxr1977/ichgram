const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

const UNITS = [
  { threshold: YEAR, divisor: YEAR, suffix: 'yr.' },
  { threshold: MONTH, divisor: MONTH, suffix: 'mo.' },
  { threshold: WEEK, divisor: WEEK, suffix: 'wk.' },
  { threshold: DAY, divisor: DAY, suffix: 'd.' },
  { threshold: HOUR, divisor: HOUR, suffix: 'h.' },
  { threshold: MINUTE, divisor: MINUTE, suffix: 'min.' },
];

export const formatShortTimeAgo = (value) => {
  if (!value) {
    return '';
  }

  const timestamp = typeof value === 'number' ? value : new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return '';
  }

  const now = Date.now();
  const diff = Math.max(0, now - timestamp);

  if (diff < MINUTE) {
    return 'now';
  }

  for (const unit of UNITS) {
    if (diff >= unit.threshold) {
      const amount = Math.floor(diff / unit.divisor);
      return `${amount} ${unit.suffix}`;
    }
  }

  const minutes = Math.max(1, Math.floor(diff / MINUTE));
  return `${minutes} min.`;
};

export default formatShortTimeAgo;
