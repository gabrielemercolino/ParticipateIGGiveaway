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

/**
 * Listener type for stats changes.
 */
export type StatsListener = (
  changed: keyof Stats,
  value: number,
  total: number
) => void;

/**
 * Manages the statistics for the giveaway participation process.
 * Allows listeners to be notified on every change.
 */
export class StatsManager {
  private stats: Stats;

  /**
   * Creates a new StatsManager with the given total number of giveaways.
   * @param total - The total number of giveaways to process.
   * @param callback - Optional callback to be invoked on every stat change.
   */
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
          if (callback)
            callback(prop as keyof Stats, value as number, target.total);
          return true;
        },
      }
    );
  }

  /**
   * Increments the specified stat.
   */
  increment(key: keyof Stats) {
    this.stats[key]++;
  }

  /**
   * Sets the specified stat to a given value.
   */
  set(key: keyof Stats, value: number) {
    this.stats[key] = value;
  }
}
