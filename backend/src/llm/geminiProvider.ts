import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { LLMProvider } from './llmProvider';
import type { ParsedRequest } from '../types/parsedRequest';
import type { Provider } from '../types/provider';
import type { Dispute } from '../types/dispute';

const PARSE_REQUEST_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    service_bundle: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description:
        'List of service categories needed. Values: clinic_visit, home_nurse, caregiver, physiotherapy, medicine_pickup, lab_sample, meal_plan, daily_support, elder_companion',
    },
    patient: { type: SchemaType.STRING, description: 'Patient name or relationship, e.g. "my mother"' },
    location_from: { type: SchemaType.STRING, description: 'Start/home location' },
    location_to: { type: SchemaType.STRING, description: 'Destination location if applicable', nullable: true },
    time_preference: { type: SchemaType.STRING, description: 'Human-readable time preference e.g. "tomorrow morning"' },
    scheduled_datetime: { type: SchemaType.STRING, description: 'ISO 8601 datetime if determinable', nullable: true },
    mobility_needs: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: 'e.g. wheelchair, stretcher' },
    provider_preferences: {
      type: SchemaType.OBJECT,
      properties: {
        gender: { type: SchemaType.STRING, description: 'female_required | male_required | female_preferred | any', nullable: true },
        language: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, nullable: true },
        verified_only: { type: SchemaType.BOOLEAN },
        elder_care_experience: { type: SchemaType.BOOLEAN, nullable: true },
      },
      required: ['verified_only'],
    },
    urgency: { type: SchemaType.STRING, description: 'low | medium | high | emergency' },
    risk_level: { type: SchemaType.STRING, description: 'low | medium | high' },
    clarification_needed: { type: SchemaType.BOOLEAN },
    clarification_question: { type: SchemaType.STRING, nullable: true },
    confidence: { type: SchemaType.NUMBER, description: '0.0 to 1.0' },
  },
  required: [
    'service_bundle',
    'patient',
    'location_from',
    'time_preference',
    'mobility_needs',
    'provider_preferences',
    'urgency',
    'risk_level',
    'clarification_needed',
    'confidence',
  ],
};

const SYSTEM_INSTRUCTION = `You are CirclCare AI, an elder-care coordination assistant operating in Pakistan.

Your task is to parse a natural language care request from a family member into a structured JSON object.

Rules:
- service_bundle must contain only valid category values.
- If urgency is "emergency", set risk_level to "high" and confidence to 1.0.
- If the request is ambiguous (missing service type, location, or time), set clarification_needed: true, confidence < 0.7, and provide a concise clarification_question.
- verified_only defaults to true for clinical services (home_nurse, lab_sample, physiotherapy).
- If a female provider is explicitly requested, set gender to "female_required" (hard constraint, not a preference).
- Extract patient as the person receiving care, not the caller.
- If location is not specified, set location_from to "not specified" and clarification_needed: true.
- Return only the JSON object, no prose.`;

export class GeminiProvider implements LLMProvider {
  private client: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey: string, modelName = 'gemini-2.0-flash') {
    this.client = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
  }

  async parseRequest(input: string): Promise<ParsedRequest> {
    const model = this.client.getGenerativeModel({
      model: this.modelName,
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: PARSE_REQUEST_SCHEMA as any,
        temperature: 0.1,
      },
    });

    const result = await model.generateContent(input);
    const text = result.response.text();
    const parsed = JSON.parse(text) as ParsedRequest;

    // Enforce confidence threshold rule
    if (parsed.confidence < 0.7 && !parsed.clarification_needed) {
      parsed.clarification_needed = true;
      if (!parsed.clarification_question) {
        parsed.clarification_question =
          'Could you clarify what type of care is needed and the preferred location?';
      }
    }

    return parsed;
  }

  async explainMatch(request: ParsedRequest, provider: Provider, score: number): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: this.modelName,
      generationConfig: { temperature: 0.3, maxOutputTokens: 150 },
    });

    const prompt = `Write a 2-3 sentence explanation of why this provider is recommended.

Request: ${JSON.stringify({ services: request.service_bundle, urgency: request.urgency, preferences: request.provider_preferences })}
Provider: ${JSON.stringify({ name: provider.name, services: provider.services, rating: provider.rating, on_time_score: provider.on_time_score, verified: provider.verified, specializations: provider.specializations })}
Match score: ${(score * 100).toFixed(0)}%

Be concise, specific, and reassuring. Mention 2-3 concrete reasons. Do not start with "I".`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  }

  async summarizeDispute(dispute: Dispute): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: this.modelName,
      generationConfig: { temperature: 0.2, maxOutputTokens: 120 },
    });

    const prompt = `Summarize this elder-care service dispute in 2 sentences for the family member.
Dispute: ${JSON.stringify(dispute)}
Be empathetic and factual. Do not use jargon.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  }
}
