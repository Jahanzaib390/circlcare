import { Router } from 'express';
import { success, error } from '../utils/responseHelpers';
import {
  activateDemoScenario,
  getDemoScenarios,
  getActiveDemoScenario,
} from '../services/demoScenarioState';

export const demoRoutes = Router();

demoRoutes.get('/demo/scenarios', (_req, res) => {
  success(res, {
    scenarios: getDemoScenarios(),
    active_scenario_id: getActiveDemoScenario()?.id ?? null,
  });
});

demoRoutes.post('/demo/scenario/:id', async (req, res, next) => {
  try {
    const scenario = activateDemoScenario(req.params.id);
    if (!scenario) {
      return error(res, 'Scenario not found', 404);
    }

    success(res, {
      message: `Scenario ${scenario.id} loaded`,
      scenario,
      seeded_state: {
        active_scenario_id: scenario.id,
        expected_action: scenario.expected_action,
        parsed_request: scenario.expected_outputs?.parsed_request ?? null,
        demo_seed: scenario.expected_outputs?.demo_seed ?? null,
      },
    });
  } catch (e) {
    next(e);
  }
});
