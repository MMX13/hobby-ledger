/** Ratings are 1 to 5. Times are in minutes, except weeklyHours. */
export interface Activity {
  id: string;
  name: string;
  tags: string[];
  /** How much you enjoy it while you're doing it. */
  enjoyment: number;
  /** How much you look forward to it beforehand. */
  anticipation: number;
  /** How you feel afterwards - the lasting part. */
  afterglow: number;
  /** How much effort it takes to actually do. 1 = none at all. */
  effort: number;
  /** The shortest session that's still worth doing. */
  minSession: number;
  /** The session length you'd choose if time weren't a problem. Optional. */
  idealSession: number | null;
  setup: number;
  teardown: number;
  /** Roughly how much time you spend on it in a normal week. */
  weeklyHours: number;
  notes: string;
  created: number;
  updated: number;
}

export type RatingKey = 'enjoyment' | 'anticipation' | 'afterglow' | 'effort';
