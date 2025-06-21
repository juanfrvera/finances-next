import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    const isChanged =
        form.name !== (initial?.name || '') ||
        form.cost !== (initial?.cost?.toString() || '') ||
        form.currency !== (initial?.currency || '') ||
        form.isManual !== (initial?.isManual || false);
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
            <div className="grid w-full gap-3">
                <Label htmlFor="service-name">Service Name</Label>
                <Input id="service-name" name="name" placeholder="Service Name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid w-full gap-3">
                <Label htmlFor="service-cost">Cost</Label>
                <Input id="service-cost" name="cost" placeholder="Cost" type="number" required value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
            </div>
            <div className="grid w-full gap-3">
                <Label htmlFor="service-currency">Currency</Label>
                <Input id="service-currency" name="currency" placeholder="Currency" required value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
                <input type="checkbox" id="service-isManual" name="isManual" checked={form.isManual} onChange={e => setForm(f => ({ ...f, isManual: e.target.checked }))} />
                <Label htmlFor="service-isManual" className="mb-0">Manual payment</Label>
            </div>
            <div className="flex gap-2 mt-2">
                {(isChanged || !initial) && (
                    <button type="submit" className="bg-primary text-white rounded p-2 hover:bg-primary/90 cursor-pointer disabled:opacity-50 flex-1 flex items-center justify-center gap-2" disabled={!isValid || loading || deleting}>
                        {loading && <Spinner />} {loading ? "Saving..." : submitLabel}
                    </button>
                )}
                {(isChanged || !initial) && onCancel && (
                    <button type="button" className="bg-gray-200 rounded p-2 flex-1" onClick={onCancel}>Cancel</button>
                )}
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
    const [accountForm, setAccountForm] = useState({
        name: initial?.name || '',
        balance: initial?.balance?.toString() || '',
        currency: initial?.currency || '',
    });
    const isValid = accountForm.name && accountForm.balance && accountForm.currency;
    const isChanged =
        accountForm.name !== (initial?.name || '') ||
        accountForm.balance !== (initial?.balance?.toString() || '') ||
        accountForm.currency !== (initial?.currency || '');
    useEffect(() => {
        if (initial) {
            setAccountForm({
                name: initial.name || '',
                balance: initial.balance?.toString() || '',
                currency: initial.currency || '',
            });
        }
    }, [initial]);
    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        onSubmit({
            name: accountForm.name,
            balance: Number(accountForm.balance),
            currency: accountForm.currency,
        });
    }
    return (
        <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
            <div className="grid w-full gap-3">
                <Label htmlFor="account-name">Account Name</Label>
                <Input id="account-name" name="name" placeholder="Account Name" required value={accountForm.name} onChange={e => setAccountForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid w-full gap-3">
                <Label htmlFor="account-balance">Balance</Label>
                <Input id="account-balance" name="balance" placeholder="Balance" type="number" required value={accountForm.balance} onChange={e => setAccountForm(f => ({ ...f, balance: e.target.value }))} />
            </div>
            <div className="grid w-full gap-3">
                <Label htmlFor="account-currency">Currency</Label>
                <Input id="account-currency" name="currency" placeholder="Currency" required value={accountForm.currency} onChange={e => setAccountForm(f => ({ ...f, currency: e.target.value }))} />
            </div>
            <div className="flex gap-2 mt-2">
                {(isChanged || !initial) && (
                    <button type="submit" className="bg-primary text-white rounded p-2 hover:bg-primary/90 cursor-pointer disabled:opacity-50 flex-1 flex items-center justify-center gap-2" disabled={!isValid || loading || deleting}>
                        {loading && <Spinner />} {loading ? "Saving..." : submitLabel}
                    </button>
                )}
                {(isChanged || !initial) && onCancel && (
                    <button type="button" className="bg-gray-200 rounded p-2 flex-1" onClick={onCancel}>Cancel</button>
                )}
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
    const [debtFormState, setDebtFormState] = useState({
        description: initial?.description || '',
        withWho: initial?.withWho || '',
        amount: initial?.amount?.toString() || '',
        currency: initial?.currency || '',
        theyPayMe: initial?.theyPayMe || false,
    });
    const isValid = debtFormState.description && debtFormState.withWho && debtFormState.amount && debtFormState.currency;
    const isChanged =
        debtFormState.description !== (initial?.description || '') ||
        debtFormState.withWho !== (initial?.withWho || '') ||
        debtFormState.amount !== (initial?.amount?.toString() || '') ||
        debtFormState.currency !== (initial?.currency || '') ||
        debtFormState.theyPayMe !== (initial?.theyPayMe || false);
    useEffect(() => {
        if (initial) {
            setDebtFormState({
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
            description: debtFormState.description,
            withWho: debtFormState.withWho,
            amount: Number(debtFormState.amount),
            currency: debtFormState.currency,
            theyPayMe: debtFormState.theyPayMe,
        });
    }
    return (
        <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
            <div className="grid w-full gap-3">
                <Label htmlFor="debt-description">Description</Label>
                <Input id="debt-description" name="description" placeholder="Description" required value={debtFormState.description} onChange={e => setDebtFormState(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid w-full gap-3">
                <Label htmlFor="debt-withWho">With Who</Label>
                <Input id="debt-withWho" name="withWho" placeholder="With Who" required value={debtFormState.withWho} onChange={e => setDebtFormState(f => ({ ...f, withWho: e.target.value }))} />
            </div>
            <div className="grid w-full gap-3">
                <Label htmlFor="debt-amount">Amount</Label>
                <Input id="debt-amount" name="amount" placeholder="Amount" type="number" required value={debtFormState.amount} onChange={e => setDebtFormState(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div className="grid w-full gap-3">
                <Label htmlFor="debt-currency">Currency</Label>
                <Input id="debt-currency" name="currency" placeholder="Currency" required value={debtFormState.currency} onChange={e => setDebtFormState(f => ({ ...f, currency: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
                <input type="checkbox" id="debt-theyPayMe" name="theyPayMe" checked={debtFormState.theyPayMe} onChange={e => setDebtFormState(f => ({ ...f, theyPayMe: e.target.checked }))} />
                <Label htmlFor="debt-theyPayMe" className="mb-0">They pay me</Label>
            </div>
            <div className="flex gap-2 mt-2">
                {(isChanged || !initial) && (
                    <button type="submit" className="bg-primary text-white rounded p-2 hover:bg-primary/90 cursor-pointer disabled:opacity-50 flex-1 flex items-center justify-center gap-2" disabled={!isValid || loading || deleting}>
                        {loading && <Spinner />} {loading ? "Saving..." : submitLabel}
                    </button>
                )}
                {(isChanged || !initial) && onCancel && (
                    <button type="button" className="bg-gray-200 rounded p-2 flex-1" onClick={onCancel}>Cancel</button>
                )}
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
    const [currencyValue, setCurrencyValue] = useState(initial?.currency || '');
    const isValid = !!currencyValue;
    const isChanged = currencyValue !== (initial?.currency || '');
    useEffect(() => {
        if (initial) setCurrencyValue(initial.currency || '');
    }, [initial]);
    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        onSubmit({ currency: currencyValue });
    }
    return (
        <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
            <div className="grid w-full gap-3">
                <Label htmlFor="currency-currency">Currency</Label>
                <Input id="currency-currency" name="currency" placeholder="Currency" required value={currencyValue} onChange={e => setCurrencyValue(e.target.value)} />
            </div>
            <div className="flex gap-2 mt-2">
                {(isChanged || !initial) && (
                    <button type="submit" className="bg-primary text-white rounded p-2 hover:bg-primary/90 cursor-pointer disabled:opacity-50 flex-1 flex items-center justify-center gap-2" disabled={!isValid || loading || deleting}>
                        {loading && <Spinner />} {loading ? "Saving..." : submitLabel}
                    </button>
                )}
                {(isChanged || !initial) && onCancel && (
                    <button type="button" className="bg-gray-200 rounded p-2 flex-1" onClick={onCancel}>Cancel</button>
                )}
                {showDelete && onDelete && <button type="button" className="bg-red-500 text-white rounded p-2 flex-1 flex items-center justify-center gap-2" onClick={onDelete} disabled={deleting || loading}>
                    {deleting && <Spinner />} {deleting ? "Deleting..." : "Delete"}
                </button>}
            </div>
        </form>
    );
}
