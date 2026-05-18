# CirclCare Cost and Scalability Note

This note estimates demo and production costs for the agentic elder-care flow. Numbers are planning estimates, not vendor invoices. Actual cost depends on the selected model, prompt length, caching, traffic shape, and provider data size.

## Unit Operations

| Operation | What Happens | Typical LLM Calls | Estimated Latency |
|---|---|---:|---:|
| Understand request | Parse noisy multilingual text into structured care request | 1 | 1.5-4s |
| Agentic matching | Tool-calling loop observes providers, rejected candidates, conflicts, and baseline | 1 | 2-6s |
| Match explanation | Short explanation for top providers, cached by request/provider | 1-3, often cached | 1-4s |
| Pricing review | Tool-calling loop reviews quote lines, urgency flexibility, provider risk | 1 | 1.5-4s |
| Dispute chat | Mock tools inspect booking/GPS/refund/revisit/escalation | 0 in current mock flow | <500ms |

## Cost Per User Journey

Typical full journey:

1. Parse request
2. Match providers with tools
3. Explain top 3 matches
4. Review quote
5. Optional dispute flow

Estimated LLM calls:

- Low: 3 calls, if explanations are cached or only top match is explained
- Normal demo: 5-6 calls
- Heavy: 8+ calls, if user repeatedly clarifies and re-runs matching

Using a small/mini model for routing and short JSON outputs, a typical request is expected to cost **well below one US cent to a few cents** depending on model pricing and token volume. To keep cost predictable, CirclCare uses:

- JSON schema outputs for compact parsing
- Tool observations with summarized provider fields instead of full records
- Explanation cache for repeated provider/request pairs
- Mock/local dispute tools for deterministic evidence checks
- Mock provider remains available for local development/tests only; judged demos should use live OpenAI calls.

## 10x Scaling

Assume hackathon demo scale is 100 completed care requests/day.

At 10x, CirclCare handles about **1,000 requests/day**.

Expected changes:

- Provider data should move behind a database repository layer instead of raw JSON.
- Match candidate retrieval should use city/service/gender/availability indexes.
- LLM calls should be queued for non-critical explanations.
- Cache hit rate should rise for common scenarios and repeated provider explanations.
- API server can run as 2-3 stateless Node/Express instances behind a load balancer.

Throughput estimate:

- Deterministic filtering/scoring: hundreds of requests/second per small Node instance for moderate provider counts.
- LLM-gated matching: throughput is limited mostly by model latency and rate limits, so requests should use concurrency limits and retries.
- With 20 concurrent LLM calls and 4s average LLM latency, one environment can complete roughly **5 LLM-backed operations/second** before rate limits.

## 100x Scaling

At 100x, CirclCare handles about **10,000 requests/day** plus provider updates, bookings, disputes, and notifications.

Architecture changes:

- Postgres/Supabase for providers, bookings, disputes, audits, and payments.
- Redis for provider search cache, explanation cache, idempotency keys, and rate limits.
- Background job queue for notifications, dispute follow-up, and non-blocking explanation generation.
- Vector or semantic index for provider specialties if the provider catalog becomes large.
- Regional/city partitioning for provider search: Karachi, Lahore, Islamabad, etc.
- Audit log table for `agent_trace`, tool calls, decision payloads, and refund actions.

Cost controls:

- Use cheaper model for parse/classification and reserve stronger model for high-risk routing/disputes.
- Cap tool-loop steps.
- Send only top candidate summaries to the LLM.
- Cache stable explanations.
- Use deterministic prefilters before any LLM call.
- Batch offline quality/reputation updates instead of doing them in the user request path.

## Latency Targets

| Flow | Target P50 | Target P95 | Notes |
|---|---:|---:|---|
| Parse request | <2.5s | <6s | User is already waiting for AI understanding |
| Match providers | <4s | <8s | Includes tool-calling agent decision |
| Quote | <2s | <5s | Pricing is mostly local math plus one short agent review |
| Booking confirmation | <800ms | <2s | Should not depend on LLM |
| Dispute agent mock flow | <1s | <2s | Current implementation uses local tools |

## Reliability Plan

- In judged mode, `REQUIRE_LIVE_AGENTS=true` makes missing or failed OpenAI agent calls fail loudly instead of silently degrading.
- Outside judged mode, deterministic matching, pricing, and dispute logic remain useful for local development and unit tests.
- Every live agent decision returns trace data so failures can be debugged and audited.
- If location permission is denied, the user can choose saved city areas or enter a manual address.
- Every agent decision returns trace data so failures can be debugged and audited.

## Current Demo Readiness

Current seeded data covers Lahore, Karachi, and Islamabad. The automated check script validates:

- Live OpenAI API key availability
- Noisy multilingual parsing
- Agentic matching tool loop
- Agentic pricing review
- Dispute refund action
- Baseline comparison across 12 scenarios

Run:

```powershell
cd backend
npm run check:agentic
```
