const PREFIX = '[IG-Giveaway]';

export function logInfo(...args: any[]) {
	console.log(`%c${PREFIX}`, 'color: #82df4d; font-weight: bold', ...args);
}

export function logWarn(...args: any[]) {
	console.warn(`%c${PREFIX}`, 'color: orange; font-weight: bold', ...args);
}

export function logError(...args: any[]) {
	console.error(`%c${PREFIX}`, 'color: #ff3235; font-weight: bold', ...args);
}
