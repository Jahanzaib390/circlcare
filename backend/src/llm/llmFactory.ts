import type { LLMProvider } from './llmProvider';
import { MockProvider } from './mockProvider';
import { OpenAIProvider } from './openAIProvider';

let llmProvider: LLMProvider | null = null;

export function getLLMRuntimeStatus() {
  const provider = process.env.LLM_PROVIDER ?? 'openai';
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? 'gpt-5.4-mini';
  const demoMode = process.env.DEMO_MODE === 'true';
  const requireLiveAgents = process.env.REQUIRE_LIVE_AGENTS === 'true';
  const usingMock = provider === 'mock' || !apiKey || demoMode;

  return {
    provider: usingMock ? 'mock' : 'openai',
    requested_provider: provider,
    model: usingMock ? 'mock-provider' : model,
    openai_api_key_configured: Boolean(apiKey),
    demo_mode: demoMode,
    require_live_agents: requireLiveAgents,
    live_agent_ready: !usingMock,
  };
}

export function getLLM(): LLMProvider {
  if (llmProvider) return llmProvider;

  const status = getLLMRuntimeStatus();
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? 'gpt-5.4-mini';
  const provider = status.requested_provider;
  const useMock = provider === 'mock' || !apiKey || process.env.DEMO_MODE === 'true';

  if (useMock && status.require_live_agents) {
    throw new Error(
      'Live LLM agents are required, but OpenAI is not configured. Set OPENAI_API_KEY and LLM_PROVIDER=openai.'
    );
  }

  if (useMock) {
    console.log('[LLM Factory] Using MockProvider');
    llmProvider = new MockProvider();
  } else {
    console.log(`[LLM Factory] Using OpenAIProvider (${model})`);
    llmProvider = new OpenAIProvider(apiKey as string, model);
  }

  return llmProvider;
}
