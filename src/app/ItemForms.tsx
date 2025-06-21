import { useState, useEffect } from "react";

function Spinner() {
    return (
        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
    );
}

export function ServiceForm({ initial, loading, deleting, onSubmit, onCancel, submitLabel = "Create Service", showDelete, onDelete }: {
    initial?: { name: string; cost: string | number; currency: string; isManual: boolean };
    loading: boolean;
    deleting?: boolean;
    onSubmit: (data: { name: string; cost: number; currency: string; isManual: boolean }) => void;
    onCancel?: () => void;
    submitLabel?: string;
    showDelete?: boolean;
    onDelete?: () => void;
}) {
    const [form, setForm] = useState({
        name: initial?.name || '',
        cost: initial?.cost?.toString() || '',
        currency: initial?.currency || '',
        isManual: initial?.isManual || false,
    });
    const isValid = form.name && form.cost && form.currency;
    useEffect(() => {
        if (initial) {
            setForm({
                name: initial.name || '',
                cost: initial.cost?.toString() || '',
                currency: initial.currency || '',
                isManual: initial.isManual || false,
            });
        }
    }, [initial]);
    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        onSubmit({
            name: form.name,
            cost: Number(form.cost),
            currency: form.currency,
            isManual: form.isManual,
        });
    }
    return (
        <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
            <input className="border p-2 rounded" name="name" placeholder="Service Name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input className="border p-2 rounded" name="cost" placeholder="Cost" type="number" required value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
            <input className="border p-2 rounded" name="currency" placeholder="Currency" required value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} />
            <label className="flex items-center gap-2">
                <input type="checkbox" name="isManual" checked={form.isManual} onChange={e => setForm(f => ({ ...f, isManual: e.target.checked }))} /> Manual payment
            </label>
            <div className="flex gap-2 mt-2">
                <button type="submit" className="bg-primary text-white rounded p-2 hover:bg-primary/90 cursor-pointer disabled:opacity-50 flex-1 flex items-center justify-center gap-2" disabled={!isValid || loading || deleting}>
                    {loading && <Spinner />} {loading ? "Saving..." : submitLabel}
                </button>
                {onCancel && <button type="button" className="bg-gray-200 rounded p-2 flex-1" onClick={onCancel}>Cancel</button>}
                {showDelete && onDelete && <button type="button" className="bg-red-500 text-white rounded p-2 flex-1 flex items-center justify-center gap-2" onClick={onDelete} disabled={deleting || loading}>
                    {deleting && <Spinner />} {deleting ? "Deleting..." : "Delete"}
                </button>}
            </div>
        </form>
    );
}

export function AccountForm({ initial, loading, deleting, onSubmit, onCancel, submitLabel = "Create Account", showDelete, onDelete }: {
    initial?: { name: string; balance: string | number; currency: string };
    loading: boolean;
    deleting?: boolean;
    onSubmit: (data: { name: string; balance: number; currency: string }) => void;
    onCancel?: () => void;
    submitLabel?: string;
    showDelete?: boolean;
    onDelete?: () => void;
}) {
    const [form, setForm] = useState({
        name: initial?.name || '',
        balance: initial?.balance?.toString() || '',
        currency: initial?.currency || '',
    });
    const isValid = form.name && form.balance && form.currency;
    useEffect(() => {
        if (initial) {
            setForm({
                name: initial.name || '',
                balance: initial.balance?.toString() || '',
                currency: initial.currency || '',
            });
        }
    }, [initial]);
    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        onSubmit({
            name: form.name,
            balance: Number(form.balance),
            currency: form.currency,
        });
    }
    return (
        <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
            <input className="border p-2 rounded" name="name" placeholder="Account Name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input className="border p-2 rounded" name="balance" placeholder="Balance" type="number" required value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} />
            <input className="border p-2 rounded" name="currency" placeholder="Currency" required value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} />
            <div className="flex gap-2 mt-2">
                <button type="submit" className="bg-primary text-white rounded p-2 hover:bg-primary/90 cursor-pointer disabled:opacity-50 flex-1 flex items-center justify-center gap-2" disabled={!isValid || loading || deleting}>
                    {loading && <Spinner />} {loading ? "Saving..." : submitLabel}
                </button>
                {onCancel && <button type="button" className="bg-gray-200 rounded p-2 flex-1" onClick={onCancel}>Cancel</button>}
                {showDelete && onDelete && <button type="button" className="bg-red-500 text-white rounded p-2 flex-1 flex items-center justify-center gap-2" onClick={onDelete} disabled={deleting || loading}>
                    {deleting && <Spinner />} {deleting ? "Deleting..." : "Delete"}
                </button>}
            </div>
        </form>
    );
}

