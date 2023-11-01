export interface InProgressEpicData {
  name: string;
  workStartedTimestamp?: number;
}

export interface EpicData {
  name: string;
  description?: string;
}

export interface Preferences {
  templateEventUrl: string;
}
