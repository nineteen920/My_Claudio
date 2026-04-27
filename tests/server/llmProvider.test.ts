import { describe, expect, it } from 'vitest';
import { createLlmProvider } from '../../server/src/adapters/llm/createLlmProvider';
import type { RadioContext } from '../../shared/types';

const context: RadioContext = {
  userPrompt: '来点雨天适合写代码的歌',
  tasteProfile: '喜欢旋律清楚、鼓点克制、适合长时间专注的歌。',
  routines: '上午写代码，晚上适合安静回顾。',
  moodRules: '雨天偏向温暖、低速、不过分悲伤。',
  weather: {
    condition: 'rain',
    temperatureC: 18,
    summary: '小雨，空气潮湿'
  },
  calendar: {
    date: '2026-04-27',
    events: [{ title: '写代码', startsAt: '09:00', endsAt: '12:00' }]
  },
  history: [],
  feedback: [],
  candidates: [
    {
      id: 'song-rain',
      title: '雨中循环',
      artist: 'Claudio 档案',
      album: '十四年歌单',
      audioUrl: '/mock-audio/rain-loop.mp3',
      durationSeconds: 188,
      source: 'mock',
      tags: ['rain', 'focus', 'warm']
    }
  ]
};

describe('createLlmProvider', () => {
  it('returns a mock provider that produces a valid radio decision', async () => {
    const provider = createLlmProvider({
      provider: 'mock',
      model: 'mock-radio-dj'
    });

    const decision = await provider.recommend(context);

    expect(decision.song.id).toBe('song-rain');
    expect(decision.reason).toContain('雨');
    expect(decision.segueText.length).toBeGreaterThan(10);
    expect(decision.confidence).toBeGreaterThanOrEqual(0.5);
    expect(decision.confidence).toBeLessThanOrEqual(1);
  });

  it('falls back to the mock provider when an OpenAI-compatible provider has no API key', async () => {
    const provider = createLlmProvider({
      provider: 'openai-compatible',
      baseUrl: 'https://example.invalid/v1',
      model: 'demo-model'
    });

    const decision = await provider.recommend(context);

    expect(decision.provider).toBe('mock');
    expect(decision.song.title).toBe('雨中循环');
  });
});
