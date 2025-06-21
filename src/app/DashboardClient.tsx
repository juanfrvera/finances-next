"use client";
import { useState } from "react";
import AddItemDialog from "./AddItemDialog";
import EditItemDialog from "./EditItemDialog";
import { Card } from "@/components/ui/card";

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
            <div className="mt-4 grid gap-4 grid-cols-[repeat(auto-fit,minmax(250px,1fr))] items-start">
                <AddItemDialog onItemCreated={handleItemCreated} />
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
                                <ItemCard {...item} />
                            </div>
                        );
                    }
                    return (
                        <div key={item._id?.toString() ?? Math.random() + idx}>
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
    // Apply the gradient effect directly to the Card's main container on hover
    return (
        <Card
            className="relative overflow-hidden group"
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
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
}

function Currency(data: any) {
    return (
        <div className="flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-2 text-center">{data.currency}</h2>
            <div className="text-2xl font-bold flex items-baseline gap-1 justify-center">
                {Number(data.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-base font-normal ml-1">{data.currency}</span>
            </div>
            <pre>{JSON.stringify(data, null, 2)}</pre>
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
            <pre>{JSON.stringify({ description, withWho, amount, currency, theyPayMe, ...rest }, null, 2)}</pre>
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
            <pre>{JSON.stringify({ name, cost, currency, isManual, ...rest }, null, 2)}</pre>
        </div>
    );
}
