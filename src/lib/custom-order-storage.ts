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
     * Move item in custom order with automatic position assignment for missing items
     */
    static moveItem(currentOrder: string[], itemId: string, direction: 'left' | 'right', allItemIds?: string[]): string[] {
        // If we have all item IDs, ensure all items are in the order to prevent jumping
        if (allItemIds && allItemIds.length > 0) {
            return this.moveItemWithFullOrder(currentOrder, itemId, direction, allItemIds);
        }

        // Fallback to simple move (backwards compatibility)
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
     * Move item with full order assignment to prevent jumping
     */
    private static moveItemWithFullOrder(currentOrder: string[], itemId: string, direction: 'left' | 'right', allItemIds: string[]): string[] {
        // Create a complete order array with all items
        const completeOrder = this.createCompleteOrder(currentOrder, allItemIds);

        const currentIndex = completeOrder.indexOf(itemId);
        if (currentIndex === -1) {
            // This shouldn't happen, but fallback gracefully
            return direction === 'left' ? [itemId, ...currentOrder] : [...currentOrder, itemId];
        }

        const newOrder = [...completeOrder];
        const targetIndex = direction === 'left'
            ? Math.max(0, currentIndex - 1)
            : Math.min(completeOrder.length - 1, currentIndex + 1);

        // Swap items
        [newOrder[currentIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[currentIndex]];

        return newOrder;
    }

    /**
     * Create a complete order by inserting missing items in their current visual positions
     */
    private static createCompleteOrder(currentOrder: string[], allItemIds: string[]): string[] {
        const orderedSet = new Set(currentOrder);
        const unorderedItems = allItemIds.filter(id => !orderedSet.has(id));

        // If no unordered items, return current order filtered to only include existing items
        if (unorderedItems.length === 0) {
            return currentOrder.filter(id => allItemIds.includes(id));
        }

        // Insert unordered items at the end to maintain their current visual order
        // In the future, we could be smarter about this by considering their actual visual positions
        return [...currentOrder.filter(id => allItemIds.includes(id)), ...unorderedItems];
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

    /**
     * Initialize custom order from current visual order (when switching to custom mode)
     */
    static initializeFromVisualOrder(visualOrder: string[]): string[] {
        // Return the visual order as the new custom order
        // This ensures all items have positions and no jumping occurs
        return [...visualOrder];
    }

    /**
     * Ensure all items are included in custom order, adding new items at appropriate positions
     */
    static ensureAllItemsInOrder(currentOrder: string[], allItemIds: string[]): string[] {
        const orderedSet = new Set(currentOrder);
        const newItems = allItemIds.filter(id => !orderedSet.has(id));

        if (newItems.length === 0) {
            // Remove any items that no longer exist
            return currentOrder.filter(id => allItemIds.includes(id));
        }

        // Add new items at the beginning (newest items should appear first by default)
        return [...newItems, ...currentOrder.filter(id => allItemIds.includes(id))];
    }
}
