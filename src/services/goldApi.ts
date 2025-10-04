
import { GoldPurchase } from '@/types/gold';

// Configuration - update these URLs to point to your NAS backend
const API_BASE_URL = 'https://api-get-away.krishnarajthadesar.in/api';

// Helper function to get user ID
const getUserId = () => {
  const user = localStorage.getItem('auth_user');
  return user ? JSON.parse(user).id : null;
};

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Gold Purchase CRUD Operations
export const goldPurchaseApi = {
  // Get all purchases for a user
  getAll: async (): Promise<ApiResponse<GoldPurchase[]>> => {
    try {
      const userId = getUserId();
      const url = userId ? `${API_BASE_URL}/gold-purchases?userId=${userId}` : `${API_BASE_URL}/gold-purchases`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.warn('Failed to fetch purchases from API:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Create new purchase
  create: async (purchase: Omit<GoldPurchase, 'id'>): Promise<ApiResponse<GoldPurchase>> => {
    try {
      const userId = getUserId();
      const purchaseWithUser = userId ? { ...purchase, userId } : purchase;
      
      const response = await fetch(`${API_BASE_URL}/gold-purchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseWithUser),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.warn('Failed to create purchase via API:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Update purchase
  update: async (id: string, purchase: Partial<GoldPurchase>): Promise<ApiResponse<GoldPurchase>> => {
    try {
      const userId = getUserId();
      const purchaseWithUser = userId ? { ...purchase, userId } : purchase;
      
      const response = await fetch(`${API_BASE_URL}/gold-purchases/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseWithUser),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.warn('Failed to update purchase via API:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Delete purchase
  delete: async (id: string): Promise<ApiResponse<void>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/gold-purchases/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return { success: true };
    } catch (error) {
      console.warn('Failed to delete purchase via API:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

// Gold Price API
export const goldPriceApi = {
  getCurrentPrice: async (): Promise<ApiResponse<number>> => {
    try {
      // Try your custom API first
      try {
        const response = await fetch(`${API_BASE_URL}/gold-price`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          return { success: true, data: data.pricePerGram };
        }
      } catch (error) {
        console.warn('Custom gold price API failed, trying fallback:', error);
      }
      
    } catch (error) {
      console.warn('Failed to fetch gold price from API:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  getHistoricalPrice: async (daysBack: number): Promise<ApiResponse<number>> => {
    try {
      // Try your custom API first
      try {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - daysBack);
        const dateStr = targetDate.toISOString().split('T')[0];
        
        const response = await fetch(`${API_BASE_URL}/gold-price/historical?date=${dateStr}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          return { success: true, data: data.pricePerGram };
        }
      } catch (error) {
        console.warn('Custom historical gold price API failed:', error);
      }
      
      // For now, return a fallback (you can enhance this with a real historical API)
      return { success: false, error: 'Historical price API not available' };
    } catch (error) {
      console.warn('Failed to fetch historical gold price from API:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  getPriceAtDate: async (date: string): Promise<ApiResponse<number>> => {
    try {
      // Try your custom API first
      try {
        const response = await fetch(`${API_BASE_URL}/gold-price/historical?date=${date}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          return { success: true, data: data.pricePerGram };
        }
      } catch (error) {
        console.warn('Custom historical gold price API failed for date:', date, error);
      }
      
      // For now, return a fallback (you can enhance this with a real historical API)
      return { success: false, error: 'Historical price API not available' };
    } catch (error) {
      console.warn('Failed to fetch gold price for date from API:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

// Settings API (for storing user preferences like currency, etc.)
export const settingsApi = {
  get: async (): Promise<ApiResponse<{ currency: string; autoFetchPrice: boolean }>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.warn('Failed to fetch settings from API:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  update: async (settings: { currency?: string; autoFetchPrice?: boolean }): Promise<ApiResponse<void>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return { success: true };
    } catch (error) {
      console.warn('Failed to update settings via API:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};
