"use client";
import { useState } from "react";
import AddItemDialog from "./AddItemDialog";
import { Card } from "@/components/ui/card";

interface DashboardClientProps {
    items: any[];
}

export default function DashboardClient({ items }: DashboardClientProps) {
    const [clientItems, setClientItems] = useState<any[]>([]);
    const [sortDesc, setSortDesc] = useState(true); // true = most recent first
    function handleItemCreated(newItem: any) {
        setClientItems((prev) => [newItem, ...prev]);
    }
    const allItems = [...clientItems, ...items];

    // Sort by editDate, items with editDate first, then those without
    const sortedItems = allItems.slice().sort((a, b) => {
        const aHasDate = !!a.editDate;
        const bHasDate = !!b.editDate;
        if (aHasDate && !bHasDate) return -1;
        if (!aHasDate && bHasDate) return 1;
        if (!aHasDate && !bHasDate) return 0;
        const aDate = new Date(a.editDate).getTime();
        const bDate = new Date(b.editDate).getTime();
        return sortDesc ? bDate - aDate : aDate - bDate;
    });

    return (
        <div>
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
                            <div key={item._id?.toString() ?? Math.random() + idx}>
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
    if (data.type === 'account') {
        return <Account {...data} />;
    }
    if (data.type === 'currency') {
        return <Currency {...data} />;
    }
    if (data.type === 'debt') {
        return <Debt {...data} />;
    }
    if (data.type === 'service') {
        return <Service {...data} />;
    }
    return (
        <Card>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </Card>
    );
}

function Account(data: any) {
    return (
        <Card>
            <div className="flex flex-col items-center">
                <h2 className="text-lg font-semibold mb-2 text-center">{data.name}</h2>
                <div className="text-2xl font-bold flex items-baseline gap-1 justify-center">
                    {Number(data.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="text-base font-normal ml-1">{data.currency}</span>
                </div>
            </div>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </Card>
    );
}

function Currency(data: any) {
    return (
        <Card>
            <div className="flex flex-col items-center">
                <h2 className="text-lg font-semibold mb-2 text-center">{data.currency}</h2>
                <div className="text-2xl font-bold flex items-baseline gap-1 justify-center">
                    {Number(data.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="text-base font-normal ml-1">{data.currency}</span>
                </div>
            </div>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </Card>
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
        <Card>
            <div className="flex flex-col items-center">
                <div className="text-base mb-2 text-center">{description}</div>
                <div className="text-lg font-semibold text-center">{message}</div>
            </div>
            <pre>{JSON.stringify({ description, withWho, amount, currency, theyPayMe, ...rest }, null, 2)}</pre>
        </Card>
    );
}

function Service({ name, cost, currency, isManual, ...rest }: any) {
    return (
        <Card>
            <div className="flex flex-col items-center">
                <h2 className="text-lg font-semibold mb-1 text-center">{name}</h2>
                <div className="text-base font-medium mb-2 text-center">
                    {Number(cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                </div>
                <div className="text-sm text-gray-600 mb-2 text-center">
                    {isManual ? 'Manual payment' : 'Payment is automatic'}
                </div>
            </div>
            <pre>{JSON.stringify({ name, cost, currency, isManual, ...rest }, null, 2)}</pre>
        </Card>
    );
}
