import { describe, expect, it } from 'vitest';
import { createRadioEngine } from '../../server/src/core/radioEngine';
import { createMemoryStore } from '../../server/src/state/memoryStore';
import { createMockMusicProvider } from '../../server/src/adapters/music/mockMusicProvider';
import { createMockTtsProvider } from '../../server/src/adapters/tts/mockTtsProvider';
import { createMockWeatherProvider } from '../../server/src/adapters/weather/mockWeatherProvider';
import { createLlmProvider } from '../../server/src/adapters/llm/createLlmProvider';

describe('radioEngine', () => {
  it('generates a next track with song, reason, segue, weather, and persisted history', async () => {
    const store = createMemoryStore();
    const engine = createRadioEngine({
      store,
      llm: createLlmProvider({ provider: 'mock', model: 'mock-radio-dj' }),
      music: createMockMusicProvider(),
      tts: createMockTtsProvider(),
      weather: createMockWeatherProvider(),
      clock: () => new Date('2026-04-27T09:30:00+08:00')
    });

    const result = await engine.next({ prompt: '来点适合写代码的歌' });
    const state = await store.readState();

    expect(result.current?.song.title).toBeTruthy();
    expect(result.current?.reason).toContain('写代码');
    expect(result.current?.segueText).toContain('Claudio');
    expect(result.environment.weather.summary).toContain('雨');
    expect(state.history).toHaveLength(1);
    expect(state.history[0].songId).toBe(result.current?.song.id);
  });

  it('records feedback without losing the current track', async () => {
    const store = createMemoryStore();
    const engine = createRadioEngine({
      store,
      llm: createLlmProvider({ provider: 'mock', model: 'mock-radio-dj' }),
      music: createMockMusicProvider(),
      tts: createMockTtsProvider(),
      weather: createMockWeatherProvider(),
      clock: () => new Date('2026-04-27T21:30:00+08:00')
    });

    await engine.next({ prompt: '晚上放轻一点' });
    const feedbackState = await engine.feedback({ type: 'like', note: '这个方向对了' });

    expect(feedbackState.feedback).toHaveLength(1);
    expect(feedbackState.feedback[0].type).toBe('like');
    expect(feedbackState.current?.song.title).toBeTruthy();
  });
});
