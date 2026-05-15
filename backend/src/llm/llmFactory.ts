import type { LLMProvider } from './llmProvider';
import { MockProvider } from './mockProvider';
import { GeminiProvider } from './geminiProvider';

let llmProvider: LLMProvider | null = null;

export function getLLM(): LLMProvider {
  if (llmProvider) return llmProvider;

  const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY;
  const useMock = !apiKey || process.env.DEMO_MODE === 'true';

  if (useMock) {
    console.log('[LLM Factory] Using MockProvider');
    llmProvider = new MockProvider();
  } else {
    console.log('[LLM Factory] Using GeminiProvider');
    llmProvider = new GeminiProvider(apiKey as string);
  }

  return llmProvider;
}
