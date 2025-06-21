"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ArrowLeft } from "lucide-react";
import { addItemToDb } from "./actions";

// Types for items
interface AccountItem {
    type: 'account';
    name: string;
    balance: number;
    currency: string;
}
interface CurrencyItem {
    type: 'currency';
    currency: string;
    value?: number;
}
interface DebtItem {
    type: 'debt';
    description: string;
    withWho: string;
    amount: number;
    currency: string;
    theyPayMe: boolean;
}
interface ServiceItem {
    type: 'service';
    name: string;
    cost: number;
    currency: string;
    isManual: boolean;
}
type ItemType = 'service' | 'account' | 'debt' | 'currency' | null;

export default function AddItemDialog({ onItemCreated }: { onItemCreated: (item: any) => void }) {
    const [open, setOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<ItemType>(null);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Card className="flex flex-col items-center justify-center cursor-pointer hover:shadow-lg transition-shadow p-4 h-full min-h-[120px]">
                    <span className="text-lg font-semibold mb-2">Add new</span>
                    <Plus size={40} className="text-primary" />
                </Card>
            </DialogTrigger>
            <DialogContent showCloseButton={false}>
                <DialogHeader>
                    <div className="flex items-center gap-2 min-h-[2.5rem] w-full">
                        {selectedType && (
                            <button
                                className="cursor-pointer p-1 rounded hover:bg-gray-100 flex items-center justify-center"
                                onClick={() => setSelectedType(null)}
                                aria-label="Back"
                                type="button"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}
                        <DialogTitle className="flex-1 text-left flex items-center">Add New Item</DialogTitle>
                        {/* Close button, always present and vertically centered */}
                        <button
                            type="button"
                            aria-label="Close"
                            onClick={() => setOpen(false)}
                            className="ml-2 p-1 rounded hover:bg-gray-100 flex items-center justify-center cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M10 8.586l4.95-4.95a1 1 0 111.414 1.415L11.414 10l4.95 4.95a1 1 0 01-1.414 1.415L10 11.414l-4.95 4.95a1 1 0 01-1.415-1.415l4.95-4.95-4.95-4.95A1 1 0 015.05 3.636l4.95 4.95z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </DialogHeader>
                {!selectedType ? (
                    <div className="grid grid-cols-2 gap-4">
                        <TypeBox label="Service" description="Create a service that is payed every month." onClick={() => setSelectedType('service')} />
                        <TypeBox label="Account" description="Track the balance of your accounts." onClick={() => setSelectedType('account')} />
                        <TypeBox label="Debt" description="Track what you owe or who owes you." onClick={() => setSelectedType('debt')} />
                        <TypeBox label="Currency" description="Keep track of all the account balances in certain currency." onClick={() => setSelectedType('currency')} />
                    </div>
                ) : (
                    <div>
                        {selectedType === 'service' && <CreateServiceForm onClose={() => setOpen(false)} onItemCreated={onItemCreated} />}
                        {selectedType === 'account' && <CreateAccountForm onClose={() => setOpen(false)} onItemCreated={onItemCreated} />}
                        {selectedType === 'debt' && <CreateDebtForm onClose={() => setOpen(false)} onItemCreated={onItemCreated} />}
                        {selectedType === 'currency' && <CreateCurrencyForm onClose={() => setOpen(false)} onItemCreated={onItemCreated} />}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function TypeBox({ label, description, onClick }: { label: string; description: string; onClick: () => void }) {
    return (
        <Card className="cursor-pointer hover:shadow-lg transition-shadow p-4 flex flex-col items-center" onClick={onClick}>
            <span className="text-lg font-semibold mb-2">{label}</span>
            <span className="text-sm text-gray-600 text-center">{description}</span>
        </Card>
    );
}

function Spinner() {
    return (
        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
    );
}

function CreateServiceForm({ onClose, onItemCreated }: { onClose: () => void, onItemCreated: (item: any) => void }) {
    const [form, setForm] = useState({ name: '', cost: '', currency: '', isManual: false });
    const [loading, setLoading] = useState(false);
    const isValid = form.name && form.cost && form.currency;
    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const item = {
            type: 'service',
            name: form.name,
            cost: Number(form.cost),
            currency: form.currency,
            isManual: form.isManual,
        };
        const created = await addItemToDb(item);
        onItemCreated(created);
        setLoading(false);
        onClose();
    }
    return (
        <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
            <input className="border p-2 rounded" name="name" placeholder="Service Name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input className="border p-2 rounded" name="cost" placeholder="Cost" type="number" required value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
            <input className="border p-2 rounded" name="currency" placeholder="Currency" required value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} />
            <label className="flex items-center gap-2">
                <input type="checkbox" name="isManual" checked={form.isManual} onChange={e => setForm(f => ({ ...f, isManual: e.target.checked }))} /> Manual payment
            </label>
            <button type="submit" className="mt-2 bg-primary text-white rounded p-2 hover:bg-primary/90 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2" disabled={!isValid || loading}>
                {loading && <Spinner />}
                {loading ? "Creating..." : "Create Service"}
            </button>
        </form>
    );
}

function CreateAccountForm({ onClose, onItemCreated }: { onClose: () => void, onItemCreated: (item: any) => void }) {
    const [form, setForm] = useState({ name: '', balance: '', currency: '' });
    const [loading, setLoading] = useState(false);
    const isValid = form.name && form.balance && form.currency;
    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const item = {
            type: 'account',
            name: form.name,
            balance: Number(form.balance),
            currency: form.currency,
        };
        const created = await addItemToDb(item);
        onItemCreated(created);
        setLoading(false);
        onClose();
    }
    return (
        <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
            <input className="border p-2 rounded" name="name" placeholder="Account Name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input className="border p-2 rounded" name="balance" placeholder="Balance" type="number" required value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} />
            <input className="border p-2 rounded" name="currency" placeholder="Currency" required value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} />
            <button type="submit" className="mt-2 bg-primary text-white rounded p-2 hover:bg-primary/90 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2" disabled={!isValid || loading}>
                {loading && <Spinner />}
                {loading ? "Creating..." : "Create Account"}
            </button>
        </form>
    );
}

function CreateDebtForm({ onClose, onItemCreated }: { onClose: () => void, onItemCreated: (item: any) => void }) {
    const [form, setForm] = useState({ description: '', withWho: '', amount: '', currency: '', theyPayMe: false });
    const [loading, setLoading] = useState(false);
    const isValid = form.description && form.withWho && form.amount && form.currency;
    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const item = {
            type: 'debt',
            description: form.description,
            withWho: form.withWho,
            amount: Number(form.amount),
            currency: form.currency,
            theyPayMe: form.theyPayMe,
        };
        const created = await addItemToDb(item);
        onItemCreated(created);
        setLoading(false);
        onClose();
    }
    return (
        <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
            <input className="border p-2 rounded" name="description" placeholder="Description" required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <input className="border p-2 rounded" name="withWho" placeholder="With Who" required value={form.withWho} onChange={e => setForm(f => ({ ...f, withWho: e.target.value }))} />
            <input className="border p-2 rounded" name="amount" placeholder="Amount" type="number" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            <input className="border p-2 rounded" name="currency" placeholder="Currency" required value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} />
            <label className="flex items-center gap-2">
                <input type="checkbox" name="theyPayMe" checked={form.theyPayMe} onChange={e => setForm(f => ({ ...f, theyPayMe: e.target.checked }))} /> They pay me
            </label>
            <button type="submit" className="mt-2 bg-primary text-white rounded p-2 hover:bg-primary/90 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2" disabled={!isValid || loading}>
                {loading && <Spinner />}
                {loading ? "Creating..." : "Create Debt"}
            </button>
        </form>
    );
}

function CreateCurrencyForm({ onClose, onItemCreated }: { onClose: () => void, onItemCreated: (item: any) => void }) {
    const [currency, setCurrency] = useState('');
    const [loading, setLoading] = useState(false);
    const isValid = !!currency;
    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const item = {
            type: 'currency',
            currency,
        };
        const created = await addItemToDb(item);
        onItemCreated(created);
        setLoading(false);
        onClose();
    }
    return (
        <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
            <input className="border p-2 rounded" name="currency" placeholder="Currency" required value={currency} onChange={e => setCurrency(e.target.value)} />
            <button type="submit" className="mt-2 bg-primary text-white rounded p-2 hover:bg-primary/90 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2" disabled={!isValid || loading}>
                {loading && <Spinner />}
                {loading ? "Creating..." : "Create Currency"}
            </button>
        </form>
    );
}
