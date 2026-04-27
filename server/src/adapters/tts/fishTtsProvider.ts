import { createMockTtsProvider } from './mockTtsProvider';
import type { TtsProvider } from './types';

export function createFishTtsProvider(config: { apiKey?: string; voiceId?: string }): TtsProvider {
  const fallback = createMockTtsProvider();

  if (!config.apiKey || !config.voiceId) {
    return fallback;
  }

  return {
    async speak(text) {
      try {
        const response = await fetch('https://api.fish.audio/v1/tts', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text,
            reference_id: config.voiceId,
            format: 'wav'
          })
        });

        if (!response.ok) throw new Error(`Fish Audio 请求失败：${response.status}`);
        const buffer = Buffer.from(await response.arrayBuffer());
        return `data:audio/wav;base64,${buffer.toString('base64')}`;
      } catch {
        return fallback.speak(text);
      }
    }
  };
}
