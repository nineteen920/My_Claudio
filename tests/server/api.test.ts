import { describe, expect, it } from 'vitest';
import { buildServer } from '../../server/src/app';

describe('Claudio API', () => {
  it('serves now, next, chat, feedback, taste, and calendar endpoints', async () => {
    const app = await buildServer({ useMemoryStore: true });

    const now = await app.inject({ method: 'GET', url: '/api/now' });
    expect(now.statusCode).toBe(200);
    expect(now.json().status).toBe('idle');

    const next = await app.inject({ method: 'GET', url: '/api/next' });
    expect(next.statusCode).toBe(200);
    expect(next.json().current.song.title).toBeTruthy();

    const chat = await app.inject({
      method: 'POST',
      url: '/api/chat',
      payload: { message: '按现在的天气来一首' }
    });
    expect(chat.statusCode).toBe(200);
    expect(chat.json().current.reason).toBeTruthy();

    const feedback = await app.inject({
      method: 'POST',
      url: '/api/feedback',
      payload: { type: 'skip', note: '今天不想这么慢' }
    });
    expect(feedback.statusCode).toBe(200);
    expect(feedback.json().feedback.at(-1).type).toBe('skip');

    const taste = await app.inject({ method: 'GET', url: '/api/taste' });
    expect(taste.statusCode).toBe(200);
    expect(taste.json().tasteProfile).toContain('十四年');

    const calendar = await app.inject({ method: 'GET', url: '/api/calendar/today' });
    expect(calendar.statusCode).toBe(200);
    expect(calendar.json().events.length).toBeGreaterThan(0);

    await app.close();
  });
});
