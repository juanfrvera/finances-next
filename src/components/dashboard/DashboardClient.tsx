"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import AddItemDialog from "./AddItemDialog";
import ItemDialog from "./ItemDialog";
import { Card } from "@/components/ui/card";
import { PieChart as PieChartIcon } from "lucide-react";
import { CARD_SIZE_UNIT, GRID_GAP } from "@/lib/constants";
import { ThemeToggle } from "@/components/theme-toggle";

// Dynamically import PieChartDisplay with SSR disabled to prevent hydration mismatch
const PieChartDisplay = dynamic(() => import("./PieChartDisplay"), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-32">Loading chart...</div>
});

interface DashboardClientProps {
    items: any[];
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

export default function DashboardClient({ items }: DashboardClientProps) {
    const [clientItems, setClientItems] = useState<any[]>(items);
    const [sortDesc, setSortDesc] = useState(true); // true = most recent first
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [showJson, setShowJson] = useState(true); // NEW: toggle for JSON.stringify
    const [cardSizes, setCardSizes] = useState<Record<string, { width: number; height: number }>>({});

    function handleItemCreated(newItem: any) {
        setClientItems((prev) => [newItem, ...prev]);
    }
    function handleItemUpdated(updated: any) {
        setClientItems((prev) => prev.map(i => i._id === updated._id ? updated : i));
    }
    function handleItemDeleted(id: string) {
        setClientItems((prev) => prev.filter(i => i._id !== id));
        // Also remove from initial items if present
        // (If you want to support SSR fallback, you may want to filter from both)
    }

    function updateCardSize(itemId: string, size: { width: number; height: number }) {
        setCardSizes(prev => ({
            ...prev,
            [itemId]: size
        }));
    }

    // Sort by editDate, items with no date are considered oldest (last) when descending, newest (first) when ascending
    const sortedItems = clientItems.slice().sort((a, b) => {
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
            />
            <div className="flex justify-end mb-2 gap-2 items-center">
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
            className={`relative group p-0 cursor-pointer transition-all duration-200 hover:shadow-lg hover:bg-accent/50 hover:border-accent-foreground/20 hover:scale-[1.02] dark:hover:bg-accent/30 dark:hover:border-accent-foreground/30 ${isExpanded ? 'expanded-card' : ''}`} // p-0 because children will have padding
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
    const [showChart, setShowChart] = useState(true);

    // Update card size when chart visibility changes
    const updateSize = () => {
        const newShowChart = !showChart;
        setShowChart(newShowChart);

        if (breakdown.length > 0) {
            const size = newShowChart ? { width: 2, height: 2 } : { width: 1, height: 1 };
            onUpdateSize(size);
        }
    };

    // Set initial size on mount
    useEffect(() => {
        if (breakdown.length > 0 && showChart) {
            onUpdateSize({ width: 2, height: 2 });
        }
    }, []); // Only run on mount

    // Helper to shorten names
    function shortenName(name: string, maxLen = 10) {
        if (!name) return '';
        return name.length > maxLen ? name.slice(0, maxLen - 1) + '…' : name;
    }
    // Custom label renderer for Pie slices
    const renderLabel = (name: string, balance: number) => {
        return `${shortenName(name)}: ${balance.toFixed(2)}`;
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-4">
            <div className="flex items-center w-full justify-between mb-2">
                <h2 className="text-lg font-semibold text-center flex-1">{data.currency}</h2>
                <button
                    className={`ml-2 p-1 rounded hover:bg-accent focus:outline-none transition-colors cursor-pointer ${showChart ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-muted-foreground'
                        }`}
                    aria-label={showChart ? 'Hide chart' : 'Show chart'}
                    onClick={e => { e.stopPropagation(); updateSize(); }}
                    tabIndex={0}
                >
                    <PieChartIcon
                        size={20}
                        className={`transition-all hover:text-foreground ${showChart ? 'opacity-100 scale-110' : 'opacity-60'
                            }`}
                    />
                </button>
            </div>
            <div className="text-2xl font-bold flex items-baseline gap-1 justify-center mb-2">
                {formatMoney(data.value)}
                <span className="text-base font-normal ml-1">{data.currency}</span>
            </div>
            {breakdown.length > 0 && showChart && (
                <div className="w-full flex-grow flex flex-col items-center mt-2">
                    <PieChartDisplay
                        breakdown={breakdown}
                        colors={COLORS}
                        labelFormatter={renderLabel}
                        width={400}
                        height={280}
                        outerRadius={90}
                    />
                </div>
            )}
            {showJson && <pre className="text-xs max-h-24 overflow-auto w-full break-words whitespace-pre-wrap bg-muted rounded p-1 mt-2">{JSON.stringify(data, null, 2)}</pre>}
        </div>
    );
}

function Debt({ data, showJson }: any) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-4 h-full">
            <div className="text-base mb-2">{data.description}</div>
            <div className="text-lg font-semibold">
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
