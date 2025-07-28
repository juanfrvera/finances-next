"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import AddItemDialog from "./AddItemDialog";
import ItemDialog from "./ItemDialog";
import GroupedDebtDialog from "./GroupedDebtDialog";
import { Card } from "@/components/ui/card";
import { PieChart as PieChartIcon, BarChart3, List, Users, UserX, Circle, Archive, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { CARD_SIZE_UNIT } from "@/lib/constants";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import { useCurrencyEvolutionMutations } from "@/hooks/useCurrencyEvolution";
import { CurrencyTabStorage, type CurrencyTab } from "@/lib/currency-tab-storage";
import { DebtGroupingStorage } from "@/lib/debt-grouping-storage";
import { CustomOrderStorage } from "@/lib/custom-order-storage";
import { SortModeStorage, type SortMode } from "@/lib/sort-mode-storage";
import { archiveItem, unarchiveItem } from "@/app/actions";
import { showToast } from "@/lib/toast";
import type { DebtItem, ComponentItem } from "@/lib/types";

// Dynamically import PieChartDisplay with SSR disabled to prevent hydration mismatch
const PieChartDisplay = dynamic(() => import("./PieChartDisplay"), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-32">Loading chart...</div>
});

// Dynamically import CurrencyEvolutionChart with SSR disabled
const CurrencyEvolutionChart = dynamic(() => import("./CurrencyEvolutionChart"), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-32">Loading evolution chart...</div>
});

// Filter options type
type FilterOption = 'all' | 'debts' | 'services' | 'accounts' | 'currencies';

interface DashboardClientProps {
    items: any[];
    archivedItems: any[];
    availableCurrencies: string[];
    availablePersons: string[];
}

