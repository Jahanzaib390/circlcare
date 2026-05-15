/** Minimal Provider type needed by the LLMProvider interface */
export interface Provider {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  services: string[];
  specializations: string[];
  languages: string[];
  areas: string[];
  rating: number;
  on_time_score: number;
  verified: boolean;
  bio?: string;
}
