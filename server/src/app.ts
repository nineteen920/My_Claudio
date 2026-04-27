import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import Fastify from 'fastify';
import { z } from 'zod';
import { createLlmProvider } from './adapters/llm/createLlmProvider';
import { createMusicProvider } from './adapters/music/createMusicProvider';
import { createTtsProvider } from './adapters/tts/createTtsProvider';
import { createWeatherProvider } from './adapters/weather/createWeatherProvider';
import { loadConfig, type AppConfig } from './config';
import { createRadioEngine } from './core/radioEngine';
import { getMockCalendar, loadProfile } from './profile/profile';
import { createJsonStore } from './state/jsonStore';
import { createMemoryStore } from './state/memoryStore';

const chatSchema = z.object({
  message: z.string().min(1)
});

const feedbackSchema = z.object({
  type: z.enum(['like', 'dislike', 'skip', 'save', 'too-loud', 'too-sad']),
  note: z.string().optional()
});

export interface BuildServerOptions {
  config?: AppConfig;
  useMemoryStore?: boolean;
}

export async function buildServer(options: BuildServerOptions = {}) {
  const config = options.config ?? loadConfig();
  const app = Fastify({ logger: false });
  const store = options.useMemoryStore ? createMemoryStore() : createJsonStore(config.dataDir);
  const profile = () => loadProfile(config.dataDir);
  const engine = createRadioEngine({
    store,
    profile,
    llm: createLlmProvider(config.llm),
    music: createMusicProvider(config.music),
    tts: createTtsProvider(config.tts),
    weather: createWeatherProvider(config.weather)
  });

  await app.register(cors, { origin: true });
  await app.register(websocket);

  type StreamSocket = {
    send: (payload: string) => void;
    on?: (event: 'close', callback: () => void) => void;
    readyState?: number;
  };

  const sockets = new Set<StreamSocket>();

  async function broadcastState() {
    const state = await engine.now();
    const payload = JSON.stringify({ type: 'state', state });
    for (const socket of sockets) {
      try {
        socket.send(payload);
      } catch {
        sockets.delete(socket);
      }
    }
  }

  app.get('/api/health', async () => ({ ok: true }));

  app.get('/api/now', async () => engine.now());

  app.get('/api/next', async () => {
    const state = await engine.next();
    await broadcastState();
    return state;
  });

  app.post('/api/chat', async (request, reply) => {
    const parsed = chatSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'message 不能为空' });
    }

    const state = await engine.chat(parsed.data.message);
    await broadcastState();
    return state;
  });

  app.post('/api/feedback', async (request, reply) => {
    const parsed = feedbackSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: '反馈类型无效' });
    }

    const state = await engine.feedback(parsed.data);
    await broadcastState();
    return state;
  });

  app.post('/api/status', async (request, reply) => {
    const parsed = z.object({ status: z.enum(['idle', 'loading', 'paused', 'playing', 'error']) }).safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: '播放状态无效' });
    }

    const state = await engine.setStatus(parsed.data.status);
    await broadcastState();
    return state;
  });

  app.get('/api/taste', async () => {
    const bundle = await profile();
    return {
      tasteProfile: bundle.tasteProfile,
      routines: bundle.routines,
      moodRules: bundle.moodRules,
      songs: bundle.playlists.length
    };
  });

  app.get('/api/calendar/today', async () => getMockCalendar(new Date()));

  app.get('/stream', { websocket: true } as never, (socket: StreamSocket) => {
    sockets.add(socket);
    engine
      .now()
      .then((state) => socket.send(JSON.stringify({ type: 'state', state })))
      .catch(() => sockets.delete(socket));
    socket.send(JSON.stringify({ type: 'event', message: 'Claudio 电台流已连接' }));
    socket.on?.('close', () => sockets.delete(socket));
  });

  return app;
}
