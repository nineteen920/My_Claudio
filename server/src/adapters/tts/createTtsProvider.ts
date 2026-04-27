import type { AppConfig } from '../../config';
import { createFishTtsProvider } from './fishTtsProvider';
import { createMockTtsProvider } from './mockTtsProvider';
import type { TtsProvider } from './types';

export function createTtsProvider(config: AppConfig['tts']): TtsProvider {
  if (config.provider === 'fish') {
    return createFishTtsProvider({ apiKey: config.fishApiKey, voiceId: config.fishVoiceId });
  }

  return createMockTtsProvider();
}
