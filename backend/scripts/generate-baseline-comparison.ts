import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { runBaselineComparison } from '../src/services/baselineComparison';

function csvEscape(value: unknown): string {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

const rows = runBaselineComparison();
const headers = [
  'scenario_id',
  'title',
  'request_text',
  'baseline_rule',
  'baseline_provider',
  'agentic_provider',
  'outcome',
  'baseline_weakness',
  'agentic_advantage',
  'score_signal',
  'judge_evidence',
];

const csv = [
  headers.join(','),
  ...rows.map((row) => headers.map((header) => csvEscape((row as any)[header])).join(',')),
].join('\n');

const outputPath = path.resolve(__dirname, '../../.agents/baseline-comparison.csv');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${csv}\n`, 'utf-8');

const adapted = rows.filter((row) => row.outcome === 'agent_adapted').length;
console.log(`Wrote ${rows.length} baseline comparison rows to ${outputPath}`);
console.log(`${adapted} scenarios show agentic improvement over the distance heuristic.`);
