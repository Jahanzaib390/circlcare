import fs from 'fs';
import path from 'path';
import type { ParsedRequest } from '../types/parsedRequest';

export interface DemoScenario {
  id: string;
  title: string;
  request_text: string;
  expected_action: string;
  expected_outputs?: {
    parsed_request?: ParsedRequest;
    demo_seed?: {
      booking_id?: string;
      simulation?: string;
      replacement_discount?: number;
    };
    demo_notes?: string[];
  };
}

let cachedScenarios: DemoScenario[] | null = null;
let activeScenarioId: string | null = null;

function resolveDemoPath(): string {
  const candidates = [
    path.resolve(__dirname, '../../../data/demo-scenarios.json'),
    path.resolve(__dirname, '../../data/demo-scenarios.json'),
    path.resolve(process.cwd(), '../data/demo-scenarios.json'),
    path.resolve(process.cwd(), 'data/demo-scenarios.json'),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];
}

export function getDemoScenarios(): DemoScenario[] {
  if (cachedScenarios) return cachedScenarios;

  try {
    const raw = fs.readFileSync(resolveDemoPath(), 'utf-8');
    cachedScenarios = JSON.parse(raw) as DemoScenario[];
    return cachedScenarios;
  } catch (error) {
    console.error('[demoScenarioState] Failed to load demo-scenarios.json:', error);
    return [];
  }
}

export function getDemoScenario(id: string): DemoScenario | undefined {
  return getDemoScenarios().find((scenario) => scenario.id.toLowerCase() === id.toLowerCase());
}

export function activateDemoScenario(id: string): DemoScenario | undefined {
  const scenario = getDemoScenario(id);
  if (!scenario) return undefined;

  activeScenarioId = scenario.id;
  return scenario;
}

export function getActiveDemoScenario(): DemoScenario | undefined {
  if (!activeScenarioId) return undefined;
  return getDemoScenario(activeScenarioId);
}

export function getScenarioForRequestText(text: string): DemoScenario | undefined {
  const normalized = text.trim().toLowerCase();
  const active = getActiveDemoScenario();

  if (active?.request_text.trim().toLowerCase() === normalized) {
    return active;
  }

  return getDemoScenarios().find(
    (scenario) => scenario.request_text.trim().toLowerCase() === normalized
  );
}
