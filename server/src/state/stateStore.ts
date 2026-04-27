import type { FeedbackItem, RadioState } from '../../../shared/types';

export interface StateStore {
  readState(): Promise<RadioState>;
  writeState(state: RadioState): Promise<void>;
  updateState(updater: (state: RadioState) => RadioState): Promise<RadioState>;
}

export const initialState: RadioState = {
  status: 'idle',
  environment: {
    scene: '待机',
    weather: {
      condition: 'unknown',
      temperatureC: 0,
      summary: '等待天气上下文'
    },
    calendar: {
      date: new Date().toISOString().slice(0, 10),
      events: []
    }
  },
  history: [],
  feedback: [],
  updatedAt: new Date(0).toISOString()
};

export function createFeedbackId(feedback: FeedbackItem[]): string {
  return `fb-${feedback.length + 1}-${Date.now().toString(36)}`;
}
