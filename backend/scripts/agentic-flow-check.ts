import 'dotenv/config';
import { getLLM } from '../src/llm/llmFactory';
import { getProviders } from '../src/services/providerData';
import { baselineFirstAvailableByDistance, matchProviders } from '../src/services/matchingEngine';
import { calculateQuote } from '../src/services/pricingEngine';
import { runDisputeAgent } from '../src/services/disputeEngine';
import { runBaselineComparison } from '../src/services/baselineComparison';

type CheckResult = {
  name: string;
  passed: boolean;
  detail: string;
};

const results: CheckResult[] = [];

function record(name: string, passed: boolean, detail: string) {
  results.push({ name, passed, detail });
}

function assertCheck(name: string, condition: unknown, detail: string) {
  record(name, Boolean(condition), detail);
}

const noisyCases = [
  {
    name: 'Roman Urdu misspellings',
    input: 'meri ammi ko raat me oxygen wali femal nurs chahye DHA me, plz reliable ho cancel na kry',
    expectService: 'home_nurse',
    expectLocation: 'DHA',
  },
  {
    name: 'Code-switched clinical request',
    input: 'Dad knee replacement ke baad home physio needs, evening slot, verified only, English/Urdu ok',
    expectService: 'physiotherapy',
    expectLocation: undefined,
  },
  {
    name: 'Ambiguous request',
    input: 'kal kisi ko bhej dein ammi ke liye, zyada masla hai',
    expectClarification: true,
  },
];

async function main() {
  const strictOpenAI = process.env.CHECK_ALLOW_MOCK !== 'true';
  const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);
  const usingMock =
    process.env.LLM_PROVIDER === 'mock' || process.env.DEMO_MODE === 'true' || !hasOpenAIKey;

  if (strictOpenAI) {
    assertCheck(
      'OpenAI API key configured',
      hasOpenAIKey && !usingMock,
      hasOpenAIKey
        ? 'OPENAI_API_KEY is present and mock mode is not enabled.'
        : 'OPENAI_API_KEY is missing. Set it or run CHECK_ALLOW_MOCK=true for local-only checks.'
    );
  } else {
    record(
      'OpenAI API key configured',
      true,
      usingMock
        ? 'Mock mode allowed for this run.'
        : 'OPENAI_API_KEY is present; live LLM will be used.'
    );
  }

  const llm = getLLM();
  const parseText =
    'meri ammi k liye femal nurse chahye DHA Lahore me kal morning, Urdu bolti ho';
  const parsed = await llm.parseRequest(parseText);
  assertCheck(
    'LLM request understanding',
    parsed.service_bundle.length > 0 && parsed.location_from !== 'not specified',
    `Parsed services=${parsed.service_bundle.join(',')} location=${parsed.location_from} confidence=${parsed.confidence}`
  );

  for (const testCase of noisyCases) {
    const noisyParsed = await llm.parseRequest(testCase.input);
    const serviceOk = testCase.expectService
      ? noisyParsed.service_bundle.includes(testCase.expectService as any)
      : true;
    const locationOk = testCase.expectLocation
      ? noisyParsed.location_from.toLowerCase().includes(testCase.expectLocation.toLowerCase())
      : true;
    const clarificationOk = testCase.expectClarification
      ? noisyParsed.clarification_needed || noisyParsed.confidence < 0.7
      : true;
    assertCheck(
      `Noisy LLM parse: ${testCase.name}`,
      serviceOk && locationOk && clarificationOk,
      `services=${noisyParsed.service_bundle.join(',') || 'none'} location=${noisyParsed.location_from} confidence=${noisyParsed.confidence} clarification=${noisyParsed.clarification_needed}`
    );
  }

  const providers = getProviders();
  const matchResult = matchProviders(parsed, providers);
  const baseline = baselineFirstAvailableByDistance(parsed, providers);
  assertCheck(
    'Provider matching candidates',
    matchResult.top_matches.length > 0,
    `${matchResult.top_matches.length} eligible candidates; baseline=${baseline?.provider.name ?? 'none'}`
  );

  const agentDecision = await llm.selectMatchesWithTools(
    parsed,
    matchResult.top_matches,
    matchResult.filtered_out,
    baseline?.provider.id
  );
  assertCheck(
    'Agentic matching tool loop',
    agentDecision.tool_trace.length > 0 && agentDecision.selected_provider_ids.length > 0,
    `tools=${agentDecision.tool_trace.map((item) => item.tool).join(' -> ')} selected=${agentDecision.selected_provider_ids.join(',')}`
  );

  const selectedMatch =
    matchResult.top_matches.find((match) => match.provider.id === agentDecision.selected_provider_ids[0]) ??
    matchResult.top_matches[0];
  const quote = calculateQuote(selectedMatch.provider, parsed, { pastBookingCount: 3 });
  const pricingAgent = await llm.reviewQuoteWithTools(parsed, selectedMatch.provider, quote);
  assertCheck(
    'Agentic pricing review',
    Boolean(pricingAgent?.tool_trace.length),
    `decision=${pricingAgent?.decision} tools=${pricingAgent?.tool_trace.map((item) => item.tool).join(' -> ')}`
  );

  const dispute = runDisputeAgent({
    id: 'dsp_check',
    booking_id: 'BK-CHECK',
    provider_id: selectedMatch.provider.id,
    type: 'extra_charge',
    description: 'Provider asked for extra Rs. 500 waiting charge.',
    submitted_at: new Date().toISOString(),
  });
  assertCheck(
    'Dispute agent action',
    dispute.recommendation.action === 'refund' && dispute.tool_trace.length >= 3,
    `action=${dispute.recommendation.action} refund=${dispute.recommendation.refund_amount ?? 0} tools=${dispute.tool_trace.map((item) => item.tool).join(' -> ')}`
  );

  const baselineComparison = runBaselineComparison();
  const adaptedCount = baselineComparison.filter((item) => item.outcome === 'agent_adapted').length;
  assertCheck(
    'Baseline comparison coverage',
    baselineComparison.length >= 10 && adaptedCount >= 4,
    `${baselineComparison.length} scenarios checked; ${adaptedCount} show agent adaptation.`
  );

  console.log('\nCirclCare Agentic Flow Check');
  console.log('='.repeat(32));
  for (const result of results) {
    console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}`);
    console.log(`     ${result.detail}`);
  }

  const failed = results.filter((result) => !result.passed);
  if (failed.length > 0) {
    console.error(`\n${failed.length} check(s) failed.`);
    process.exit(1);
  }

  console.log('\nAll checks passed.');
}

main().catch((error) => {
  console.error('\nAgentic flow check crashed:');
  console.error(error);
  process.exit(1);
});
