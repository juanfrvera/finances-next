import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrencyEvolutionData } from '@/app/actions';

export interface CurrencyEvolutionDataPoint {
  date: string;
  value: number;
  topAccounts: Array<{ name: string; balance: number }>;
}

// Query key factory for currency evolution data
export const currencyEvolutionKeys = {
  all: ['currency-evolution'] as const,
  currency: (currency: string) => [...currencyEvolutionKeys.all, currency] as const,
};

// Custom hook for currency evolution data
export function useCurrencyEvolution(currency: string) {
  return useQuery({
    queryKey: currencyEvolutionKeys.currency(currency),
    queryFn: () => getCurrencyEvolutionData(currency),
    enabled: !!currency,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Custom hook for invalidating currency evolution cache
export function useCurrencyEvolutionMutations() {
  const queryClient = useQueryClient();

  const invalidateCurrency = (currency: string) => {
    queryClient.invalidateQueries({
      queryKey: currencyEvolutionKeys.currency(currency),
    });
  };

  const invalidateAllCurrencies = () => {
    queryClient.invalidateQueries({
      queryKey: currencyEvolutionKeys.all,
    });
  };

  return {
    invalidateCurrency,
    invalidateAllCurrencies,
  };
}
