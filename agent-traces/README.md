# Antigravity Agent Traces

This directory contains simulated trace logs showcasing the internal decision-making processes of the **CirclCare AI** backend agent platform. These traces are designed for technical evaluation by Judges to demonstrate the robustness, logic, and intelligent behavior of the underlying system.

### Trace Files Overview

1. **`01-language-parsing-confidence.log`**
   - **Focus:** Natural Language Understanding & Entity Extraction
   - **Description:** Demonstrates the LLM parsing unstructured user requirements (e.g., condition, language, schedule flexibility) into a structured JSON payload. Highlights confidence scoring and language intent mapping before routing to the next agent.

2. **`02-provider-ranking-rationale.log`**
   - **Focus:** Provider Matching Engine & Weighted Scoring
   - **Description:** Shows the execution of hard filters (distance, specialized conditions like Dementia, language fluency) followed by a granular weighted scoring matrix. Includes the LLM-generated rationale explaining exactly *why* top providers were chosen.

3. **`03-scheduling-decisions.log`**
   - **Focus:** Calendar Navigation & Conflict Resolution
   - **Description:** Illustrates the Scheduling Agent interacting with provider calendars. It shows conflict detection (e.g., recurring appointments) and the intelligent generation of flexible alternatives based on user parameters (e.g., "morning flexibility").

4. **`04-price-logic.log`**
   - **Focus:** Dynamic Pricing Engine
   - **Description:** A step-by-step breakdown of how quotes are formulated. Factors in base rates, distance surges, complexity/specialty multipliers (e.g., Dementia care markup), and platform fees to arrive at a final transparent quote.

5. **`05-action-execution.log`**
   - **Focus:** Booking & Dispatch Workflow
   - **Description:** Logs the successful end-to-end execution of a user booking. Shows payment authorization, database transaction commits, and the dispatch of localized push notifications to both the user and the chosen provider.

6. **`06-fallback-behavior.log`**
   - **Focus:** Resilience & Edge-Case Handling
   - **Description:** Demonstrates the Fallback Engine reacting to an unexpected provider cancellation. Shows the automatic retrieval of the next best candidate, real-time availability checks, quote recalculation, and automated "Price Protection" (subsidizing cost differences to ensure a seamless user experience).
