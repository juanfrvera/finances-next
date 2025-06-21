"use client";
import { useState } from "react";
import AddItemDialog from "./AddItemDialog";
import EditItemDialog from "./EditItemDialog";
import { Card } from "@/components/ui/card";
import PieChartDisplay from "./PieChartDisplay";

const CARD_SIZE_UNIT = 220; // px

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
            <EditItemDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                item={selectedItem}
                onItemUpdated={handleItemUpdated}
                onItemDeleted={handleItemDeleted}
            />
            <div className="flex justify-end mb-2 gap-2 items-center">
                <button
                    className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
                    onClick={() => setSortDesc((v) => !v)}
                >
                    Sort by edit date: {sortDesc ? "Newest first" : "Oldest first"}
                </button>
                <button
                    className="p-1 rounded hover:bg-gray-200 focus:outline-none"
                    aria-label={showJson ? 'Hide all JSON' : 'Show all JSON'}
                    onClick={() => setShowJson(v => !v)}
                >
                    {/* Dev mode icon: code brackets */}
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${showJson ? 'text-blue-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
                    </svg>
                </button>
            </div>
            {/* Change grid to flex-wrap so cards can have different widths */}
            <div className="mt-4 flex flex-wrap gap-4 items-start">
                <div
                    className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg"
                    style={{ width: CARD_SIZE_UNIT, height: CARD_SIZE_UNIT }}
                >
                    <AddItemDialog onItemCreated={handleItemCreated} />
                </div>
                {sortedItems.map((item, idx) => {
                    if (
                        item.type === "account" ||
                        item.type === "currency" ||
                        item.type === "debt" ||
                        item.type === "service"
                    ) {
                        return (
                            <div
                                key={item._id?.toString() ?? Math.random() + idx}
                                onClick={() => { setSelectedItem(item); setEditDialogOpen(true); }}
                                className="cursor-pointer"
                            >
                                <ItemCard {...item} showJson={showJson} />
                            </div>
                        );
                    }
                    return (
                        <div key={item._id?.toString() ?? Math.random() + idx}>
                            <Card className="p-4" style={{ width: CARD_SIZE_UNIT, height: CARD_SIZE_UNIT }}>
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
    const { showJson, ...rest } = props;
    return (
        <Card
            className="relative group" // p-0 because children will have padding
            style={{
                transition: 'background 0.2s',
            }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'radial-gradient(circle, white 40%, #e5e7eb 100%)';
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = '';
            }}
        >
            {rest.type === 'account' && <Account data={rest} showJson={showJson} />}
            {rest.type === 'currency' && <Currency data={rest} showJson={showJson} />}
            {rest.type === 'debt' && <Debt data={rest} showJson={showJson} />}
            {rest.type === 'service' && <Service data={rest} showJson={showJson} />}
            {!['account', 'currency', 'debt', 'service'].includes(rest.type) && (
                <div style={{ width: CARD_SIZE_UNIT, height: CARD_SIZE_UNIT, padding: '1rem' }}>
                    {showJson && <pre>{JSON.stringify(rest, null, 2)}</pre>}
                </div>
            )}
        </Card>
    );
}

function Account({ data, showJson }: any) {
    return (
        <div
            className="flex flex-col items-center justify-center text-center p-4"
            style={{ width: CARD_SIZE_UNIT, height: CARD_SIZE_UNIT }}
        >
            <h2 className="text-lg font-semibold mb-2">{data.name}</h2>
            <div className="text-2xl font-bold flex items-baseline gap-1 justify-center">
                {formatMoney(data.balance)}
                <span className="text-base font-normal ml-1">{data.currency}</span>
            </div>
            {showJson && <pre className="text-xs max-h-24 overflow-auto w-full break-words whitespace-pre-wrap bg-gray-50 rounded p-1 mt-2">{JSON.stringify(data, null, 2)}</pre>}
        </div>
    );
}

function Currency({ data, showJson }: any) {
    const COLORS = [
        '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1', '#a4de6c', '#d0ed57', '#fa8072', '#b0e0e6', '#f08080',
    ];
    const breakdown = data.accountBreakdown || [];
    const [showChart, setShowChart] = useState(true);

    const widthMultiplier = showChart ? 2 : 1;
    const heightMultiplier = showChart ? 2 : 1;

    // Helper to shorten names
    function shortenName(name: string, maxLen = 10) {
        if (!name) return '';
        return name.length > maxLen ? name.slice(0, maxLen - 1) + '…' : name;
    }
    // Custom label renderer for Pie slices
    const renderLabel = (name: string, percentage: number) => {
        return `${shortenName(name)}: ${percentage.toFixed(1)}%`;
    };

    return (
        <div
            className="flex flex-col items-center p-4 transition-all duration-300"
            style={{
                width: CARD_SIZE_UNIT * widthMultiplier,
                height: CARD_SIZE_UNIT * heightMultiplier,
            }}
        >
            <div className="flex items-center w-full justify-between mb-2">
                <h2 className="text-lg font-semibold text-center flex-1">{data.currency}</h2>
                <button
                    className="ml-2 p-1 rounded hover:bg-gray-100 focus:outline-none"
                    aria-label={showChart ? 'Hide chart' : 'Show chart'}
                    onClick={e => { e.stopPropagation(); setShowChart(v => !v); }}
                    tabIndex={0}
                >
                    {showChart ? (
                        // Eye icon (show)
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1.458 12C2.732 7.943 6.523 5 12 5c5.477 0 9.268 2.943 10.542 7-1.274 4.057-5.065 7-10.542 7-5.477 0-9.268-2.943-10.542-7z" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={2} /></svg>
                    ) : (
                        // Eye-off icon (hide)
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.477 0-9.268-2.943-10.542-7a10.056 10.056 0 012.908-4.568M6.634 6.634A9.956 9.956 0 0112 5c5.477 0 9.268 2.943 10.542 7a9.956 9.956 0 01-4.338 5.074M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                    )}
                </button>
            </div>
            <div className="text-2xl font-bold flex items-baseline gap-1 justify-center mb-2">
                {formatMoney(data.value)}
                <span className="text-base font-normal ml-1">{data.currency}</span>
            </div>
            {breakdown.length > 0 && showChart && (
                <div className="w-full flex-grow flex flex-col items-center mt-2">
                    <PieChartDisplay breakdown={breakdown} colors={COLORS} labelFormatter={renderLabel} />
                </div>
            )}
            {showJson && <pre className="text-xs max-h-24 overflow-auto w-full break-words whitespace-pre-wrap bg-gray-50 rounded p-1 mt-2">{JSON.stringify(data, null, 2)}</pre>}
        </div>
    );
}

function Debt({ data, showJson }: any) {
    return (
        <div
            className="flex flex-col items-center justify-center text-center p-4"
            style={{ width: CARD_SIZE_UNIT, height: CARD_SIZE_UNIT }}
        >
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
            {showJson && <pre className="text-xs max-h-24 overflow-auto w-full break-words whitespace-pre-wrap bg-gray-50 rounded p-1 mt-2">{JSON.stringify(data, null, 2)}</pre>}
        </div>
    );
}

function Service({ data, showJson }: any) {
    return (
        <div
            className="flex flex-col items-center justify-center text-center p-4"
            style={{ width: CARD_SIZE_UNIT, height: CARD_SIZE_UNIT }}
        >
            <h2 className="text-lg font-semibold mb-1">{data.name}</h2>
            <div className="text-base font-medium mb-2">
                {formatMoney(data.cost)} {data.currency}
            </div>
            <div className="text-sm text-gray-600 mb-2">
                {data.isManual ? 'Manual payment' : 'Payment is automatic'}
            </div>
            {showJson && <pre className="text-xs max-h-24 overflow-auto w-full break-words whitespace-pre-wrap bg-gray-50 rounded p-1 mt-2">{JSON.stringify(data, null, 2)}</pre>}
        </div>
    );
}
