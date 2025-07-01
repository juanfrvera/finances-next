/**
 * Utility for managing debt grouping state in localStorage
 */

const DEBT_GROUPING_STORAGE_KEY = 'debt-grouping-state';

export interface DebtGroupingState {
    groupedKeys: string[];
}

export class DebtGroupingStorage {
    /**
     * Load debt grouping state from localStorage
     */
    static loadState(): Set<string> {
        if (typeof window === 'undefined') {
            return new Set();
        }

        try {
            const stored = localStorage.getItem(DEBT_GROUPING_STORAGE_KEY);
            if (!stored) {
                return new Set();
            }

            const parsed: DebtGroupingState = JSON.parse(stored);
            return new Set(parsed.groupedKeys || []);
        } catch (error) {
            console.warn('Failed to load debt grouping state from localStorage:', error);
            return new Set();
        }
    }

    /**
     * Save debt grouping state to localStorage
     */
    static saveState(groupedDebts: Set<string>): void {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            const state: DebtGroupingState = {
                groupedKeys: Array.from(groupedDebts)
            };
            localStorage.setItem(DEBT_GROUPING_STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.warn('Failed to save debt grouping state to localStorage:', error);
        }
    }

    /**
     * Clear debt grouping state from localStorage
     */
    static clearState(): void {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            localStorage.removeItem(DEBT_GROUPING_STORAGE_KEY);
        } catch (error) {
            console.warn('Failed to clear debt grouping state from localStorage:', error);
        }
    }

    /**
     * Clean up invalid grouping keys based on current debt items
     * Removes grouping keys that no longer have corresponding debt items
     */
    static cleanup(currentDebtItems: Array<{ withWho: string; theyPayMe: boolean }>): void {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            const currentState = this.loadState();
            if (currentState.size === 0) {
                return; // Nothing to clean up
            }

            // Create set of valid group keys from current debt items
            const validGroupKeys = new Set<string>();
            const debtGroups = new Map<string, any[]>();

            currentDebtItems.forEach(debt => {
                const groupKey = `${debt.withWho}:${debt.theyPayMe}`;
                if (!debtGroups.has(groupKey)) {
                    debtGroups.set(groupKey, []);
                }
                debtGroups.get(groupKey)!.push(debt);
            });

            // Only keep group keys that have 2+ items (can actually be grouped)
            debtGroups.forEach((debts, groupKey) => {
                if (debts.length >= 2) {
                    validGroupKeys.add(groupKey);
                }
            });

            // Filter current state to only include valid keys
            const cleanedState = new Set<string>();
            currentState.forEach(key => {
                if (validGroupKeys.has(key)) {
                    cleanedState.add(key);
                }
            });

            // Save cleaned state if it changed
            if (cleanedState.size !== currentState.size) {
                this.saveState(cleanedState);
            }
        } catch (error) {
            console.warn('Failed to cleanup debt grouping state:', error);
        }
    }
}
