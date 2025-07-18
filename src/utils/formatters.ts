export type CurrencyFormat = 'normal' | 'thousands' | 'lacs';

export const formatCurrency = (amount: number, format: CurrencyFormat): string => {
  switch (format) {
    case 'thousands':
      if (amount >= 1000) {
        return `₹${(amount / 1000).toFixed(1)}K`;
      }
      return `₹${amount.toFixed(2)}`;
    
    case 'lacs':
      if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(2)}L`;
      } else if (amount >= 1000) {
        return `₹${(amount / 1000).toFixed(1)}K`;
      }
      return `₹${amount.toFixed(2)}`;
    
    case 'normal':
    default:
      return `₹${amount.toFixed(2)}`;
  }
};

export const formatWeight = (grams: number): string => {
  return `${grams.toFixed(2)}g`;
};

export const formatPercentage = (percentage: number): string => {
  return `${percentage.toFixed(1)}%`;
};