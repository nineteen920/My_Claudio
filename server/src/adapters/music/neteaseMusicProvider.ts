import type { Song } from '../../../../shared/types';
import { createMockMusicProvider } from './mockMusicProvider';
import type { MusicProvider } from './types';

export function createNeteaseMusicProvider(baseUrl?: string): MusicProvider {
  const fallback = createMockMusicProvider();

  if (!baseUrl) {
    return fallback;
  }

  return {
    async getCandidates({ prompt, profileSongs }) {
      try {
        const query = encodeURIComponent(prompt || profileSongs[0]?.title || '日推');
        const response = await fetch(`${baseUrl.replace(/\/$/, '')}/search?keywords=${query}&limit=8`);
        if (!response.ok) throw new Error(`网易云搜索失败：${response.status}`);
        const payload = (await response.json()) as {
          result?: {
            songs?: Array<{
              id: number;
              name: string;
              artists?: Array<{ name: string }>;
              album?: { name?: string };
              duration?: number;
            }>;
          };
        };

        const songs =
          payload.result?.songs?.map<Song>((song) => ({
            id: `netease-${song.id}`,
            title: song.name,
            artist: song.artists?.map((artist) => artist.name).join(' / ') || '未知艺人',
            album: song.album?.name,
            audioUrl: `${baseUrl.replace(/\/$/, '')}/song/url/v1?id=${song.id}&level=standard`,
            durationSeconds: Math.round((song.duration ?? 180000) / 1000),
            source: 'netease',
            tags: ['netease', 'archive']
          })) ?? [];

        return songs.length > 0 ? songs : fallback.getCandidates({ prompt, profileSongs });
      } catch {
        return fallback.getCandidates({ prompt, profileSongs });
      }
    },
    async resolvePlayableSong(song) {
      return song.source === 'netease' ? song : fallback.resolvePlayableSong(song);
    }
  };
}
