import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import QuoteScreen from '@/app/request/quote';
import {
  makeMatch as mockMakeMatch,
  parsedRequest as mockParsedRequest,
  pricing as mockPricing,
} from './fixtures';

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockGetQuote = jest.fn();
const mockCreateBooking = jest.fn();
const mockSetAlternateSlotSelected = jest.fn((selected: boolean) => {
  mockIsAlternateSlotSelected = selected;
});

let mockIsAlternateSlotSelected = false;

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace }),
}));

jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      background: '#fff',
      surface: '#fff',
      border: '#d1d5db',
      textPrimary: '#111827',
      textSecondary: '#4b5563',
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
  useMatchStore: () => ({ selectedMatch: mockMakeMatch() }),
}));

jest.mock('@/hooks/useQuoteStore', () => ({
  useQuoteStore: () => ({
    pricing: mockPricing,
    isAlternateSlotSelected: mockIsAlternateSlotSelected,
    setAlternateSlotSelected: mockSetAlternateSlotSelected,
  }),
}));

jest.mock('@/hooks/useQuote', () => ({
  useQuote: () => ({
    mutate: mockGetQuote,
    isPending: false,
    isError: false,
  }),
}));

jest.mock('@/hooks/useBooking', () => ({
  useBooking: () => ({
    mutate: mockCreateBooking,
    isPending: false,
  }),
}));

describe('QuoteScreen', () => {
  beforeEach(() => {
    mockIsAlternateSlotSelected = false;
    jest.clearAllMocks();
  });

  it('renders the itemized quote and total', () => {
    const screen = render(<QuoteScreen />);

    expect(screen.getByText('Visit Slot')).toBeTruthy();
    expect(screen.getByText(/10:00/)).toBeTruthy();
    expect(screen.getByText('Pricing Breakdown')).toBeTruthy();
    expect(screen.getByText('Base Visit Fee')).toBeTruthy();
    expect(screen.getByText('+1,200 PKR')).toBeTruthy();
    expect(screen.getByText('CirclCare Loyalty Discount')).toBeTruthy();
    expect(screen.getByText('-159 PKR')).toBeTruthy();
    expect(screen.getByText('1,428 PKR')).toBeTruthy();
  });

  it('shows alternate-slot savings and books with the adjusted total', () => {
    const screen = render(<QuoteScreen />);

    fireEvent.press(screen.getByText('Select Cheaper Slot'));
    expect(mockSetAlternateSlotSelected).toHaveBeenCalledWith(true);

    screen.rerender(<QuoteScreen />);

    expect(screen.getByText('Alternate Slot Savings')).toBeTruthy();
    expect(screen.getByText('1,041 PKR')).toBeTruthy();

    fireEvent.press(screen.getByText('Book Alternate Slot'));
    expect(mockCreateBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        pricing: expect.objectContaining({ total: 1041 }),
        request: expect.objectContaining({
          scheduled_datetime: mockPricing.cheaper_slot_suggestion?.datetime,
          urgency: 'low',
        }),
      }),
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });
});
