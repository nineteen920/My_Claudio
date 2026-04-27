import { silentWavDataUrl } from '../music/mockMusicProvider';
import type { TtsProvider } from './types';

export function createMockTtsProvider(): TtsProvider {
  return {
    async speak() {
      return silentWavDataUrl;
    }
  };
}
