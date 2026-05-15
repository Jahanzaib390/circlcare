import providersJson from '@/data/providers.json';
import type { MatchResponse, MatchResult } from '@/types/match';
import type { Provider } from '@/types/provider';
import type { ParsedRequest } from '@/types/request';

const cachedProviders = providersJson as Provider[];

function lower(value: string) {
  return value.toLowerCase();
}

function coversArea(provider: Provider, location: string) {
  const area = lower(location);
  if (area === 'not specified' || area === 'flexible') return true;
  return provider.areas.some((providerArea) => {
    const normalized = lower(providerArea);
    return normalized.includes(area) || area.includes(normalized);
  });
}

function scoreProvider(provider: Provider, request: ParsedRequest) {
  const serviceMatch = request.service_bundle.some((service) => provider.services.includes(service));
  const languagePrefs = request.provider_preferences.language ?? [];
  const languageMatches = languagePrefs.filter((language) =>
    provider.languages.map(lower).includes(lower(language))
  ).length;
  const languageScore =
    languagePrefs.length === 0 ? 0.7 : Math.min(1, languageMatches / languagePrefs.length);
  const genderScore =
    request.provider_preferences.gender === 'female_preferred' && provider.gender === 'female'
      ? 1
      : 0.75;

  const total =
    (serviceMatch ? 0.25 : 0) +
    provider.on_time_score * 0.2 +
    (provider.rating / 5) * 0.15 +
    (1 - provider.cancellation_rate) * 0.15 +
    languageScore * 0.1 +
    genderScore * 0.1 +
    (coversArea(provider, request.location_from) ? 0.05 : 0);

  return {
    total: Math.min(1, total),
    specialization: serviceMatch ? 0.8 : 0.2,
    availabilityFit: Math.min(1, provider.availability.length / 7),
    reliability: provider.on_time_score,
    language: languageScore,
    genderComfort: genderScore,
    ratingRecency: provider.recent_review_score / 5,
    cancellationRisk: 1 - provider.cancellation_rate,
    distance: coversArea(provider, request.location_from) ? 0.75 : 0.35,
    priceFit: 1 - Math.min(1, (provider.base_rate - 200) / 4800),
  };
}

export function buildOfflineMatchResponse(request: ParsedRequest): MatchResponse {
  const filtered_out: MatchResponse['filtered_out'] = [];

  const matches = cachedProviders.flatMap((provider) => {
    if (!request.service_bundle.some((service) => provider.services.includes(service))) {
      filtered_out.push({
        provider,
        failed_filter: 'service_type',
        reason: `Does not offer ${request.service_bundle.map((s) => s.replace(/_/g, ' ')).join(', ')}`,
      });
      return [];
    }

    if (
      request.provider_preferences.gender === 'female_required' &&
      provider.gender !== 'female'
    ) {
      filtered_out.push({
        provider,
        failed_filter: 'gender',
        reason: 'Female provider required - male/other provider excluded',
      });
      return [];
    }

    if (!coversArea(provider, request.location_from)) {
      filtered_out.push({
        provider,
        failed_filter: 'area_coverage',
        reason: `Does not serve ${request.location_from}`,
      });
      return [];
    }

    if (
      request.provider_preferences.language_required &&
      request.provider_preferences.language?.length
    ) {
      const providerLanguages = provider.languages.map(lower);
      const hasLanguage = request.provider_preferences.language.some((language) =>
        providerLanguages.includes(lower(language))
      );
      if (!hasLanguage) {
        filtered_out.push({
          provider,
          failed_filter: 'language',
          reason: `Provider does not speak ${request.provider_preferences.language.join(', ')}`,
        });
        return [];
      }
    }

    return [{ provider, score: scoreProvider(provider, request) }];
  });

  const top_matches: MatchResult[] = matches
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, 3)
    .map((match, index) => ({
      provider: match.provider,
      score: match.score,
      hardFilterResult: { passed: true },
      explanation: `${match.provider.name} is shown from cached provider data while the backend is unavailable. Reliability, rating, language, and area coverage were used for this offline ranking.`,
      distance_km: 0,
      travel_time_minutes: 0,
      elder_buffer_minutes: 15,
      suggested_arrival_buffer_minutes: 15,
      rank: index + 1,
    }));

  return {
    request,
    top_matches,
    filtered_out,
    is_offline_fallback: true,
    fallback_message: 'Offline mode: showing cached provider matches until the backend reconnects.',
  };
}
