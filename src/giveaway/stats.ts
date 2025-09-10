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
type StatsListener = (stats: Stats) => void;

/**
 * Manages the statistics for the giveaway participation process.
 * Allows listeners to be notified on every change.
 */
export class StatsManager {
  private stats: Stats;
  private listeners: StatsListener[] = [];

  /**
   * Creates a new StatsManager with the given total number of giveaways.
   * @param total - The total number of giveaways to process.
   */
  constructor(total: number) {
    this.stats = {
      total,
      participated: 0,
      alreadyParticipated: 0,
      timeout: 0,
      errors: 0,
    };
  }

  /**
   * Registers a listener to be called whenever the stats change.
   * @param listener - The function to call on stats change.
   */
  onChange(listener: StatsListener) {
    this.listeners.push(listener);
  }

  /**
   * Notifies all registered listeners of the current stats.
   */
  private notify() {
    for (const l of this.listeners) l({ ...this.stats });
  }

  /**
   * Increments the participated count and notifies listeners.
   */
  incrementParticipated() {
    this.stats.participated++;
    this.notify();
  }

  /**
   * Increments the alreadyParticipated count and notifies listeners.
   */
  incrementAlreadyParticipated() {
    this.stats.alreadyParticipated++;
    this.notify();
  }

  /**
   * Increments the timeout count and notifies listeners.
   */
  incrementTimeout() {
    this.stats.timeout++;
    this.notify();
  }

  /**
   * Increments the errors count and notifies listeners.
   */
  incrementErrors() {
    this.stats.errors++;
    this.notify();
  }

  /**
   * Returns a copy of the current stats.
   * @returns The current stats object.
   */
  getStats(): Stats {
    return { ...this.stats };
  }

  /**
   * Sets the total number of giveaways and notifies listeners.
   * @param total - The new total number of giveaways.
   */
  setTotal(total: number) {
    this.stats.total = total;
    this.notify();
  }
}
