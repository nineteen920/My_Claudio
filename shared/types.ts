export type PlaybackStatus = 'idle' | 'loading' | 'paused' | 'playing' | 'error';

export type FeedbackType =
  | 'like'
  | 'dislike'
  | 'skip'
  | 'save'
  | 'too-loud'
  | 'too-sad';

export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl?: string;
  audioUrl: string;
  durationSeconds: number;
  source: string;
  tags: string[];
}

export interface WeatherSummary {
  condition: string;
  temperatureC: number;
  summary: string;
}

export interface CalendarEvent {
  title: string;
  startsAt: string;
  endsAt: string;
}

export interface CalendarSummary {
  date: string;
  events: CalendarEvent[];
}

export interface HistoryItem {
  songId: string;
  title: string;
  artist: string;
  reason: string;
  playedAt: string;
}

export interface FeedbackItem {
  id: string;
  type: FeedbackType;
  note?: string;
  songId?: string;
  createdAt: string;
}

export interface RadioContext {
  userPrompt?: string;
  tasteProfile: string;
  routines: string;
  moodRules: string;
  weather: WeatherSummary;
  calendar: CalendarSummary;
  history: HistoryItem[];
  feedback: FeedbackItem[];
  candidates: Song[];
}

export interface RadioDecision {
  song: Song;
  reason: string;
  mood: string;
  segueText: string;
  confidence: number;
  provider: string;
}

export interface RadioTrack extends RadioDecision {
  generatedAt: string;
  ttsAudioUrl?: string;
}

export interface EnvironmentSummary {
  scene: string;
  weather: WeatherSummary;
  calendar: CalendarSummary;
}

export interface RadioState {
  status: PlaybackStatus;
  current?: RadioTrack;
  environment: EnvironmentSummary;
  history: HistoryItem[];
  feedback: FeedbackItem[];
  updatedAt: string;
  error?: string;
}

export interface FeedbackInput {
  type: FeedbackType;
  note?: string;
}
