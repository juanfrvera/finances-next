"use client";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import AddItemDialog from "./AddItemDialog";
import ItemDialog from "./ItemDialog";
import { Card } from "@/components/ui/card";
import { PieChart as PieChartIcon, BarChart3, List } from "lucide-react";
import { CARD_SIZE_UNIT } from "@/lib/constants";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCurrencyEvolutionMutations } from "@/hooks/useCurrencyEvolution";
import { CurrencyTabStorage, type CurrencyTab } from "@/lib/currency-tab-storage";

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

interface DashboardClientProps {
    items: any[];
    archivedItems: any[];
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

export default function DashboardClient({ items, archivedItems }: DashboardClientProps) {
    const [clientItems, setClientItems] = useState<any[]>(items);
    const [clientArchivedItems, setClientArchivedItems] = useState<any[]>(archivedItems);
    const [showArchived, setShowArchived] = useState(false);
    const [sortDesc, setSortDesc] = useState(true); // true = most recent first
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [showJson, setShowJson] = useState(false); // NEW: toggle for JSON.stringify
    const [cardSizes, setCardSizes] = useState<Record<string, { width: number; height: number }>>({});

    // TanStack Query mutations for cache invalidation
    const { invalidateCurrency } = useCurrencyEvolutionMutations();

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

    // Sort by editDate, items with no date are considered oldest (last) when descending, newest (first) when ascending
    const itemsToDisplay = showArchived ? clientArchivedItems : clientItems;
    const sortedItems = itemsToDisplay.slice().sort((a, b) => {
        const aHasDate = !!a.editDate;
        const bHasDate = !!b.editDate;
        if (!aHasDate && !bHasDate) return 0;
        if (!aHasDate) return sortDesc ? 1 : -1;
        if (!bHasDate) return sortDesc ? -1 : 1;
        const aDate = new Date(a.editDate).getTime();
        const bDate = new Date(b.editDate).getTime();
        return sortDesc ? bDate - aDate : aDate - bDate;
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
            />
            <div className="flex justify-end mb-2 gap-2 items-center">
                <button
                    className="px-3 py-1 rounded bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm transition-colors"
                    onClick={() => setShowArchived(v => !v)}
                >
                    {showArchived ? `Active Items (${clientItems.length})` : `Archived Items (${clientArchivedItems.length})`}
                </button>
                <button
                    className="px-3 py-1 rounded bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm transition-colors"
                    onClick={() => setSortDesc((v) => !v)}
                >
                    Sort by edit date: {sortDesc ? "Newest first" : "Oldest first"}
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
                <ThemeToggle />
            </div>
            {/* CSS Grid masonry layout */}
            <div className="dashboard-grid mt-4">
                <AddItemDialog onItemCreated={handleItemCreated} />
                {sortedItems.map((item, idx) => {
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
    const { showJson, cardSize, onUpdateSize, isExpanded, onClick, ...rest } = props;

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
            onClick={onClick}
        >
            {rest.archived && (
                <div className="absolute top-2 right-2 z-10 bg-muted text-muted-foreground text-xs px-2 py-1 rounded">
                    Archived
                </div>
            )}
            {rest.type === 'account' && <Account data={rest} showJson={showJson} />}
            {rest.type === 'currency' && <Currency data={rest} showJson={showJson} onUpdateSize={onUpdateSize} />}
            {rest.type === 'debt' && <Debt data={rest} showJson={showJson} />}
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
    }, [activeTab, breakdown.length, data.currency, isHydrated]); // Include isHydrated

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

function Debt({ data, showJson }: any) {
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

    const statusInfo = getPaymentStatusInfo();

    return (
        <div className="flex flex-col items-center justify-center text-center p-4 h-full">
            <div className="text-base mb-2">{data.description}</div>
            <div className="text-lg font-semibold mb-2">
                {data.theyPayMe ? (
                    <>
                        {data.withWho} owes you {formatMoney(data.amount)} {data.currency}.
                    </>
                ) : (
                    <>
                        You owe {formatMoney(data.amount)} {data.currency} to {data.withWho}.
                    </>
                )}
            </div>

            {/* Payment status indicator */}
            <div className={`text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.text}
            </div>

            {/* Payment details */}
            {data.paymentStatus && data.paymentStatus !== 'unpaid' && (
                <div className="text-xs text-muted-foreground mt-1">
                    {data.totalPaid !== undefined && (
                        <div>Paid: {formatMoney(data.totalPaid)} {data.currency}</div>
                    )}
                    {data.remainingAmount !== undefined && data.remainingAmount > 0 && (
                        <div>Remaining: {formatMoney(data.remainingAmount)} {data.currency}</div>
                    )}
                    {data.transactionCount !== undefined && data.transactionCount > 0 && (
                        <div>{data.transactionCount} payment{data.transactionCount > 1 ? 's' : ''}</div>
                    )}
                </div>
            )}

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
            {showJson && <pre className="text-xs max-h-24 overflow-auto w-full break-words whitespace-pre-wrap bg-muted rounded p-1 mt-2">{JSON.stringify(data, null, 2)}</pre>}
        </div>
    );
}
