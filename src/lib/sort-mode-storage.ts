/**
 * Storage utility for dashboard sort mode persistence
 */

export type SortMode = 'newest' | 'oldest' | 'custom';

const STORAGE_KEY = 'dashboard-sort-mode';
const DEFAULT_SORT_MODE: SortMode = 'newest';

export class SortModeStorage {
    /**
     * Load the saved sort mode from localStorage
     */
    static loadSortMode(): SortMode {
        try {
            if (typeof window === 'undefined') {
                return DEFAULT_SORT_MODE;
            }

            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) {
                return DEFAULT_SORT_MODE;
            }

            const parsed = JSON.parse(saved);

            // Validate that the saved mode is one of the allowed values
            if (parsed === 'newest' || parsed === 'oldest' || parsed === 'custom') {
                return parsed;
            }

            // If invalid, return default and clean up
            localStorage.removeItem(STORAGE_KEY);
            return DEFAULT_SORT_MODE;
        } catch (error) {
            console.warn('Failed to load sort mode from localStorage:', error);
            return DEFAULT_SORT_MODE;
        }
    }

    /**
     * Save the sort mode to localStorage
     */
    static saveSortMode(sortMode: SortMode): void {
        try {
            if (typeof window === 'undefined') {
                return;
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(sortMode));
        } catch (error) {
            console.warn('Failed to save sort mode to localStorage:', error);
        }
    }

    /**
     * Clear the sort mode from localStorage (resets to default)
     */
    static clearSortMode(): void {
        try {
            if (typeof window === 'undefined') {
                return;
            }

            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.warn('Failed to clear sort mode from localStorage:', error);
        }
    }
}
