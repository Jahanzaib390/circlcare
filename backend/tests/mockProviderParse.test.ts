import { MockProvider } from '../src/llm/mockProvider';

describe('MockProvider.parseRequest location clarification', () => {
  it('asks for city clarification when Bahria Town is given without a city', async () => {
    const provider = new MockProvider();

    const parsed = await provider.parseRequest(
      'Ammi ke liye Bahria Town mein caregiver chahiye kal morning'
    );

    expect(parsed.location_from).toBe('Bahria Town');
    expect(parsed.clarification_needed).toBe(true);
    expect(parsed.confidence).toBeLessThan(0.7);
    expect(parsed.clarification_question).toContain('Which city');
  });

  it('does not ask for city clarification when the city is explicit', async () => {
    const provider = new MockProvider();

    const parsed = await provider.parseRequest(
      'Ammi ke liye Bahria Town Lahore mein caregiver chahiye kal morning'
    );

    expect(parsed.location_from).toBe('Bahria town lahore');
    expect(parsed.clarification_needed).toBe(false);
    expect(parsed.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('asks to use current location when the family says qareeb', async () => {
    const provider = new MockProvider();

    const parsed = await provider.parseRequest('qareeb me Ammi ko clinic le jana hy');

    expect(parsed.service_bundle).toContain('clinic_visit');
    expect(parsed.location_from).toBe('current_location_requested');
    expect(parsed.location_to).toBe('nearby clinic');
    expect(parsed.clarification_needed).toBe(true);
    expect(parsed.confidence).toBeLessThan(0.7);
    expect(parsed.clarification_question).toContain('current location');
  });

  it('does not force out-of-scope errands into a care category', async () => {
    const provider = new MockProvider();

    const parsed = await provider.parseRequest('Mujhe kal market jana hai');

    expect(parsed.service_bundle).toEqual([]);
    expect(parsed.clarification_needed).toBe(true);
    expect(parsed.clarification_question).toContain('care');
  });
});
