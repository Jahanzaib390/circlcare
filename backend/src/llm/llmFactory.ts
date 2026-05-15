import type { LLMProvider } from './llmProvider';
import { MockProvider } from './mockProvider';
import { OpenAIProvider } from './openAIProvider';

let llmProvider: LLMProvider | null = null;

export function getLLM(): LLMProvider {
  if (llmProvider) return llmProvider;

  const provider = process.env.LLM_PROVIDER ?? 'openai';
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? 'gpt-5.4-mini';
  const useMock = provider === 'mock' || !apiKey || process.env.DEMO_MODE === 'true';

  if (useMock) {
    console.log('[LLM Factory] Using MockProvider');
    llmProvider = new MockProvider();
  } else {
    console.log(`[LLM Factory] Using OpenAIProvider (${model})`);
    llmProvider = new OpenAIProvider(apiKey as string, model);
  }

  return llmProvider;
}
