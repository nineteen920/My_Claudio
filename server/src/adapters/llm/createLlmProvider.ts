import { createMockLlmProvider } from './mockLlmProvider';
import { createOpenAiCompatibleProvider } from './openAiCompatibleProvider';
import type { LlmProvider, LlmProviderConfig } from './types';

export function createLlmProvider(config: LlmProviderConfig): LlmProvider {
  if (config.provider === 'openai-compatible') {
    return createOpenAiCompatibleProvider(config);
  }

  return createMockLlmProvider();
}
