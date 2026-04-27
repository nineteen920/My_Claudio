import type {
  FeedbackInput,
  FeedbackItem,
  HistoryItem,
  RadioContext,
  RadioState
} from '../../../shared/types';
import type { LlmProvider } from '../adapters/llm/types';
import type { MusicProvider } from '../adapters/music/types';
import type { TtsProvider } from '../adapters/tts/types';
import type { WeatherProvider } from '../adapters/weather/types';
import type { ProfileBundle } from '../profile/profile';
import { getMockCalendar } from '../profile/profile';
import { createFeedbackId, type StateStore } from '../state/stateStore';

export interface RadioEngineDeps {
  store: StateStore;
  llm: LlmProvider;
  music: MusicProvider;
  tts: TtsProvider;
  weather: WeatherProvider;
  profile?: () => Promise<ProfileBundle>;
  clock?: () => Date;
}

export interface NextOptions {
  prompt?: string;
}

function sceneFor(now: Date): string {
  const hour = now.getHours();
  if (hour >= 7 && hour < 12) return '专注';
  if (hour >= 12 && hour < 18) return '午后';
  if (hour >= 18 && hour < 23) return '夜间';
  return '安静';
}

function trimHistory(history: HistoryItem[]): HistoryItem[] {
  return history.slice(-30);
}

export function createRadioEngine(deps: RadioEngineDeps) {
  const clock = deps.clock ?? (() => new Date());

  async function now(): Promise<RadioState> {
    return deps.store.readState();
  }

  async function next(options: NextOptions = {}): Promise<RadioState> {
    const currentState = await deps.store.readState();
    const profile =
      deps.profile !== undefined
        ? await deps.profile()
        : {
            tasteProfile: '十四年的歌单沉淀：偏爱旋律清楚、情绪有层次、适合长时间陪伴的音乐。',
            routines: '上午专注工作，夜间适合低照度、低刺激音乐。',
            moodRules: '雨天偏温暖，写代码偏稳定节拍，睡前避免强鼓点。',
            playlists: []
          };
    const nowDate = clock();
    const weather = await deps.weather.getWeather(nowDate);
    const calendar = getMockCalendar(nowDate);
    const candidates = await deps.music.getCandidates({
      prompt: options.prompt,
      profileSongs: profile.playlists
    });

    const context: RadioContext = {
      userPrompt: options.prompt,
      tasteProfile: profile.tasteProfile,
      routines: profile.routines,
      moodRules: profile.moodRules,
      weather,
      calendar,
      history: currentState.history,
      feedback: currentState.feedback,
      candidates
    };
    const decision = await deps.llm.recommend(context);
    const playableSong = await deps.music.resolvePlayableSong(decision.song);
    const ttsAudioUrl = await deps.tts.speak(decision.segueText);
    const generatedAt = nowDate.toISOString();
    const track = {
      ...decision,
      song: playableSong,
      generatedAt,
      ttsAudioUrl
    };
    const historyItem: HistoryItem = {
      songId: playableSong.id,
      title: playableSong.title,
      artist: playableSong.artist,
      reason: decision.reason,
      playedAt: generatedAt
    };

    const nextState: RadioState = {
      status: 'paused',
      current: track,
      environment: {
        scene: sceneFor(nowDate),
        weather,
        calendar
      },
      history: trimHistory([...currentState.history, historyItem]),
      feedback: currentState.feedback,
      updatedAt: new Date().toISOString()
    };

    await deps.store.writeState(nextState);
    return nextState;
  }

  async function chat(message: string): Promise<RadioState> {
    return next({ prompt: message });
  }

  async function feedback(input: FeedbackInput): Promise<RadioState> {
    return deps.store.updateState((state) => {
      const item: FeedbackItem = {
        id: createFeedbackId(state.feedback),
        type: input.type,
        note: input.note,
        songId: state.current?.song.id,
        createdAt: new Date().toISOString()
      };
      return {
        ...state,
        feedback: [...state.feedback, item].slice(-80),
        updatedAt: new Date().toISOString()
      };
    });
  }

  async function setStatus(status: RadioState['status']): Promise<RadioState> {
    return deps.store.updateState((state) => ({
      ...state,
      status,
      updatedAt: new Date().toISOString()
    }));
  }

  return { now, next, chat, feedback, setStatus };
}
