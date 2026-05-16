import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import HomeScreen from '@/app/(tabs)/index';

const mockParseRequest = jest.fn();
const mockResetMutation = jest.fn();
const mockSetRawRequest = jest.fn((text: string) => {
  mockRawRequest = text;
});
const mockSetParsedRequest = jest.fn();
const mockSetIsEmergency = jest.fn((value: boolean) => {
  mockIsEmergency = value;
});

let mockRawRequest = '';
let mockIsEmergency = false;

jest.mock('expo-router', () => ({
  useFocusEffect: (cb: () => void) => cb(),
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    isDark: false,
    colors: {
      background: '#fff',
      surface: '#fff',
      surfaceElevated: '#f8fafc',
      border: '#d1d5db',
      textPrimary: '#111827',
      textSecondary: '#4b5563',
      textMuted: '#6b7280',
      primary: '#2563eb',
      danger: '#dc2626',
    },
    fontFamily: {
      regular: 'System',
      medium: 'System',
      semiBold: 'System',
      bold: 'System',
      extraBold: 'System',
    },
    shadows: { md: {} },
  }),
}));

jest.mock('@/hooks/useRequestStore', () => ({
  useRequestStore: () => ({
    rawRequest: mockRawRequest,
    isEmergency: mockIsEmergency,
    recentRequests: [
      {
        id: 'recent-1',
        text: 'Need a nurse tomorrow',
        timestamp: '2026-05-15T08:00:00+05:00',
        serviceBundle: ['home_nurse'],
      },
    ],
    setRawRequest: mockSetRawRequest,
    setParsedRequest: mockSetParsedRequest,
    setIsEmergency: mockSetIsEmergency,
  }),
}));

jest.mock('@/hooks/useParseRequest', () => ({
  useParseRequest: () => ({
    mutate: mockParseRequest,
    isPending: false,
    isError: false,
    reset: mockResetMutation,
  }),
}));

jest.mock('@/services/apiClient', () => ({
  apiClient: {
    get: jest.fn().mockRejectedValue(new Error('offline')),
    post: jest.fn().mockResolvedValue({}),
  },
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    mockRawRequest = '';
    mockIsEmergency = false;
    jest.clearAllMocks();
  });

  it('updates input, toggles emergency mode, and submits the typed request', async () => {
    const screen = render(<HomeScreen />);
    const input = screen.getByLabelText('Care request input');

    fireEvent.changeText(input, 'Need a female nurse in DHA');
    expect(mockSetRawRequest).toHaveBeenCalledWith('Need a female nurse in DHA');

    fireEvent.press(screen.getByLabelText('Emergency toggle'));
    screen.rerender(<HomeScreen />);
    fireEvent.press(screen.getByLabelText('Submit care request'));

    await waitFor(() => {
      expect(mockParseRequest).toHaveBeenCalledWith({
        text: 'Need a female nurse in DHA',
        isEmergency: true,
      });
    });
  });

  it('selects a quick category and reuses a recent request', () => {
    const screen = render(<HomeScreen />);

    fireEvent.press(screen.getByLabelText('Home Nurse'));
    expect(mockSetRawRequest).toHaveBeenCalledWith(
      'I need home nurse service for my family member'
    );
    expect(mockParseRequest).toHaveBeenCalledWith({
      text: 'I need home nurse service for my family member',
      isEmergency: false,
    });

    fireEvent.press(screen.getByLabelText('Reuse request: Need a nurse tomorrow'));
    expect(mockSetRawRequest).toHaveBeenCalledWith('Need a nurse tomorrow');
  });
});
