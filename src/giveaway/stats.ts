/**
 * Represents the statistics for the giveaway participation process.
 */
export type Stats = {
  total: number;
  participated: number;
  alreadyParticipated: number;
  timeout: number;
  errors: number;
};

export type StatsListener = (changed: keyof Stats, value: number, total: number) => void;

/**
 * Manages the statistics for the giveaway participation process.
 * Allows listeners to be notified on every change.
 */
export class StatsManager {
  private stats: Stats;

  constructor(callback?: StatsListener) {
    this.stats = new Proxy(
      {
        total: 0,
        participated: 0,
        alreadyParticipated: 0,
        timeout: 0,
        errors: 0,
      },
      {
        set: (target, prop, value) => {
          target[prop as keyof Stats] = value;
          if (callback) callback(prop as keyof Stats, value as number, target.total);
          return true;
        },
      }
    );
  }

  increment(key: keyof Stats) {
    this.stats[key]++;
  }

  set(key: keyof Stats, value: number) {
    this.stats[key] = value;
  }
}
