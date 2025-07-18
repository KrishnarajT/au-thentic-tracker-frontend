export interface GoldPurchase {
  id: string;
  grams: number;
  amountPaid: number;
  date: string;
  pricePerGram: number;
  userId?: string;
}