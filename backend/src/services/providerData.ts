import fs from 'fs';
import path from 'path';
import type { Provider } from '../types/provider';

let cachedProviders: Provider[] | null = null;

function resolveDataPath(fileName: string): string {
  const candidates = [
    path.resolve(__dirname, '../../../data', fileName),
    path.resolve(__dirname, '../../data', fileName),
    path.resolve(process.cwd(), '../data', fileName),
    path.resolve(process.cwd(), 'data', fileName),
  ];

  const found = candidates.find((candidate) => fs.existsSync(candidate));
  return found ?? candidates[0];
}

export function getProviders(): Provider[] {
  if (cachedProviders) {
    return cachedProviders;
  }

  const PROVIDERS_PATH = resolveDataPath('providers.json');
  try {
    const raw = fs.readFileSync(PROVIDERS_PATH, 'utf-8');
    cachedProviders = JSON.parse(raw) as Provider[];
    return cachedProviders;
  } catch (err) {
    console.error('[providerData] Failed to load providers.json:', err);
    return [];
  }
}

export function updateProvider(id: string, updates: Partial<Provider>): Provider | null {
  const providers = getProviders();
  const index = providers.findIndex((p) => p.id === id);
  if (index === -1) return null;

  providers[index] = { ...providers[index], ...updates };
  return providers[index];
}
