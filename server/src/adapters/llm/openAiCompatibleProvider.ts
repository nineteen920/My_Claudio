import type { RadioContext, RadioDecision } from '../../../../shared/types';
import { createMockLlmProvider } from './mockLlmProvider';
import type { LlmProvider, LlmProviderConfig } from './types';

function extractJson(text: string): unknown {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const raw = fenced?.[1] ?? text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('LLM 响应没有包含 JSON');
  }
  return JSON.parse(raw.slice(start, end + 1));
}

export function createOpenAiCompatibleProvider(config: LlmProviderConfig): LlmProvider {
  const fallback = createMockLlmProvider();

  if (!config.apiKey || !config.baseUrl) {
    return fallback;
  }

  const apiKey = config.apiKey;
  const baseUrl = config.baseUrl.replace(/\/$/, '');

  return {
    async recommend(context: RadioContext): Promise<RadioDecision> {
      try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: config.model,
            temperature: 0.7,
            messages: [
              {
                role: 'system',
                content:
                  '你是 Claudio，一个个人 AI 电台 DJ。只返回 JSON，字段包括 songId、reason、mood、segueText、confidence。'
              },
              {
                role: 'user',
                content: JSON.stringify({
                  prompt: context.userPrompt,
                  tasteProfile: context.tasteProfile,
                  routines: context.routines,
                  moodRules: context.moodRules,
                  weather: context.weather,
                  calendar: context.calendar,
                  history: context.history.slice(-8),
                  feedback: context.feedback.slice(-8),
                  candidates: context.candidates
                })
              }
            ]
          })
        });

        if (!response.ok) {
          throw new Error(`LLM 请求失败：${response.status}`);
        }

        const payload = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = payload.choices?.[0]?.message?.content ?? '';
        const parsed = extractJson(content) as {
          songId?: string;
          reason?: string;
          mood?: string;
          segueText?: string;
          confidence?: number;
        };
        const song = context.candidates.find((candidate) => candidate.id === parsed.songId) ?? context.candidates[0];

        if (!song) {
          throw new Error('LLM 没有收到候选歌曲');
        }

        return {
          song,
          reason: parsed.reason ?? `Claudio 选择了《${song.title}》。`,
          mood: parsed.mood ?? song.tags.join(' / '),
          segueText: parsed.segueText ?? `下一首是 ${song.artist} 的《${song.title}》。`,
          confidence: Math.max(0, Math.min(1, parsed.confidence ?? 0.7)),
          provider: 'openai-compatible'
        };
      } catch {
        return fallback.recommend(context);
      }
    }
  };
}
