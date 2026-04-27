import type { RadioContext, RadioDecision, Song } from '../../../../shared/types';
import type { LlmProvider } from './types';

function scoreSong(song: Song, context: RadioContext): number {
  const text = [
    context.userPrompt,
    context.weather.condition,
    context.weather.summary,
    context.tasteProfile,
    context.moodRules
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return song.tags.reduce((score, tag) => {
    if (text.includes(tag.toLowerCase())) return score + 3;
    if (tag === 'rain' && text.includes('雨')) return score + 3;
    if (tag === 'focus' && /写代码|专注|coding|code/.test(text)) return score + 3;
    if (tag === 'night' && /夜|晚上|睡前/.test(text)) return score + 2;
    return score + 1;
  }, 0);
}

function chooseSong(context: RadioContext): Song {
  const [first] = [...context.candidates].sort((a, b) => scoreSong(b, context) - scoreSong(a, context));
  if (!first) {
    throw new Error('没有可用候选歌曲');
  }
  return first;
}

export function createMockLlmProvider(): LlmProvider {
  return {
    async recommend(context) {
      const song = chooseSong(context);
      const prompt = context.userPrompt ?? '自动电台';
      const rainy = context.weather.summary.includes('雨') || context.weather.condition.includes('rain');
      const coding = /写代码|专注|coding|code/.test(prompt);
      const reasonParts = [
        rainy ? '雨天需要一点温暖但不黏腻的空气感' : '现在适合把情绪放轻一点',
        coding ? '写代码时稳定节拍比强刺激更可靠' : '这首歌能接住当前场景'
      ];

      const decision: RadioDecision = {
        song,
        reason: `${reasonParts.join('，')}，所以从十四年的歌单里挑了《${song.title}》。`,
        mood: song.tags.join(' / '),
        segueText: `这里是 Claudio，把十四年的歌单压成这一刻的电台。下一首是 ${song.artist} 的《${song.title}》。`,
        confidence: 0.86,
        provider: 'mock'
      };

      return decision;
    }
  };
}
