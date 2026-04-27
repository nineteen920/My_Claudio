import type { Song } from '../../../../shared/types';
import type { MusicProvider } from './types';

export const silentWavDataUrl =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';

const archiveSongs: Song[] = [
  {
    id: 'song-rain',
    title: '雨中循环',
    artist: 'Claudio 档案',
    album: '十四年歌单',
    audioUrl: silentWavDataUrl,
    durationSeconds: 188,
    source: 'mock',
    tags: ['rain', 'focus', 'warm']
  },
  {
    id: 'song-night',
    title: '夜灯书桌',
    artist: 'Claudio 档案',
    album: '夜间档案',
    audioUrl: silentWavDataUrl,
    durationSeconds: 214,
    source: 'mock',
    tags: ['night', 'soft', 'memory']
  },
  {
    id: 'song-commute',
    title: '靠窗信号',
    artist: 'Claudio 档案',
    album: '移动的日子',
    audioUrl: silentWavDataUrl,
    durationSeconds: 201,
    source: 'mock',
    tags: ['morning', 'bright', 'city']
  }
];

function normalizeSong(song: Song): Song {
  return {
    ...song,
    audioUrl: song.audioUrl.startsWith('/mock-audio') ? silentWavDataUrl : song.audioUrl,
    tags: song.tags.length > 0 ? song.tags : ['archive']
  };
}

export function createMockMusicProvider(): MusicProvider {
  return {
    async getCandidates({ profileSongs }) {
      const combined = [...profileSongs, ...archiveSongs].map(normalizeSong);
      const seen = new Set<string>();
      return combined.filter((song) => {
        if (seen.has(song.id)) return false;
        seen.add(song.id);
        return true;
      });
    },
    async resolvePlayableSong(song) {
      return normalizeSong(song);
    }
  };
}
