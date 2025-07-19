import { xirr } from 'xirr';

export interface CashFlow {
  amount: number;
  date: Date;
}

/**
 * Calculate XIRR (Extended Internal Rate of Return) for a series of cash flows
 * @param cashFlows Array of cash flows with amounts and dates
 * @returns XIRR as a percentage (e.g., 0.15 for 15%)
 */
export const calculateXIRR = (cashFlows: CashFlow[]): number => {
  try {
    if (cashFlows.length < 2) return 0;
    
    // Convert to the format expected by the xirr library
    const xirrData = cashFlows.map(cf => ({
      amount: cf.amount,
      when: cf.date
    }));
    
    const result = xirr(xirrData);
    return result || 0;
  } catch (error) {
    console.warn('XIRR calculation failed:', error);
    return 0;
  }
};

/**
 * Calculate XIRR for gold purchases
 * @param purchases Array of gold purchases
 * @param currentGoldPrice Current price per gram
 * @param currentDate Current date for final value calculation
 * @returns XIRR as a percentage
 */
export const calculateGoldXIRR = (
  purchases: Array<{ grams: number; amountPaid: number; date: string }>,
  currentGoldPrice: number,
  currentDate: Date = new Date()
): number => {
  if (purchases.length === 0 || currentGoldPrice <= 0) return 0;
  
  const cashFlows: CashFlow[] = [];
  
  // Add all purchases as negative cash flows (investments)
  purchases.forEach(purchase => {
    cashFlows.push({
      amount: -purchase.amountPaid, // Negative because it's an outflow
      date: new Date(purchase.date)
    });
  });
  
  // Add current value as positive cash flow (return)
  const totalGrams = purchases.reduce((sum, p) => sum + p.grams, 0);
  const currentValue = totalGrams * currentGoldPrice;
  
  cashFlows.push({
    amount: currentValue, // Positive because it's an inflow
    date: currentDate
  });
  
  return calculateXIRR(cashFlows);
};