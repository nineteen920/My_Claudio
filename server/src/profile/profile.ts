import fs from 'node:fs/promises';
import path from 'node:path';
import type { CalendarSummary, Song } from '../../../shared/types';

export interface ProfileBundle {
  tasteProfile: string;
  routines: string;
  moodRules: string;
  playlists: Song[];
}

const fallbackSongs: Song[] = [
  {
    id: 'song-rain',
      title: '雨中循环',
      artist: 'Claudio 档案',
      album: '十四年歌单',
    audioUrl: '/mock-audio/rain-loop.mp3',
    durationSeconds: 188,
    source: 'mock',
    tags: ['rain', 'focus', 'warm']
  }
];

async function readText(filePath: string, fallback: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return fallback;
  }
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

export async function loadProfile(dataDir: string): Promise<ProfileBundle> {
  const profileDir = path.join(dataDir, 'profile');
  const [tasteProfile, routines, moodRules, playlists] = await Promise.all([
    readText(
      path.join(profileDir, 'taste.md'),
      '十四年的歌单沉淀：偏爱旋律清楚、情绪有层次、适合长时间陪伴的音乐。'
    ),
    readText(path.join(profileDir, 'routines.md'), '上午专注工作，夜间适合低照度、低刺激音乐。'),
    readText(path.join(profileDir, 'mood-rules.md'), '雨天偏温暖，写代码偏稳定节拍，睡前避免强鼓点。'),
    readJson<Song[]>(path.join(profileDir, 'playlists.json'), fallbackSongs)
  ]);

  return { tasteProfile, routines, moodRules, playlists };
}

export function getMockCalendar(now = new Date()): CalendarSummary {
  const date = now.toISOString().slice(0, 10);
  return {
    date,
    events: [
      { title: '写代码', startsAt: '09:00', endsAt: '12:00' },
      { title: '整理歌单记忆', startsAt: '20:30', endsAt: '21:00' }
    ]
  };
}
