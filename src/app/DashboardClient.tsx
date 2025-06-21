"use client";
import { useState } from "react";
import AddItemDialog from "./AddItemDialog";
import EditItemDialog from "./EditItemDialog";
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DashboardClientProps {
    items: any[];
}

export default function DashboardClient({ items }: DashboardClientProps) {
    const [clientItems, setClientItems] = useState<any[]>(items);
    const [sortDesc, setSortDesc] = useState(true); // true = most recent first
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
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
            <div className="flex justify-end mb-2">
                <button
                    className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
                    onClick={() => setSortDesc((v) => !v)}
                >
                    Sort by edit date: {sortDesc ? "Newest first" : "Oldest first"}
                </button>
            </div>
            {/* Change grid to flex-wrap so cards can have different widths */}
            <div className="mt-4 flex flex-wrap gap-4 items-start">
                <div style={{ minWidth: 250 }}><AddItemDialog onItemCreated={handleItemCreated} /></div>
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
                                style={{ display: 'flex', flexDirection: 'column' }}
                            >
                                <ItemCard {...item} />
                            </div>
                        );
                    }
                    return (
                        <div key={item._id?.toString() ?? Math.random() + idx} className="min-w-[250px]">
                            <Card>
                                <pre>{JSON.stringify(item, null, 2)}</pre>
                            </Card>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ItemCard(data: any) {
    // Remove overflow-hidden so child content can overflow if needed
    return (
        <Card
            className="relative group"
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
            {data.type === 'account' && <Account {...data} />}
            {data.type === 'currency' && <Currency {...data} />}
            {data.type === 'debt' && <Debt {...data} />}
            {data.type === 'service' && <Service {...data} />}
            {!['account', 'currency', 'debt', 'service'].includes(data.type) && (
                <pre>{JSON.stringify(data, null, 2)}</pre>
            )}
        </Card>
    );
}

function Account(data: any) {
    return (
        <div className="flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-2 text-center">{data.name}</h2>
            <div className="text-2xl font-bold flex items-baseline gap-1 justify-center">
                {Number(data.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-base font-normal ml-1">{data.currency}</span>
            </div>
            <pre className="text-xs max-h-24 overflow-auto w-full break-words whitespace-pre-wrap bg-gray-50 rounded p-1 mt-2">{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
}

function Currency(data: any) {
    const COLORS = [
        '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1', '#a4de6c', '#d0ed57', '#fa8072', '#b0e0e6', '#f08080',
    ];
    const breakdown = data.accountBreakdown || [];
    const [showChart, setShowChart] = useState(true);
    // Helper to shorten names
    function shortenName(name: string, maxLen = 10) {
        if (!name) return '';
        return name.length > maxLen ? name.slice(0, maxLen - 1) + '…' : name;
    }
    // Custom label renderer for Pie slices
    const renderLabel = ({ name, percentage }: { name: string, percentage: number }) => {
        return `${shortenName(name)}: ${percentage.toFixed(1)}%`;
    };
    // Dynamic sizing: use fixed width for card and chart, but height is auto when chart is hidden
    const cardBase = 'flex flex-col items-center p-4 transition-all duration-300';
    const cardChart = 'w-[600px] h-[555px]'; // 2x wider, 1.5x taller
    const cardNoChart = 'w-[320px] h-auto'; // default size, auto height
    return (
        <div className={`${cardBase} ${showChart ? cardChart : cardNoChart}`}>
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
                {Number(data.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-base font-normal ml-1">{data.currency}</span>
            </div>
            {breakdown.length > 0 && showChart && (
                <div className="w-full flex flex-col items-center mt-2">
                    <ResponsiveContainer width={520} height={330}>
                        <PieChart>
                            <Pie
                                data={breakdown}
                                dataKey="percentage"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={130}
                                label={renderLabel}
                            >
                                {breakdown.map((entry: any, idx: number) => (
                                    <Cell key={`cell-${entry.id}`} fill={COLORS[idx % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => `${value.toFixed(2)}%`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}
            <pre className="text-xs max-h-24 overflow-auto w-full break-words whitespace-pre-wrap bg-gray-50 rounded p-1 mt-2">{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
}

function Debt({ description, withWho, amount, currency, theyPayMe, ...rest }: any) {
    let message = "";
    if (theyPayMe) {
        message = `${withWho} owes you ${amount} ${currency}.`;
    } else {
        message = `You owe ${amount} ${currency} to ${withWho}.`;
    }
    return (
        <div className="flex flex-col items-center">
            <div className="text-base mb-2 text-center">{description}</div>
            <div className="text-lg font-semibold text-center">{message}</div>
            <pre className="text-xs max-h-24 overflow-auto w-full break-words whitespace-pre-wrap bg-gray-50 rounded p-1 mt-2">{JSON.stringify({ description, withWho, amount, currency, theyPayMe, ...rest }, null, 2)}</pre>
        </div>
    );
}

function Service({ name, cost, currency, isManual, ...rest }: any) {
    return (
        <div className="flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-1 text-center">{name}</h2>
            <div className="text-base font-medium mb-2 text-center">
                {Number(cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
            </div>
            <div className="text-sm text-gray-600 mb-2 text-center">
                {isManual ? 'Manual payment' : 'Payment is automatic'}
            </div>
            <pre className="text-xs max-h-24 overflow-auto w-full break-words whitespace-pre-wrap bg-gray-50 rounded p-1 mt-2">{JSON.stringify({ name, cost, currency, isManual, ...rest }, null, 2)}</pre>
        </div>
    );
}
