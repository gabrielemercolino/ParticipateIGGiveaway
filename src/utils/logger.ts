const PREFIX = '[IG-Giveaway]';

export function logInfo(...args: unknown[]) {
  console.log(`%c${PREFIX}`, 'color: #82df4d; font-weight: bold', ...args);
}

export function logWarn(...args: unknown[]) {
  console.warn(`%c${PREFIX}`, 'color: orange; font-weight: bold', ...args);
}

export function logError(...args: unknown[]) {
  console.error(`%c${PREFIX}`, 'color: #ff3235; font-weight: bold', ...args);
}
