import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import MatchScreen from '@/app/request/match';
import { matchResponse as mockMatchResponse, parsedRequest as mockParsedRequest } from './fixtures';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockSetSelectedMatch = jest.fn();
const mockRunMatch = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      background: '#fff',
      surface: '#fff',
      border: '#d1d5db',
      textPrimary: '#111827',
      textSecondary: '#4b5563',
      textMuted: '#6b7280',
      primary: '#2563eb',
    },
    fontFamily: {
      regular: 'System',
      medium: 'System',
      semiBold: 'System',
      bold: 'System',
    },
  }),
}));

jest.mock('@/hooks/useRequestStore', () => ({
  useRequestStore: () => ({ parsedRequest: mockParsedRequest }),
}));

jest.mock('@/hooks/useMatchStore', () => ({
  useMatchStore: () => ({
    matchResponse: mockMatchResponse,
    setSelectedMatch: mockSetSelectedMatch,
  }),
}));

jest.mock('@/hooks/useMatchResults', () => ({
  useMatchResults: () => ({
    mutate: mockRunMatch,
    isPending: false,
    isError: false,
  }),
}));

describe('MatchResultsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the recommendation, alternatives, and filtered provider summary', () => {
    const screen = render(<MatchScreen />);

    expect(screen.getByText('Top Recommendation')).toBeTruthy();
    expect(screen.getByText('Ayesha Khan')).toBeTruthy();
    expect(screen.getByText('CarePlus Nurses')).toBeTruthy();
    expect(screen.getByText('1 provider(s) not recommended')).toBeTruthy();

    fireEvent.press(screen.getByText('1 provider(s) not recommended'));
    expect(screen.getByText('Ali Raza')).toBeTruthy();
    expect(screen.getByText('Female provider required for this request.')).toBeTruthy();
  });

  it('selects the recommended provider before moving to quote', () => {
    const screen = render(<MatchScreen />);

    fireEvent.press(screen.getByText('Book this Provider'));

    expect(mockSetSelectedMatch).toHaveBeenCalledWith(mockMatchResponse.top_matches[0]);
    expect(mockPush).toHaveBeenCalledWith('/request/quote');
  });
});
