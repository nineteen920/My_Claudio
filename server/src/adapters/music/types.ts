import type { Song } from '../../../../shared/types';

export interface MusicProvider {
  getCandidates(input: { prompt?: string; profileSongs: Song[] }): Promise<Song[]>;
  resolvePlayableSong(song: Song): Promise<Song>;
}
