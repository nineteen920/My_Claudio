import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../client/src/App';

const nextState = {
  status: 'paused',
  current: {
    song: {
      id: 'rain-loop',
      title: '雨中循环',
      artist: 'Claudio 档案',
      album: '十四年歌单',
      audioUrl: '/mock-audio/rain-loop.mp3',
      durationSeconds: 188,
      source: 'mock',
      tags: ['rain', 'focus']
    },
    reason: '雨天和写代码都需要一点稳定的节拍。',
    mood: 'rain focus',
    segueText: '这里是 Claudio，把十四年的歌单压成这一刻的电台。',
    confidence: 0.86,
    ttsAudioUrl: '/mock-tts/rain-loop.wav'
  },
  environment: {
    scene: '专注',
    weather: {
      condition: 'rain',
      temperatureC: 18,
      summary: '小雨，空气潮湿'
    },
    calendar: {
      date: '2026-04-27',
      events: [{ title: '写代码', startsAt: '09:00', endsAt: '12:00' }]
    }
  },
  history: [],
  feedback: [],
  updatedAt: '2026-04-27T01:30:00.000Z'
};

function mockFetch() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = input.toString();

    if (url.endsWith('/api/now')) {
      return Response.json({ ...nextState, status: 'idle', current: undefined });
    }

    if (url.endsWith('/api/next') || url.endsWith('/api/chat')) {
      return Response.json(nextState);
    }

    if (url.endsWith('/api/feedback')) {
      return Response.json({
        ...nextState,
        feedback: [{ id: 'f1', type: 'like', note: '喜欢', createdAt: nextState.updatedAt }]
      });
    }

    return Response.json({});
  });

  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal(
    'WebSocket',
    class {
      close() {}
    }
  );
  return fetchMock;
}

describe('App', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('loads the idle player, generates a next track, and records feedback', async () => {
    const fetchMock = mockFetch();
    const user = userEvent.setup();

    render(<App />);

    expect(await screen.findByText('Claudio')).toBeInTheDocument();
    expect(screen.getByText('等待第一首歌')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '下一首' }));

    expect(await screen.findByText('雨中循环')).toBeInTheDocument();
    expect(screen.getByText(/十四年的歌单/)).toBeInTheDocument();
    expect(screen.getByText(/雨天和写代码/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '喜欢' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/feedback',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});
