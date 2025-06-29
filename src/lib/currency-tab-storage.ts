/**
 * Utility for managing currency tab selections in localStorage
 */

const STORAGE_KEY = 'currency-selected-tabs';
const STORAGE_VERSION = '1.0'; // For future migrations if needed

export type CurrencyTab = 'simple' | 'pie' | 'bar';

interface TabStorageData {
  version: string;
  tabs: Record<string, CurrencyTab>;
  lastUpdated: number;
}

export const CurrencyTabStorage = {
  /**
   * Save the selected tab for a specific currency
   */
  saveTab: (currency: string, tab: CurrencyTab): void => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let data: TabStorageData;

      if (stored) {
        data = JSON.parse(stored);
        // Ensure we have the expected structure
        if (!data.tabs || typeof data.tabs !== 'object') {
          data = { version: STORAGE_VERSION, tabs: {}, lastUpdated: Date.now() };
        }
      } else {
        data = { version: STORAGE_VERSION, tabs: {}, lastUpdated: Date.now() };
      }

      // Update the tab for this currency
      data.tabs[currency] = tab;
      data.lastUpdated = Date.now();

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save currency tab to localStorage:', error);
    }
  },

  /**
   * Get the saved tab for a specific currency
   */
  getTab: (currency: string): CurrencyTab => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return 'simple';

      const data: TabStorageData = JSON.parse(stored);
      
      // Check if data structure is valid
      if (!data.tabs || typeof data.tabs !== 'object') {
        return 'simple';
      }

      // Return the saved tab or default to 'simple'
      return data.tabs[currency] || 'simple';
    } catch (error) {
      console.warn('Failed to read currency tab from localStorage:', error);
      return 'simple';
    }
  },

  /**
   * Get all saved tabs
   */
  getAllTabs: (): Record<string, CurrencyTab> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return {};

      const data: TabStorageData = JSON.parse(stored);
      return data.tabs || {};
    } catch (error) {
      console.warn('Failed to read all currency tabs from localStorage:', error);
      return {};
    }
  },

  /**
   * Clear all saved tabs
   */
  clearAllTabs: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear currency tabs from localStorage:', error);
    }
  },

  /**
   * Remove a specific currency's tab
   */
  removeTab: (currency: string): void => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const data: TabStorageData = JSON.parse(stored);
      if (data.tabs && data.tabs[currency]) {
        delete data.tabs[currency];
        data.lastUpdated = Date.now();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.warn('Failed to remove currency tab from localStorage:', error);
    }
  },

  /**
   * Clean up entries for currencies that no longer exist
   */
  cleanup: (existingCurrencies: string[] = []): void => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const data: TabStorageData = JSON.parse(stored);
      if (!data.tabs || typeof data.tabs !== 'object') return;

      // Create a set for faster lookup
      const currencySet = new Set(existingCurrencies);
      let hasChanges = false;

      // Remove entries for currencies that don't exist anymore
      Object.keys(data.tabs).forEach(currency => {
        if (!currencySet.has(currency)) {
          delete data.tabs[currency];
          hasChanges = true;
        }
      });

      // Only update localStorage if we made changes
      if (hasChanges) {
        data.lastUpdated = Date.now();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.warn('Failed to cleanup currency tabs from localStorage:', error);
    }
  }
};