export function DebtForm({ initial, loading, deleting, onSubmit, onCancel, submitLabel = "Create Debt", showDelete, onDelete }: {
    initial?: { description: string; withWho: string; amount: string | number; currency: string; theyPayMe: boolean };
    loading: boolean;
    deleting?: boolean;
    onSubmit: (data: { description: string; withWho: string; amount: number; currency: string; theyPayMe: boolean }) => void;
    onCancel?: () => void;
    submitLabel?: string;
    showDelete?: boolean;
    onDelete?: () => void;
}) {
    const [form, setForm] = useState({
        description: initial?.description || '',
        withWho: initial?.withWho || '',
        amount: initial?.amount?.toString() || '',
        currency: initial?.currency || '',
        theyPayMe: initial?.theyPayMe || false,
    });
    const isValid = form.description && form.withWho && form.amount && form.currency;
    useEffect(() => {
        if (initial) {
            setForm({
                description: initial.description || '',
                withWho: initial.withWho || '',
                amount: initial.amount?.toString() || '',
                currency: initial.currency || '',
                theyPayMe: initial.theyPayMe || false,
            });
        }
    }, [initial]);
    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        onSubmit({
            description: form.description,
            withWho: form.withWho,
            amount: Number(form.amount),
            currency: form.currency,
            theyPayMe: form.theyPayMe,
        });
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
            <div className="flex gap-2 mt-2">
                <button type="submit" className="bg-primary text-white rounded p-2 hover:bg-primary/90 cursor-pointer disabled:opacity-50 flex-1 flex items-center justify-center gap-2" disabled={!isValid || loading || deleting}>
                    {loading && <Spinner />} {loading ? "Saving..." : submitLabel}
                </button>
                {onCancel && <button type="button" className="bg-gray-200 rounded p-2 flex-1" onClick={onCancel}>Cancel</button>}
                {showDelete && onDelete && <button type="button" className="bg-red-500 text-white rounded p-2 flex-1 flex items-center justify-center gap-2" onClick={onDelete} disabled={deleting || loading}>
                    {deleting && <Spinner />} {deleting ? "Deleting..." : "Delete"}
                </button>}
            </div>
        </form>
    );
}

export function CurrencyForm({ initial, loading, deleting, onSubmit, onCancel, submitLabel = "Create Currency", showDelete, onDelete }: {
    initial?: { currency: string };
    loading: boolean;
    deleting?: boolean;
    onSubmit: (data: { currency: string }) => void;
    onCancel?: () => void;
    submitLabel?: string;
    showDelete?: boolean;
    onDelete?: () => void;
}) {
    const [currency, setCurrency] = useState(initial?.currency || '');
    const isValid = !!currency;
    useEffect(() => {
        if (initial) setCurrency(initial.currency || '');
    }, [initial]);
    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        onSubmit({ currency });
    }
    return (
        <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
            <input className="border p-2 rounded" name="currency" placeholder="Currency" required value={currency} onChange={e => setCurrency(e.target.value)} />
            <div className="flex gap-2 mt-2">
                <button type="submit" className="bg-primary text-white rounded p-2 hover:bg-primary/90 cursor-pointer disabled:opacity-50 flex-1 flex items-center justify-center gap-2" disabled={!isValid || loading || deleting}>
                    {loading && <Spinner />} {loading ? "Saving..." : submitLabel}
                </button>
                {onCancel && <button type="button" className="bg-gray-200 rounded p-2 flex-1" onClick={onCancel}>Cancel</button>}
                {showDelete && onDelete && <button type="button" className="bg-red-500 text-white rounded p-2 flex-1 flex items-center justify-center gap-2" onClick={onDelete} disabled={deleting || loading}>
                    {deleting && <Spinner />} {deleting ? "Deleting..." : "Delete"}
                </button>}
            </div>
        </form>
    );
}
