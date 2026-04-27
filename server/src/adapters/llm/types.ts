import type { RadioContext, RadioDecision } from '../../../../shared/types';

export interface LlmProvider {
  recommend(context: RadioContext): Promise<RadioDecision>;
}

export interface LlmProviderConfig {
  provider: string;
  baseUrl?: string;
  apiKey?: string;
  model: string;
}
