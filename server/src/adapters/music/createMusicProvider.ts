import type { AppConfig } from '../../config';
import { createMockMusicProvider } from './mockMusicProvider';
import { createNeteaseMusicProvider } from './neteaseMusicProvider';
import type { MusicProvider } from './types';

export function createMusicProvider(config: AppConfig['music']): MusicProvider {
  if (config.provider === 'netease') {
    return createNeteaseMusicProvider(config.neteaseBaseUrl);
  }

  return createMockMusicProvider();
}