// Helper function to format money with smaller decimals
function formatMoney(amount: number) {
    const formatted = Number(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const parts = formatted.split('.');

    return (<span>{parts[0]}<span className="text-sm">.{parts[1]}</span></span>);
}

// Helper function to generate debt summary text for dashboard display
function getDebtSummaryText(item: any) {
    const personName = item.withWho || item.name || 'Someone';
    const totalAmount = item.amount || 0;
    const totalPaid = item.totalPaid || 0;
    const remainingAmount = totalAmount - totalPaid; // Calculate remaining amount instead of relying on stored value
    const currency = item.currency || 'USD';
    const theyPayMe = item.theyPayMe; // true = they owe me, false = I owe them

    if (totalPaid === 0) {
        // No payments made - show full amount owed
        if (theyPayMe) {
            return {
                text: `${personName} owes you`,
                amount: totalAmount,
                currency
            };
        } else {
            return {
                text: `You owe`,
                amount: totalAmount,
                currency,
                toWho: personName
            };
        }
    } else if (remainingAmount <= 0) {
        // Fully paid - show past tense with full amount
        if (theyPayMe) {
            return {
                text: `${personName} fully paid you`,
                amount: totalAmount,
                currency,
                isPaid: true
            };
        } else {
            return {
                text: `You fully paid`,
                amount: totalAmount,
                currency,
                toWho: personName,
                isPaid: true
            };
        }
    } else {
        // Partially paid - show remaining amount for current debt
        if (theyPayMe) {
            return {
                text: `${personName} owes you`,
                amount: remainingAmount,
                currency
            };
        } else {
            return {
                text: `You owe`,
                amount: remainingAmount,
                currency,
                toWho: personName
            };
        }
    }
}

export default function DashboardClient({ items, archivedItems, availableCurrencies: propsCurrencies = [], availablePersons: propsPersons = [] }: DashboardClientProps) {
    const [clientItems, setClientItems] = useState<any[]>(items);
    const [clientArchivedItems, setClientArchivedItems] = useState<any[]>(archivedItems);
    
    // Use currencies and persons from props if provided, otherwise fall back to calculating from items
    const availableCurrencies = useMemo(() => {
        if (propsCurrencies.length > 0) {
            return propsCurrencies;
        }
        // Fallback to old method if no currencies provided
        return Array.from(new Set(
            clientItems
                .filter(item => item.type === 'currency')
                .map(item => item.currency)
        )).filter(Boolean).sort();
    }, [clientItems, propsCurrencies]);
    
    // Use persons from props if provided, otherwise fall back to calculating from items
    const availablePersons = useMemo(() => {
        if (propsPersons.length > 0) {
            return propsPersons;
        }
        // Fallback to old method if no persons provided
        return Array.from(new Set(
            clientItems
                .filter(item => item.type === 'debt' && item.withWho)
                .map(item => item.withWho)
        )).filter(Boolean).sort();
    }, [clientItems, propsPersons]);
    
    const [showArchived, setShowArchived] = useState(false);
    const [sortMode, setSortMode] = useState<SortMode>('newest'); // Updated sorting system
    const [isSortModeHydrated, setIsSortModeHydrated] = useState(false); // Track if sort mode is loaded
    const [customOrder, setCustomOrder] = useState<string[]>([]); // Custom order of items
    const [isCustomOrderHydrated, setIsCustomOrderHydrated] = useState(false); // Track if custom order is loaded
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [groupedDebtDialogOpen, setGroupedDebtDialogOpen] = useState(false);
    const [selectedGroupedDebt, setSelectedGroupedDebt] = useState<any | null>(null);
    const [showJson, setShowJson] = useState(false); // NEW: toggle for JSON.stringify
    const [cardSizes, setCardSizes] = useState<Record<string, { width: number; height: number }>>({});
    const [groupedDebts, setGroupedDebts] = useState<Set<string>>(new Set()); // Track grouped debt keys
    const [isGroupingHydrated, setIsGroupingHydrated] = useState(false); // Track if grouping state is loaded
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        item: any;
    } | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [filterOptions, setFilterOptions] = useState<Set<FilterOption>>(new Set(['all'])); // Track selected filters

    // TanStack Query mutations for cache invalidation
    const { invalidateCurrency } = useCurrencyEvolutionMutations();

    // Handle filter option toggle
    const handleFilterToggle = (option: FilterOption) => {
        setFilterOptions(prev => {
            const newSet = new Set(prev);
            
            if (option === 'all') {
                // If clicking 'all', select only 'all' and deselect others
                return new Set(['all']);
            } else {
                // If clicking a specific option
                if (newSet.has('all')) {
                    // If 'all' is selected, deselect it and select the clicked option
                    newSet.delete('all');
                    newSet.add(option);
                } else {
                    // Toggle the specific option
                    if (newSet.has(option)) {
                        newSet.delete(option);
                        // If no specific options remain, default to 'all'
                        if (newSet.size === 0) {
                            newSet.add('all');
                        }
                    } else {
                        newSet.add(option);
                    }
                }
            }
            
            return newSet;
        });
    };

    // Close context menu when clicking outside
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        const handleScroll = () => setContextMenu(null);
        if (contextMenu) {
            document.addEventListener('click', handleClick);
            document.addEventListener('scroll', handleScroll);
            return () => {
                document.removeEventListener('click', handleClick);
                document.removeEventListener('scroll', handleScroll);
            };
        }
    }, [contextMenu]);

    // Sync items with props
    useEffect(() => {
        setClientItems(items);
    }, [items]);

    // Sync archived items with props
    useEffect(() => {
        setClientArchivedItems(archivedItems);
    }, [archivedItems]);

    // Clean up localStorage entries for currencies that no longer exist
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Get all currency names from current items
            const existingCurrencies = clientItems
                .filter(item => item.type === 'currency')
                .map(item => item.currency);

            // Clean up entries for currencies that don't exist anymore
            CurrencyTabStorage.cleanup(existingCurrencies);
        }
    }, [clientItems]); // Run when items change

    // Load debt grouping state from localStorage after hydration
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedGroupingState = DebtGroupingStorage.loadState();
            setGroupedDebts(savedGroupingState);
            setIsGroupingHydrated(true);
        }
    }, []); // Load once after hydration

    // Load custom order from localStorage after hydration
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedCustomOrder = CustomOrderStorage.loadOrder();
            setCustomOrder(savedCustomOrder);
            setIsCustomOrderHydrated(true);
        }
    }, []); // Load once after hydration

    // Load sort mode from localStorage after hydration
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedSortMode = SortModeStorage.loadSortMode();
            setSortMode(savedSortMode);
            setIsSortModeHydrated(true);
        }
    }, []); // Load once after hydration    // Clean up localStorage entries for debt groups that no longer exist
    useEffect(() => {
        if (typeof window !== 'undefined' && isGroupingHydrated) {
            // Get current debt items
            const currentDebtItems = clientItems.filter(item => item.type === 'debt');

            // Clean up invalid grouping keys
            DebtGroupingStorage.cleanup(currentDebtItems);
        }
    }, [clientItems, isGroupingHydrated]); // Run when items change and after hydration

    // Clean up localStorage entries for custom order that no longer exist
    useEffect(() => {
        if (typeof window !== 'undefined' && isCustomOrderHydrated) {
            // Get current item IDs
            const currentItemIds = clientItems.map(item => item._id).filter(Boolean);

            // Clean up invalid order entries
            CustomOrderStorage.cleanup(currentItemIds);
        }
    }, [clientItems, isCustomOrderHydrated]); // Run when items change and after hydration

    // Save grouping state to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined' && isGroupingHydrated) {
            DebtGroupingStorage.saveState(groupedDebts);
        }
    }, [groupedDebts, isGroupingHydrated]); // Save whenever grouping state changes

    // Save custom order to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined' && isCustomOrderHydrated) {
            CustomOrderStorage.saveOrder(customOrder);
        }
    }, [customOrder, isCustomOrderHydrated]); // Save whenever custom order changes

    // Helper function to create a grouping key for debts
    const getDebtGroupKey = useCallback((debt: DebtItem) => {
        return `${debt.withWho}:${debt.theyPayMe}`;
    }, []);

    // Helper function to check if debts can be grouped
    const canGroupDebts = useCallback((debts: ComponentItem[]) => {
        const debtGroups = new Map<string, DebtItem[]>();

        debts.filter(item => item.type === 'debt').forEach(debt => {
            const groupKey = getDebtGroupKey(debt as DebtItem);
            if (!debtGroups.has(groupKey)) {
                debtGroups.set(groupKey, []);
            }
            debtGroups.get(groupKey)!.push(debt as DebtItem);
        });

        return debtGroups;
    }, [getDebtGroupKey]);

    // Helper function to create grouped debt item
    const createGroupedDebt = useCallback((debts: DebtItem[], groupKey: string) => {
        const [withWho, theyPayMe] = groupKey.split(':');

        // Group debts by currency
        const currencyTotals = new Map<string, {
            amount: number;
            totalPaid: number;
            remainingAmount: number;
            transactionCount: number;
        }>();

        debts.forEach(debt => {
            const currency = debt.currency || 'USD';
            const current = currencyTotals.get(currency) || {
                amount: 0,
                totalPaid: 0,
                remainingAmount: 0,
                transactionCount: 0
            };

            current.amount += debt.amount || 0;
            current.totalPaid += debt.totalPaid || 0;
            current.transactionCount += debt.transactionCount || 0;
            current.remainingAmount = current.amount - current.totalPaid;

            currencyTotals.set(currency, current);
        });

        // Convert to array for easier handling
        const currencyBreakdown = Array.from(currencyTotals.entries()).map(([currency, totals]) => ({
            currency,
            ...totals,
            paymentStatus: totals.remainingAmount <= 0 ? 'paid' :
                totals.totalPaid > 0 ? 'partially_paid' : 'unpaid'
        }));

        // Calculate overall totals (for legacy compatibility, use first currency)
        const totalAmount = debts.reduce((sum, debt) => sum + (debt.amount || 0), 0);
        const totalPaid = debts.reduce((sum, debt) => sum + (debt.totalPaid || 0), 0);
        const remainingAmount = totalAmount - totalPaid;
        const currency = debts[0]?.currency || 'USD';
        const transactionCount = debts.reduce((sum, debt) => sum + (debt.transactionCount || 0), 0);

        // Determine overall payment status
        let paymentStatus = 'unpaid';
        if (remainingAmount <= 0) {
            paymentStatus = 'paid';
        } else if (totalPaid > 0) {
            paymentStatus = 'partially_paid';
        }

        return {
            _id: `grouped-${groupKey}`,
            type: 'debt' as const,
            withWho,
            theyPayMe: theyPayMe === 'true',
            amount: totalAmount,
            totalPaid,
            remainingAmount,
            currency,
            paymentStatus: paymentStatus as 'paid' | 'partially_paid' | 'unpaid',
            transactionCount,
            currencyBreakdown, // New field with per-currency breakdown
            description: `${debts.length} debts grouped`,
            name: `Grouped: ${withWho}`,
            isGrouped: true,
            groupedItems: debts,
            editDate: new Date(Math.max(...debts.map(d => new Date(d.editDate || 0).getTime()))).toISOString(),
            // Required fields from Debt type
            createDate: debts[0]?.createDate || new Date().toISOString(),
            userId: debts[0]?.userId || '',
            // Optional fields that may exist on grouped debts
            archived: false
        } as DebtItem;
    }, []);

    // Helper function to process items with grouping
    const processItemsWithGrouping = useCallback((items: ComponentItem[]) => {
        const debtGroups = canGroupDebts(items);
        const processedItems: ComponentItem[] = [];
        const usedDebtIds = new Set<string>();

        // Add grouped debts
        debtGroups.forEach((debts, groupKey) => {
            const isGrouped = groupedDebts.has(groupKey);

            if (isGrouped && debts.length >= 2) {
                // Show as grouped
                processedItems.push(createGroupedDebt(debts, groupKey));
                debts.forEach(debt => usedDebtIds.add(debt._id));
            } else {
                // Show individually (not grouped or only one item)
                debts.forEach(debt => processedItems.push(debt));
                debts.forEach(debt => usedDebtIds.add(debt._id));
            }
        });

        // Add non-debt items
        items.filter(item => item.type !== 'debt').forEach(item => {
            processedItems.push(item);
        });

        return processedItems;
    }, [canGroupDebts, groupedDebts, createGroupedDebt]);

    // Ensure all items are included in custom order when in custom mode and items change
    useEffect(() => {
        if (typeof window !== 'undefined' && isCustomOrderHydrated && sortMode === 'custom' && customOrder.length > 0) {
            const currentItemsToDisplay = showArchived ? clientArchivedItems : clientItems;
            const currentProcessedItems = processItemsWithGrouping(currentItemsToDisplay);
            const allItemIds = currentProcessedItems.map(item => item._id).filter(Boolean);

            const updatedOrder = CustomOrderStorage.ensureAllItemsInOrder(customOrder, allItemIds);
            if (updatedOrder.length !== customOrder.length || !updatedOrder.every((id, index) => id === customOrder[index])) {
                setCustomOrder(updatedOrder);
            }
        }
    }, [clientItems, clientArchivedItems, showArchived, isCustomOrderHydrated, sortMode, customOrder, processItemsWithGrouping]); // Run when items or view changes

    // Save sort mode to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined' && isSortModeHydrated) {
            SortModeStorage.saveSortMode(sortMode);
        }
    }, [sortMode, isSortModeHydrated]); // Save whenever sort mode changes

    // Helper function to recalculate currency values based on account items
    function recalculateCurrencyValues(items: any[]) {
        const accountItems = items.filter((item) => item.type === "account");

        return items.map((item) => {
            if (item.type === "currency") {
                const accounts = accountItems.filter((acc) => acc.currency === item.currency);
                const sum = accounts.reduce((acc, curr) => acc + Number(curr.balance), 0);
                const accountBreakdown = accounts.map(acc => ({
                    id: acc._id,
                    name: acc.name,
                    balance: Number(acc.balance),
                }));
                return { ...item, value: sum, accountBreakdown };
            }
            return item;
        });
    }

    function handleItemCreated(newItem: any) {
        setClientItems((prev) => {
            const updatedItems = [newItem, ...prev];

            // If an account was created, recalculate currency values
            if (newItem.type === 'account') {
                return recalculateCurrencyValues(updatedItems);
            }

            return updatedItems;
        });

        // Invalidate currency evolution cache after state update
        if (newItem.type === 'account' && newItem.currency) {
            // Use setTimeout to ensure this runs after the state update
            setTimeout(() => {
                invalidateCurrency(newItem.currency);
            }, 0);
        }
    }
    function handleItemUpdated(updated: any) {
        setClientItems((prev) => {
            const updatedItems = prev.map(i => i._id === updated._id ? updated : i);

            // If an account was updated, recalculate currency values
            if (updated.type === 'account') {
                return recalculateCurrencyValues(updatedItems);
            }

            return updatedItems;
        });

        // Invalidate currency evolution cache after state update
        if (updated.type === 'account' && updated.currency) {
            // Use setTimeout to ensure this runs after the state update
            setTimeout(() => {
                invalidateCurrency(updated.currency);
            }, 0);
        }
    }
    function handleItemDeleted(id: string) {
        // Find the deleted item to check if it was an account before deletion
        const deletedItem = clientItems.find(i => i._id === id);
        const shouldInvalidateCache = deletedItem && deletedItem.type === 'account' && deletedItem.currency;
        const currencyToInvalidate = shouldInvalidateCache ? deletedItem.currency : null;

        setClientItems((prev) => {
            const filteredItems = prev.filter(i => i._id !== id);

            if (deletedItem && deletedItem.type === 'account') {
                // If an account was deleted, recalculate currency values
                return recalculateCurrencyValues(filteredItems);
            }

            return filteredItems;
        });

        // Invalidate currency evolution cache after state update
        if (currencyToInvalidate) {
            // Use setTimeout to ensure this runs after the state update
            setTimeout(() => {
                invalidateCurrency(currencyToInvalidate);
            }, 0);
        }
    }

    function handleItemArchived(updated: any) {
        // Move item from active to archived
        setClientItems((prev) => prev.filter(i => i._id !== updated._id));
        setClientArchivedItems((prev) => [...prev, updated]);
    }

    function handleItemUnarchived(updated: any) {
        // Move item from archived to active
        setClientArchivedItems((prev) => prev.filter(i => i._id !== updated._id));
        setClientItems((prev) => {
            const updatedItems = [...prev, updated];

            // If an account was unarchived, recalculate currency values
            if (updated.type === 'account') {
                return recalculateCurrencyValues(updatedItems);
            }

            return updatedItems;
        });

        // Invalidate currency evolution cache after state update
        if (updated.type === 'account' && updated.currency) {
            // Use setTimeout to ensure this runs after the state update
            setTimeout(() => {
                invalidateCurrency(updated.currency);
            }, 0);
        }
    }

    const updateCardSize = useCallback((itemId: string, size: { width: number; height: number }) => {
        setCardSizes(prev => {
            // Only update if the size actually changed to prevent unnecessary re-renders
            const currentSize = prev[itemId];
            if (currentSize && currentSize.width === size.width && currentSize.height === size.height) {
                return prev;
            }
            return {
                ...prev,
                [itemId]: size
            };
        });
    }, []);




    // Function to toggle debt grouping
    const toggleDebtGrouping = (groupKey: string) => {
        setGroupedDebts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupKey)) {
                newSet.delete(groupKey);
            } else {
                newSet.add(groupKey);
            }
            return newSet;
        });
    };

    // Function to handle custom order moves
    const handleMoveItem = (itemId: string, direction: 'left' | 'right') => {
        // Get all current item IDs from the items being displayed
        const currentItemsToDisplay = showArchived ? clientArchivedItems : clientItems;
        const currentProcessedItems = processItemsWithGrouping(currentItemsToDisplay);
        const allItemIds = currentProcessedItems.map(item => item._id).filter(Boolean);

        // Switch to custom sort mode if not already there
        if (sortMode !== 'custom') {
            setSortMode('custom');
        }

        // Initialize custom order from current visual order if empty, then perform the move
        if (customOrder.length === 0) {
            // If no custom order exists, initialize from current visual order
            const currentVisualOrder = currentProcessedItems
                .slice()
                .sort((a, b) => {
                    // Sort by newest first (current default)
                    const aHasDate = !!a.editDate;
                    const bHasDate = !!b.editDate;
                    if (!aHasDate && !bHasDate) return 0;
                    if (!aHasDate) return 1;
                    if (!bHasDate) return -1;
                    const aDate = new Date(a.editDate).getTime();
                    const bDate = new Date(b.editDate).getTime();
                    return bDate - aDate;
                })
                .map(item => item._id)
                .filter(Boolean);

            // Initialize the order and then perform the move in one operation
            const initializedOrder = CustomOrderStorage.initializeFromVisualOrder(currentVisualOrder);
            const movedOrder = CustomOrderStorage.moveItem(initializedOrder, itemId, direction, allItemIds);
            setCustomOrder(movedOrder);
        } else {
            // Update custom order with complete item list to prevent jumping
            setCustomOrder(prev => CustomOrderStorage.moveItem(prev, itemId, direction, allItemIds));
        }
    };

    // Function to cycle through sort modes
    const cycleSortMode = () => {
        setSortMode(prev => {
            switch (prev) {
                case 'newest': return 'oldest';
                case 'oldest': return 'custom';
                case 'custom': return 'newest';
                default: return 'newest';
            }
        });
    };

    // Handle right-click context menu
    const handleContextMenu = (e: React.MouseEvent, item: any) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            item
        });
    };

    // Handle archive action
    const handleArchiveItem = async (item: any) => {
        const isArchiving = !item.archived;
        const loadingMessage = isArchiving ? 'Archiving item...' : 'Unarchiving item...';
        const successMessage = isArchiving ? 'Item archived successfully!' : 'Item unarchived successfully!';
        const errorMessage = isArchiving ? 'Failed to archive item' : 'Failed to unarchive item';

        const toastId = showToast.loading(loadingMessage);
        try {
            let updatedItem;
            if (isArchiving) {
                updatedItem = await archiveItem(item._id);
                handleItemArchived(updatedItem);
            } else {
                updatedItem = await unarchiveItem(item._id);
                handleItemUnarchived(updatedItem);
            }
            showToast.update(toastId, successMessage, 'success');
        } catch (error) {
            console.error('Failed to toggle archive status:', error);
            showToast.update(toastId, errorMessage, 'error');
        }
        setContextMenu(null);
    };

    // Handle delete confirmation
    const handleDeleteClick = (item: any) => {
        setItemToDelete(item);
        setShowDeleteConfirm(true);
        setContextMenu(null);
    };

    // Confirm delete
    const confirmDelete = () => {
        if (itemToDelete) {
            handleItemDeleted(itemToDelete._id);
            setItemToDelete(null);
        }
        setShowDeleteConfirm(false);
    };

    // Cancel delete
    const cancelDelete = () => {
        setItemToDelete(null);
        setShowDeleteConfirm(false);
    };

    // Sort by editDate, items with no date are considered oldest (last) when descending, newest (first) when ascending
    const itemsToDisplay = showArchived ? clientArchivedItems : clientItems;
    const processedItems = processItemsWithGrouping(itemsToDisplay);

    const sortedItems = processedItems.slice().sort((a, b) => {
        if (sortMode === 'custom') {
            // Custom sorting: use custom order positions with fallback
            const aIndex = customOrder.indexOf(a._id);
            const bIndex = customOrder.indexOf(b._id);

            if (aIndex !== -1 && bIndex !== -1) {
                // Both items are in custom order
                return aIndex - bIndex;
            } else if (aIndex !== -1) {
                // Only A is in custom order, A comes first
                return -1;
            } else if (bIndex !== -1) {
                // Only B is in custom order, B comes first
                return 1;
            }
            // Neither item is in custom order, maintain their relative position using date
            // This should rarely happen now that we assign positions to all items
        }

        // Date-based sorting (for newest/oldest modes and fallback for custom mode)
        const aHasDate = !!a.editDate;
        const bHasDate = !!b.editDate;
        if (!aHasDate && !bHasDate) return 0;

        const isNewestFirst = sortMode === 'newest' || sortMode === 'custom';
        if (!aHasDate) return isNewestFirst ? 1 : -1;
        if (!bHasDate) return isNewestFirst ? -1 : 1;

        const aDate = new Date(a.editDate).getTime();
        const bDate = new Date(b.editDate).getTime();
        return isNewestFirst ? bDate - aDate : aDate - bDate;
    });

    // Filter items based on the selected filter option
    const filteredItems = sortedItems.filter(item => {
        if (filterOptions.has('all')) return true;
        if (filterOptions.has('debts') && item.type === 'debt') return true;
        if (filterOptions.has('services') && item.type === 'service') return true;
        if (filterOptions.has('accounts') && item.type === 'account') return true;
        if (filterOptions.has('currencies') && item.type === 'currency') return true;
        return false;
    });

    return (
        <div>
            <ItemDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                item={selectedItem}
                onItemUpdated={handleItemUpdated}
                onItemDeleted={handleItemDeleted}
                onItemArchived={handleItemArchived}
                onItemUnarchived={handleItemUnarchived}
                availableCurrencies={availableCurrencies}
                availablePersons={availablePersons}
            />
            <GroupedDebtDialog
                open={groupedDebtDialogOpen}
                onOpenChange={setGroupedDebtDialogOpen}
                groupedDebt={selectedGroupedDebt}
                onDebtClick={(debt) => {
                    setSelectedItem(debt);
                    setEditDialogOpen(true);
                }}
            />

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed z-50 bg-background border border-border rounded-md shadow-lg py-1 min-w-[120px]"
                    style={{
                        left: contextMenu.x,
                        top: contextMenu.y,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Move Left option at the top */}
                    <button
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                        onClick={() => {
                            handleMoveItem(contextMenu.item._id, 'left');
                            setContextMenu(null);
                        }}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Move Left
                    </button>
                    <button
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                        onClick={() => handleArchiveItem(contextMenu.item)}
                    >
                        <Archive className="h-4 w-4" />
                        {contextMenu.item.archived ? 'Unarchive' : 'Archive'}
                    </button>
                    <button
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-destructive"
                        onClick={() => handleDeleteClick(contextMenu.item)}
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </button>
                    {/* Move Right option at the bottom */}
                    <button
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                        onClick={() => {
                            handleMoveItem(contextMenu.item._id, 'right');
                            setContextMenu(null);
                        }}
                    >
                        <ChevronRight className="h-4 w-4" />
                        Move Right
                    </button>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-background border border-border rounded-lg shadow-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            Are you sure you want to delete &ldquo;{itemToDelete?.name || itemToDelete?.description || 'this item'}&rdquo;?
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent hover:text-accent-foreground"
                                onClick={cancelDelete}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
                                onClick={confirmDelete}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Header with filter on left and controls on right */}
            <div className="flex justify-between items-center mb-4">
                {/* Filter options - Top Left */}
                <div className="flex">
                    <button
                        className={`px-3 py-1 rounded-l ${filterOptions.has('all') ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'} text-sm transition-colors border-r border-border/50`}
                        onClick={() => handleFilterToggle('all')}
                    >
                        All
                    </button>
                    <button
                        className={`px-3 py-1 ${filterOptions.has('debts') ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'} text-sm transition-colors border-r border-border/50`}
                        onClick={() => handleFilterToggle('debts')}
                    >
                        Debts
                    </button>
                    <button
                        className={`px-3 py-1 ${filterOptions.has('services') ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'} text-sm transition-colors border-r border-border/50`}
                        onClick={() => handleFilterToggle('services')}
                    >
                        Services
                    </button>
                    <button
                        className={`px-3 py-1 ${filterOptions.has('accounts') ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'} text-sm transition-colors border-r border-border/50`}
                        onClick={() => handleFilterToggle('accounts')}
                    >
                        Accounts
                    </button>
                    <button
                        className={`px-3 py-1 rounded-r ${filterOptions.has('currencies') ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'} text-sm transition-colors`}
                        onClick={() => handleFilterToggle('currencies')}
                    >
                        Currencies
                    </button>
                </div>
                
                {/* Existing controls - Top Right */}
                <div className="flex gap-2 items-center">
                    <button
                        className="px-3 py-1 rounded bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm transition-colors"
                        onClick={() => setShowArchived(v => !v)}
                    >
                        {showArchived ? `Active Items (${clientItems.length})` : `Archived Items (${clientArchivedItems.length})`}
                    </button>
                    <button
                        className="px-3 py-1 rounded bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm transition-colors"
                        onClick={cycleSortMode}
                    >
                        Sort: {sortMode === 'newest' ? 'Newest first' : sortMode === 'oldest' ? 'Oldest first' : 'Custom order'}
                    </button>
                    <button
                        className="p-1 rounded hover:bg-secondary/80 focus:outline-none transition-colors"
                        aria-label={showJson ? 'Hide all JSON' : 'Show all JSON'}
                        onClick={() => setShowJson(v => !v)}
                    >
                        {/* Dev mode icon: code brackets */}
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${showJson ? 'text-blue-600' : 'text-muted-foreground'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
                        </svg>
                    </button>
                    <LogoutButton />
                    <ThemeToggle />
                </div>
            </div>
            
            {/* CSS Grid masonry layout */}
            <div className="dashboard-grid mt-4">
                <AddItemDialog 
                    onItemCreated={handleItemCreated} 
                    availableCurrencies={availableCurrencies}
                    availablePersons={availablePersons}
                />
                {filteredItems.map((item, idx) => {
                    const itemId = item._id?.toString() ?? `item-${idx}`;
                    const cardSize = cardSizes[itemId] || { width: 1, height: 1 }; // Default to 1x1
                    const isExpanded = cardSize.width > 1 || cardSize.height > 1;

                    if (
                        item.type === "account" ||
                        item.type === "currency" ||
                        item.type === "debt" ||
                        item.type === "service"
                    ) {
                        return (
                            <ItemCard
                                key={itemId}
                                {...item}
                                showJson={showJson}
                                cardSize={cardSize}
                                isExpanded={isExpanded}
                                onUpdateSize={(size: { width: number; height: number }) => updateCardSize(itemId, size)}
                                onClick={() => { setSelectedItem(item); setEditDialogOpen(true); }}
                                onContextMenu={(e: React.MouseEvent) => handleContextMenu(e, item)}
                                // Pass grouping functionality for debt items
                                canGroupDebts={canGroupDebts}
                                toggleDebtGrouping={toggleDebtGrouping}
                                groupedDebts={groupedDebts}
                                allItems={itemsToDisplay}
                                onGroupedDebtClick={(groupedDebt) => {
                                    setSelectedGroupedDebt(groupedDebt);
                                    setGroupedDebtDialogOpen(true);
                                }}
                            />
                        );
                    }
                    return (
                        <div key={itemId}>
                            <Card style={{ width: CARD_SIZE_UNIT, height: CARD_SIZE_UNIT }} className="p-4">
                                {showJson && <pre>{JSON.stringify(item, null, 2)}</pre>}
                            </Card>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ItemCard(props: any) {
    // Remove overflow-hidden so child content can overflow if needed
    const {
        showJson,
        cardSize: _cardSize,
        onUpdateSize,
        isExpanded,
        onClick,
        onContextMenu,
        canGroupDebts,
        toggleDebtGrouping,
        groupedDebts,
        allItems,
        onGroupedDebtClick,
        ...rest
    } = props;

    return (
        <Card
            className={`relative group p-0 cursor-pointer transition-all duration-200 hover:shadow-lg hover:bg-accent/50 hover:border-accent-foreground/20 hover:scale-[1.02] dark:hover:bg-accent/30 dark:hover:border-accent-foreground/30 ${isExpanded ? 'expanded-card' : ''} ${rest.archived ? 'opacity-60' : ''}`} // p-0 because children will have padding, dimmed if archived
            style={{
                // Let CSS Grid handle the sizing, just set minimum dimensions
                minWidth: CARD_SIZE_UNIT,
                minHeight: CARD_SIZE_UNIT,
                // Ensure we fill the grid area for expanded cards
                ...(isExpanded && {
                    width: '100%',
                    height: '100%',
                }),
            }}
            onClick={rest.type === 'debt' ? undefined : onClick} // Don't handle click for debt items at card level
            onContextMenu={onContextMenu}
        >
            {rest.archived && (
                <div className="absolute top-2 right-2 z-10 bg-muted text-muted-foreground text-xs px-2 py-1 rounded">
                    Archived
                </div>
            )}
            {rest.type === 'account' && <Account data={rest} showJson={showJson} />}
            {rest.type === 'currency' && <Currency data={rest} showJson={showJson} onUpdateSize={onUpdateSize} />}
            {rest.type === 'debt' && (
                <Debt
                    data={rest}
                    showJson={showJson}
                    canGroupDebts={canGroupDebts}
                    toggleDebtGrouping={toggleDebtGrouping}
                    groupedDebts={groupedDebts}
                    allItems={allItems}
                    onClick={onClick}
                    onGroupedDebtClick={onGroupedDebtClick}
                />
            )}
            {rest.type === 'service' && <Service data={rest} showJson={showJson} />}
            {!['account', 'currency', 'debt', 'service'].includes(rest.type) && (
                <div className="flex items-center justify-center p-4 w-full h-full">
                    {showJson && <pre>{JSON.stringify(rest, null, 2)}</pre>}
                </div>
            )}
        </Card>
    );
}

function Account({ data, showJson }: any) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-4 h-full">
            <h2 className="text-lg font-semibold mb-2">{data.name}</h2>
            <div className="text-2xl font-bold flex items-baseline gap-1 justify-center">
                {formatMoney(data.balance)}
                <span className="text-base font-normal ml-1">{data.currency}</span>
            </div>
            {showJson && <pre className="text-xs max-h-24 overflow-auto w-full break-words whitespace-pre-wrap bg-muted rounded p-1 mt-2">{JSON.stringify(data, null, 2)}</pre>}
        </div>
    );
}

interface CurrencyProps {
    data: {
        currency: string;
        value: number;
        accountBreakdown?: { id: string; name: string; balance: number }[];
    };
    showJson: boolean;
    onUpdateSize: (size: { width: number; height: number }) => void;
}

function Currency({ data, showJson, onUpdateSize }: CurrencyProps) {
    const COLORS = [
        '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1', '#a4de6c', '#d0ed57', '#fa8072', '#b0e0e6', '#f08080',
    ];
    const breakdown = data.accountBreakdown || [];

    // Always start with 'simple' for SSR compatibility
    const [activeTab, setActiveTab] = useState<CurrencyTab>('simple');
    const [isHydrated, setIsHydrated] = useState(false);

    // Load saved tab from localStorage after hydration
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsHydrated(true);
            try {
                const savedTab = CurrencyTabStorage.getTab(data.currency);
                // Ensure the saved tab is valid for the current state
                if (breakdown.length === 0 && savedTab !== 'simple') {
                    setActiveTab('simple');
                    CurrencyTabStorage.saveTab(data.currency, 'simple');
                } else {
                    setActiveTab(savedTab);
                }
            } catch (error) {
                console.warn('Failed to load saved tab for currency:', data.currency, error);
                setActiveTab('simple');
            }
        }
    }, [data.currency, breakdown.length]); // Load once after hydration

    // Update card size when tab changes and save to localStorage
    const updateSize = (newTab: CurrencyTab) => {
        setActiveTab(newTab);

        // Save to localStorage
        if (typeof window !== 'undefined') {
            CurrencyTabStorage.saveTab(data.currency, newTab);
        }

        if (breakdown.length > 0) {
            const size = (newTab === 'pie' || newTab === 'bar') ? { width: 2, height: 2 } : { width: 1, height: 1 };
            onUpdateSize(size);
        }
    };

    // Set initial size on mount based on saved tab - only after hydration
    useEffect(() => {
        if (!isHydrated) return; // Wait for hydration to complete

        let targetSize: { width: number; height: number };

        if (breakdown.length > 0) {
            targetSize = (activeTab === 'pie' || activeTab === 'bar') ? { width: 2, height: 2 } : { width: 1, height: 1 };
        } else {
            // Always start with 1x1 for simple view when no breakdown
            targetSize = { width: 1, height: 1 };
            // If there's no breakdown but a non-simple tab is selected, reset to simple
            if (activeTab !== 'simple') {
                setActiveTab('simple');
                if (typeof window !== 'undefined') {
                    CurrencyTabStorage.saveTab(data.currency, 'simple');
                }
                return; // Exit early to avoid calling onUpdateSize with wrong size
            }
        }

        onUpdateSize(targetSize);
    }, [activeTab, breakdown.length, data.currency, isHydrated, onUpdateSize]); // Include isHydrated and onUpdateSize

    const tabs = [
        { id: 'simple' as const, icon: List, label: 'Simple view' },
        { id: 'pie' as const, icon: PieChartIcon, label: 'Pie chart', disabled: breakdown.length === 0 },
        { id: 'bar' as const, icon: BarChart3, label: 'Evolution chart', disabled: breakdown.length === 0 },
    ];

    return (
        <div className="flex flex-col items-center justify-center h-full p-4">
            <div className="flex items-center w-full justify-between mb-2">
                <h2 className="text-lg font-semibold text-center flex-1">{data.currency}</h2>

                {/* Tab buttons */}
                <div className="flex gap-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                className={`p-1.5 rounded hover:bg-accent focus:outline-none transition-colors cursor-pointer ${isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : tab.disabled
                                        ? 'text-muted-foreground/50 cursor-not-allowed'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                aria-label={tab.label}
                                onClick={e => {
                                    e.stopPropagation();
                                    if (!tab.disabled) updateSize(tab.id);
                                }}
                                disabled={tab.disabled}
                                tabIndex={0}
                            >
                                <Icon
                                    size={16}
                                    className={`transition-all ${isActive ? 'opacity-100' : 'opacity-70'
                                        }`}
                                />
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="text-2xl font-bold flex items-baseline gap-1 justify-center mb-2">
                {formatMoney(data.value)}
                <span className="text-base font-normal ml-1">{data.currency}</span>
            </div>

            {/* Tab content */}
            {activeTab === 'simple' && (
                <div className="text-center">
                    {breakdown.length > 0 ? (
                        <p className="text-sm text-muted-foreground">
                            {breakdown.length} account{breakdown.length > 1 ? 's' : ''}
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground">No accounts</p>
                    )}
                </div>
            )}

            {activeTab === 'pie' && breakdown.length > 0 && (
                <div className="w-full flex-grow flex flex-col items-center mt-2">
                    <PieChartDisplay
                        breakdown={breakdown}
                        colors={COLORS}
                        width={400}
                        height={280}
                        outerRadius={90}
                    />
                </div>
            )}

            {activeTab === 'bar' && breakdown.length > 0 && (
                <div className="w-full flex-grow flex flex-col items-center justify-center mt-2">
                    <CurrencyEvolutionChart currency={data.currency} />
                </div>
            )}

            {breakdown.length === 0 && (
                <div className="text-sm text-muted-foreground text-center mt-2">
                    <p>No accounts found</p>
                    <p className="text-xs mt-1">Create accounts with this currency to see breakdown</p>
                </div>
            )}

            {showJson && <pre className="text-xs max-h-24 overflow-auto w-full break-words whitespace-pre-wrap bg-muted rounded p-1 mt-2">{JSON.stringify(data, null, 2)}</pre>}
        </div>
    );
}

function Debt({ data, showJson, canGroupDebts, toggleDebtGrouping, groupedDebts, allItems, onClick, onGroupedDebtClick }: any) {
    // Helper function to create grouping key
    const getDebtGroupKey = (debt: any) => `${debt.withWho}:${debt.theyPayMe}`;

    // Determine payment status display
    const getPaymentStatusInfo = () => {
        if (!data.paymentStatus) {
            return { text: 'Status unknown', color: 'text-muted-foreground' };
        }

        switch (data.paymentStatus) {
            case 'paid':
                return { text: 'Fully paid', color: 'text-green-600 dark:text-green-400' };
            case 'partially_paid':
                return { text: 'Partially paid', color: 'text-yellow-600 dark:text-yellow-400' };
            case 'unpaid':
                return { text: 'Unpaid', color: 'text-red-600 dark:text-red-400' };
            default:
                return { text: 'Status unknown', color: 'text-muted-foreground' };
        }
    };

    const _statusInfo = getPaymentStatusInfo();

    // Handle click on the debt content (not the icons)
    const handleDebtClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (data.isGrouped && onGroupedDebtClick) {
            onGroupedDebtClick(data);
        } else if (onClick && !data.isGrouped) {
            onClick();
        }
    };

    // Handle grouping/ungrouping
    const handleGroupToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        const groupKey = getDebtGroupKey(data);
        if (toggleDebtGrouping) {
            toggleDebtGrouping(groupKey);
        }
    };

    // Check if this debt can be grouped with others
    const canBeGrouped = () => {
        if (!canGroupDebts || !allItems) return false;

        const debtGroups = canGroupDebts(allItems);
        const groupKey = getDebtGroupKey(data);
        const groupItems = debtGroups.get(groupKey) || [];

        return groupItems.length >= 2;
    };

    // Check if this debt is currently grouped
    const isCurrentlyGrouped = () => {
        if (!groupedDebts) return false;
        const groupKey = getDebtGroupKey(data);
        return groupedDebts.has(groupKey);
    };

    const showGroupIcon = canBeGrouped();
    const isGrouped = isCurrentlyGrouped();

    // Handle grouped debt display
    if (data.isGrouped) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-4 h-full relative">
                {/* Ungroup icon */}
                <button
                    onClick={handleGroupToggle}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-accent transition-colors"
                    title="Ungroup debts"
                >
                    <UserX className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>

                {/* Clickable content */}
                <div
                    className="cursor-pointer w-full h-full flex flex-col items-center justify-center"
                    onClick={handleDebtClick}
                >
                    <div className="text-base mb-2">{data.description}</div>

                    {/* Display currency breakdown if available */}
                    {data.currencyBreakdown && data.currencyBreakdown.length > 0 ? (
                        <div className="mb-2">
                            <div className="text-lg font-semibold mb-2">
                                {(() => {
                                    // For grouped debts, show appropriate header based on payment status
                                    const totalPaid = data.totalPaid || 0;
                                    const totalAmount = data.amount || 0;
                                    const remainingAmount = data.remainingAmount || totalAmount;

                                    if (totalPaid === 0) {
                                        return data.theyPayMe ?
                                            <>{data.withWho} owes you:</> :
                                            <>You owe {data.withWho}:</>;
                                    } else if (remainingAmount <= 0) {
                                        return data.theyPayMe ?
                                            <>{data.withWho} paid you:</> :
                                            <>You paid {data.withWho}:</>;
                                    } else {
                                        return data.theyPayMe ?
                                            <>{data.withWho} owes you:</> :
                                            <>You owe {data.withWho}:</>;
                                    }
                                })()}
                            </div>
                            <div className="space-y-1">
                                {data.currencyBreakdown.map((currencyInfo: any) => {
                                    const currencyTotalPaid = currencyInfo.totalPaid || 0;
                                    const currencyTotalAmount = currencyInfo.amount || 0;
                                    const currencyRemainingAmount = currencyInfo.remainingAmount || currencyTotalAmount;

                                    // Determine which amount to show based on payment status
                                    let displayAmount = currencyTotalAmount;
                                    let showProgress = false;

                                    if (currencyTotalPaid === 0) {
                                        // No payments - show original amount
                                        displayAmount = currencyTotalAmount;
                                    } else if (currencyRemainingAmount <= 0) {
                                        // Fully paid - show total amount paid
                                        displayAmount = currencyTotalAmount;
                                    } else {
                                        // Partially paid - show remaining amount
                                        displayAmount = currencyRemainingAmount;
                                        showProgress = true;
                                    }

                                    return (
                                        <div key={currencyInfo.currency} className="text-base font-medium flex items-center gap-2">
                                            <Circle className="h-2 w-2 fill-current text-muted-foreground" />
                                            <span>
                                                {formatMoney(displayAmount)} {currencyInfo.currency.toLowerCase()}
                                                {currencyRemainingAmount <= 0 && currencyTotalPaid > 0 && ' ✅'}
                                            </span>
                                            {/* Simplified payment progress */}
                                            {showProgress && (
                                                <div className="text-xs text-muted-foreground ml-2">
                                                    {formatMoney(currencyTotalPaid)} paid of {formatMoney(currencyTotalAmount)}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="text-lg font-semibold mb-2">
                            {(() => {
                                const summary = getDebtSummaryText(data);
                                return (
                                    <>
                                        {summary.text} {formatMoney(summary.amount)} {summary.currency}
                                        {summary.toWho && ` to ${summary.toWho}`}
                                        {summary.isPaid && ' ✅'}
                                    </>
                                );
                            })()}
                        </div>
                    )}

                    {/* Group details */}
                    <div className="text-xs text-muted-foreground mt-1">
                        <div>{data.groupedItems?.length || 0} debts grouped</div>
                        {data.paymentStatus && data.paymentStatus !== 'unpaid' && data.totalPaid && data.amount && (
                            <div>{formatMoney(data.totalPaid)} paid of {formatMoney(data.amount)}</div>
                        )}
                    </div>
                </div>

                {showJson && <pre className="text-xs max-h-24 overflow-auto w-full break-words whitespace-pre-wrap bg-muted rounded p-1 mt-2">{JSON.stringify(data, null, 2)}</pre>}
            </div>
        );
    }

    // Regular debt display
    return (
        <div className="flex flex-col items-center justify-center text-center p-4 h-full relative">
            {/* Group/ungroup icon */}
            {showGroupIcon && (
                <button
                    onClick={handleGroupToggle}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-accent transition-colors"
                    title={isGrouped ? "Ungroup debts" : "Group similar debts"}
                >
                    {isGrouped ? (
                        <UserX className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    ) : (
                        <Users className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    )}
                </button>
            )}

            <div
                className="cursor-pointer w-full h-full flex flex-col items-center justify-center"
                onClick={handleDebtClick}
            >
                <div className="text-base mb-2">{data.description}</div>
                <div className="text-lg font-semibold mb-2">
                    {(() => {
                        const summary = getDebtSummaryText(data);
                        return (
                            <>
                                {summary.text} {formatMoney(summary.amount)} {summary.currency}
                                {summary.toWho && ` to ${summary.toWho}`}
                                {summary.isPaid && ' ✅'}
                            </>
                        );
                    })()}
                </div>

                {/* Simple payment progress */}
                {data.paymentStatus && data.paymentStatus !== 'unpaid' && data.totalPaid && data.amount && (
                    <div className="text-xs text-muted-foreground mt-1">
                        {formatMoney(data.totalPaid)} paid of {formatMoney(data.amount)}
                    </div>
                )}
            </div>

            {showJson && <pre className="text-xs max-h-24 overflow-auto w-full break-words whitespace-pre-wrap bg-muted rounded p-1 mt-2">{JSON.stringify(data, null, 2)}</pre>}
        </div>
    );
}

function Service({ data, showJson }: any) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-4 h-full">
            <h2 className="text-lg font-semibold mb-1">{data.name}</h2>
            <div className="text-base font-medium mb-2">
                {formatMoney(data.cost)} {data.currency}
            </div>
            <div className="text-sm text-muted-foreground mb-2">
                {data.isManual ? 'Manual payment' : 'Payment is automatic'}
            </div>
            {data.notes && (
                <div className="text-xs text-muted-foreground mt-2 max-w-full break-words">
                    {data.notes}
                </div>
            )}
            {showJson && <pre className="text-xs max-h-24 overflow-auto w-full break-words whitespace-pre-wrap bg-muted rounded p-1 mt-2">{JSON.stringify(data, null, 2)}</pre>}
        </div>
    );
}
