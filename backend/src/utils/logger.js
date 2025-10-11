const formatArgs = (args) => args.map((arg) => {
  if (arg instanceof Error) {
    return arg.stack ?? arg.message;
  }
  if (typeof arg === 'object') {
    return JSON.stringify(arg);
  }
  return arg;
});

const logger = {
  info: (...args) => console.log('[INFO]', ...formatArgs(args)),
  warn: (...args) => console.warn('[WARN]', ...formatArgs(args)),
  error: (...args) => console.error('[ERROR]', ...formatArgs(args)),
};

export default logger;
