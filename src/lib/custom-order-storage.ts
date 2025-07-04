/**
 * Utility for managing custom sort order in localStorage
 */

const CUSTOM_ORDER_STORAGE_KEY = 'dashboard-custom-order';

export interface CustomOrderState {
    itemOrder: string[]; // Array of item IDs in custom order
}

export class CustomOrderStorage {
    /**
     * Load custom order from localStorage
     */
    static loadOrder(): string[] {
        if (typeof window === 'undefined') {
            return [];
        }

        try {
            const stored = localStorage.getItem(CUSTOM_ORDER_STORAGE_KEY);
            if (!stored) {
                return [];
            }

            const parsed: CustomOrderState = JSON.parse(stored);
            return parsed.itemOrder || [];
        } catch (error) {
            console.warn('Failed to load custom order from localStorage:', error);
            return [];
        }
    }

    /**
     * Save custom order to localStorage
     */
    static saveOrder(itemOrder: string[]): void {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            const state: CustomOrderState = {
                itemOrder
            };
            localStorage.setItem(CUSTOM_ORDER_STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.warn('Failed to save custom order to localStorage:', error);
        }
    }

    /**
     * Clear custom order from localStorage
     */
    static clearOrder(): void {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            localStorage.removeItem(CUSTOM_ORDER_STORAGE_KEY);
        } catch (error) {
            console.warn('Failed to clear custom order from localStorage:', error);
        }
    }

    /**
     * Move item in custom order
     */
    static moveItem(currentOrder: string[], itemId: string, direction: 'left' | 'right'): string[] {
        const currentIndex = currentOrder.indexOf(itemId);

        if (currentIndex === -1) {
            // Item not in order, add it to the appropriate position
            return direction === 'left' ? [itemId, ...currentOrder] : [...currentOrder, itemId];
        }

        const newOrder = [...currentOrder];
        const targetIndex = direction === 'left'
            ? Math.max(0, currentIndex - 1)
            : Math.min(currentOrder.length - 1, currentIndex + 1);

        // Swap items
        [newOrder[currentIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[currentIndex]];

        return newOrder;
    }

    /**
     * Clean up custom order by removing items that no longer exist
     */
    static cleanup(currentItemIds: string[]): void {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            const currentOrder = this.loadOrder();
            if (currentOrder.length === 0) {
                return; // Nothing to clean up
            }

            const validItemIds = new Set(currentItemIds);
            const cleanedOrder = currentOrder.filter(id => validItemIds.has(id));

            // Save cleaned order if it changed
            if (cleanedOrder.length !== currentOrder.length) {
                this.saveOrder(cleanedOrder);
            }
        } catch (error) {
            console.warn('Failed to cleanup custom order:', error);
        }
    }
}
