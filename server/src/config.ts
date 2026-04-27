import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export interface AppConfig {
  host: string;
  port: number;
  dataDir: string;
  llm: {
    provider: string;
    baseUrl?: string;
    apiKey?: string;
    model: string;
  };
  music: {
    provider: string;
    neteaseBaseUrl?: string;
  };
  tts: {
    provider: string;
    fishApiKey?: string;
    fishVoiceId?: string;
  };
  weather: {
    provider: string;
    openWeatherApiKey?: string;
    city: string;
  };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    host: env.HOST ?? '127.0.0.1',
    port: Number(env.PORT ?? 8787),
    dataDir: env.DATA_DIR ? path.resolve(env.DATA_DIR) : path.join(rootDir, 'data'),
    llm: {
      provider: env.LLM_PROVIDER ?? 'mock',
      baseUrl: env.LLM_BASE_URL,
      apiKey: env.LLM_API_KEY,
      model: env.LLM_MODEL ?? 'mock-radio-dj'
    },
    music: {
      provider: env.MUSIC_PROVIDER ?? 'mock',
      neteaseBaseUrl: env.NETEASE_API_BASE_URL
    },
    tts: {
      provider: env.TTS_PROVIDER ?? 'mock',
      fishApiKey: env.FISH_AUDIO_API_KEY,
      fishVoiceId: env.FISH_AUDIO_VOICE_ID
    },
    weather: {
      provider: env.WEATHER_PROVIDER ?? 'mock',
      openWeatherApiKey: env.OPENWEATHER_API_KEY,
      city: env.WEATHER_CITY ?? 'Shanghai'
    }
  };
}
