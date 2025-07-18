import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchDropdown } from "@/components/ui/search-dropdown";

function Spinner() {
    return (
        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
    );
}

function DatePicker({ date, onDateChange }: { date?: Date; onDateChange: (date: Date | undefined) => void }) {
    const [isOpen, setIsOpen] = useState(false);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleDateSelect = (selectedDate: Date | undefined) => {
        onDateChange(selectedDate);
        setIsOpen(false);
    };

    const handleOpenChange = (open: boolean) => {
        if (!open && !date) {
            // If closing without a date selected, default to today
            onDateChange(new Date());
        }
        setIsOpen(open);
    };

    const setToday = () => {
        onDateChange(new Date());
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? formatDate(date) : "Pick a date"}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleDateSelect}
                        initialFocus
                    />
                    <div className="mt-3 flex justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={setToday}
                        >
                            Today
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export function ServiceForm({ initial, loading, deleting, onSubmit, onCancel, submitLabel = "Create Service", showDelete, onDelete, availableCurrencies = [] }: {
    initial?: { name: string; cost: string | number; currency: string; isManual: boolean; notes?: string };
    loading: boolean;
    deleting?: boolean;
    onSubmit: (data: { name: string; cost: number; currency: string; isManual: boolean; notes?: string }) => void;
    onCancel?: () => void;
    submitLabel?: string;
    showDelete?: boolean;
    onDelete?: () => void;
    availableCurrencies?: string[];
}) {
    const [form, setForm] = useState({
        name: initial?.name || '',
        cost: initial?.cost?.toString() || '',
        currency: initial?.currency || '',
        isManual: initial?.isManual || false,
        notes: initial?.notes || '',
    });
    
    const isValid = form.name && form.cost && form.currency;
    const isChanged =
        form.name !== (initial?.name || '') ||
        form.cost !== (initial?.cost?.toString() || '') ||
        form.currency !== (initial?.currency || '') ||
        form.isManual !== (initial?.isManual || false) ||
        form.notes !== (initial?.notes || '');
    useEffect(() => {
        if (initial) {
            setForm({
                name: initial.name || '',
                cost: initial.cost?.toString() || '',
                currency: initial.currency || '',
                isManual: initial.isManual || false,
                notes: initial.notes || '',
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
            notes: form.notes,
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
            <SearchDropdown
                id="service-currency"
                label="Currency"
                placeholder="Currency"
                value={form.currency}
                onChange={(value) => setForm(f => ({ ...f, currency: value }))}
                options={availableCurrencies}
                required
                createNewLabel="Create currency"
                onCreateNew={(value) => setForm(f => ({ ...f, currency: value }))}
            />
            <div className="flex items-center gap-2">
                <input type="checkbox" id="service-isManual" name="isManual" checked={form.isManual} onChange={e => setForm(f => ({ ...f, isManual: e.target.checked }))} />
                <Label htmlFor="service-isManual" className="mb-0">Manual payment</Label>
            </div>
            <div className="grid w-full gap-3">
                <Label htmlFor="service-notes">Notes</Label>
                <Textarea 
                    id="service-notes" 
                    name="notes" 
                    placeholder="Additional notes about this service..." 
                    value={form.notes} 
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={3}
                />
            </div>
            <div className="flex gap-2 mt-2">
                {(isChanged || !initial) && (
                    <Button type="submit" className="flex-1" disabled={!isValid || loading || deleting}>
                        {loading && <Spinner />} {loading ? "Saving..." : submitLabel}
                    </Button>
                )}
                {(isChanged || !initial) && onCancel && (
                    <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
                )}
                {showDelete && onDelete && (
                    <Button type="button" variant="destructive" className="flex-1" onClick={onDelete} disabled={deleting || loading}>
                        {deleting && <Spinner />} {deleting ? "Deleting..." : "Delete"}
                    </Button>
                )}
            </div>
        </form>
    );
}

export function AccountForm({ initial, loading, deleting, onSubmit, onCancel, submitLabel = "Create Account", showDelete, onDelete, availableCurrencies = [] }: {
    initial?: { name: string; balance: string | number; currency: string };
    loading: boolean;
    deleting?: boolean;
    onSubmit: (data: { name: string; balance: number; currency: string }) => void;
    onCancel?: () => void;
    submitLabel?: string;
    showDelete?: boolean;
    onDelete?: () => void;
    availableCurrencies?: string[];
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
            <SearchDropdown
                id="account-currency"
                label="Currency"
                placeholder="Currency"
                value={accountForm.currency}
                onChange={(value) => setAccountForm(f => ({ ...f, currency: value }))}
                options={availableCurrencies}
                required
                createNewLabel="Create currency"
                onCreateNew={(value) => setAccountForm(f => ({ ...f, currency: value }))}
            />
            <div className="flex gap-2 mt-2">
                {(isChanged || !initial) && (
                    <Button type="submit" className="flex-1" disabled={!isValid || loading || deleting}>
                        {loading && <Spinner />} {loading ? "Saving..." : submitLabel}
                    </Button>
                )}
                {(isChanged || !initial) && onCancel && (
                    <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
                )}
                {showDelete && onDelete && (
                    <Button type="button" variant="destructive" className="flex-1" onClick={onDelete} disabled={deleting || loading}>
                        {deleting && <Spinner />} {deleting ? "Deleting..." : "Delete"}
                    </Button>
                )}
            </div>
        </form>
    );
}

export function DebtForm({ initial, loading, deleting, onSubmit, onCancel, submitLabel = "Create Debt", showDelete, onDelete, availableCurrencies = [], availablePersons = [] }: {
    initial?: { description: string; withWho: string; amount: string | number; currency: string; theyPayMe: boolean; details?: string };
    loading: boolean;
    deleting?: boolean;
    onSubmit: (data: { description: string; withWho: string; amount: number; currency: string; theyPayMe: boolean; details?: string }) => void;
    onCancel?: () => void;
    submitLabel?: string;
    showDelete?: boolean;
    onDelete?: () => void;
    availableCurrencies?: string[];
    availablePersons?: string[];
}) {
    const [debtFormState, setDebtFormState] = useState({
        description: initial?.description || '',
        withWho: initial?.withWho || '',
        amount: initial?.amount?.toString() || '',
        currency: initial?.currency || '',
        theyPayMe: initial?.theyPayMe || false,
        details: initial?.details || '',
    });
    
    const isValid = debtFormState.description && debtFormState.withWho && debtFormState.amount && debtFormState.currency;
    const isChanged =
        debtFormState.description !== (initial?.description || '') ||
        debtFormState.withWho !== (initial?.withWho || '') ||
        debtFormState.amount !== (initial?.amount?.toString() || '') ||
        debtFormState.currency !== (initial?.currency || '') ||
        debtFormState.theyPayMe !== (initial?.theyPayMe || false) ||
        debtFormState.details !== (initial?.details || '');
    useEffect(() => {
        if (initial) {
            setDebtFormState({
                description: initial.description || '',
                withWho: initial.withWho || '',
                amount: initial.amount?.toString() || '',
                currency: initial.currency || '',
                theyPayMe: initial.theyPayMe || false,
                details: initial.details || '',
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
            details: debtFormState.details,
        });
    }
    return (
        <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
            <div className="grid w-full gap-3">
                <Label htmlFor="debt-description">Description</Label>
                <Input id="debt-description" name="description" placeholder="Description" required value={debtFormState.description} onChange={e => setDebtFormState(f => ({ ...f, description: e.target.value }))} />
            </div>
            <SearchDropdown
                id="debt-withWho"
                label="With Who"
                placeholder="Person's name"
                value={debtFormState.withWho}
                onChange={(value) => setDebtFormState(f => ({ ...f, withWho: value }))}
                options={availablePersons}
                required
                createNewLabel="Add person"
                onCreateNew={(value) => setDebtFormState(f => ({ ...f, withWho: value }))}
            />
            <div className="grid w-full gap-3">
                <Label htmlFor="debt-amount">Amount</Label>
                <Input id="debt-amount" name="amount" placeholder="Amount" type="number" required value={debtFormState.amount} onChange={e => setDebtFormState(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <SearchDropdown
                id="debt-currency"
                label="Currency"
                placeholder="Currency"
                value={debtFormState.currency}
                onChange={(value) => setDebtFormState(f => ({ ...f, currency: value }))}
                options={availableCurrencies}
                required
                createNewLabel="Create currency"
                onCreateNew={(value) => setDebtFormState(f => ({ ...f, currency: value }))}
            />
            <div className="grid w-full gap-3">
                <Label htmlFor="debt-details">Additional Details</Label>
                <Textarea
                    id="debt-details"
                    name="details"
                    placeholder="Enter any additional details about this debt (optional)..."
                    value={debtFormState.details}
                    onChange={e => setDebtFormState(f => ({ ...f, details: e.target.value }))}
                    rows={3}
                />
            </div>
            <div className="flex items-center gap-2">
                <input type="checkbox" id="debt-theyPayMe" name="theyPayMe" checked={debtFormState.theyPayMe} onChange={e => setDebtFormState(f => ({ ...f, theyPayMe: e.target.checked }))} />
                <Label htmlFor="debt-theyPayMe" className="mb-0">They pay me</Label>
            </div>
            <div className="flex gap-2 mt-2">
                {(isChanged || !initial) && (
                    <Button type="submit" className="flex-1" disabled={!isValid || loading || deleting}>
                        {loading && <Spinner />} {loading ? "Saving..." : submitLabel}
                    </Button>
                )}
                {(isChanged || !initial) && onCancel && (
                    <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
                )}
                {showDelete && onDelete && (
                    <Button type="button" variant="destructive" className="flex-1" onClick={onDelete} disabled={deleting || loading}>
                        {deleting && <Spinner />} {deleting ? "Deleting..." : "Delete"}
                    </Button>
                )}
            </div>
        </form>
    );
}

export function CurrencyForm({ initial, loading, deleting, onSubmit, onCancel, submitLabel = "Create Currency", showDelete, onDelete, availableCurrencies = [] }: {
    initial?: {
        currency: string;
        value?: number;
        accountBreakdown?: { id: string; name: string; balance: number }[]
    };
    loading: boolean;
    deleting?: boolean;
    onSubmit: (data: { currency: string }) => void;
    onCancel?: () => void;
    submitLabel?: string;
    showDelete?: boolean;
    onDelete?: () => void;
    availableCurrencies?: string[];
}) {
    const [currencyValue, setCurrencyValue] = useState(initial?.currency || '');
    const accountBreakdown = initial?.accountBreakdown || [];
    
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
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <SearchDropdown
                id="currency-currency"
                label="Currency"
                placeholder="Currency"
                value={currencyValue}
                onChange={setCurrencyValue}
                options={availableCurrencies}
                required
                createNewLabel="Create currency"
                onCreateNew={setCurrencyValue}
            />

            {/* Account breakdown section */}
            {accountBreakdown.length > 0 && (
                <div className="grid w-full gap-3">
                    <Label>Account Breakdown</Label>
                    <div className="border rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
                        {accountBreakdown.map((account) => (
                            <div key={account.id} className="flex justify-between items-center text-sm py-1">
                                <span className="font-medium">{account.name}</span>
                                <span className="text-muted-foreground">
                                    {account.balance.toFixed(2)} {currencyValue}
                                </span>
                            </div>
                        ))}
                        <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between items-center text-sm font-semibold">
                                <span>Total</span>
                                <span>
                                    {accountBreakdown.reduce((sum, acc) => sum + acc.balance, 0).toFixed(2)} {currencyValue}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex gap-2 mt-2">
                {(isChanged || !initial) && (
                    <Button type="submit" className="flex-1" disabled={!isValid || loading || deleting}>
                        {loading && <Spinner />} {loading ? "Saving..." : submitLabel}
                    </Button>
                )}
                {(isChanged || !initial) && onCancel && (
                    <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
                )}
                {showDelete && onDelete && (
                    <Button type="button" variant="destructive" className="flex-1" onClick={onDelete} disabled={deleting || loading}>
                        {deleting && <Spinner />} {deleting ? "Deleting..." : "Delete"}
                    </Button>
                )}
            </div>
        </form>
    );
}

export function UpdateBalanceForm({ initial, loading, onSubmit, onCancel }: {
    initial?: { name: string; balance: number; currency: string };
    loading: boolean;
    onSubmit: (data: { newBalance: number; note?: string; date?: Date }) => void;
    onCancel?: () => void;
}) {
    const [form, setForm] = useState({
        newBalance: initial?.balance?.toString() || '',
        note: '',
    });
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const isValid = form.newBalance && !isNaN(Number(form.newBalance));
    const hasChanged = form.newBalance !== (initial?.balance?.toString() || '');

    useEffect(() => {
        if (initial) {
            setForm({
                newBalance: initial.balance?.toString() || '',
                note: '',
            });
        }
    }, [initial]);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!isValid) return;
        onSubmit({
            newBalance: Number(form.newBalance),
            note: form.note || undefined,
            date: selectedDate,
        });
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-2">
                <div>
                    <Label htmlFor="currentBalance">Current Balance</Label>
                    <Input
                        id="currentBalance"
                        type="text"
                        value={`${initial?.balance || 0} ${initial?.currency || ''}`}
                        readOnly
                        className="bg-muted text-muted-foreground"
                    />
                </div>
                <div>
                    <Label htmlFor="newBalance">New Balance</Label>
                    <Input
                        id="newBalance"
                        type="number"
                        step="0.01"
                        value={form.newBalance}
                        onChange={(e) => setForm(prev => ({ ...prev, newBalance: e.target.value }))}
                        placeholder="Enter new balance"
                        autoFocus
                        required
                    />
                </div>
                <div>
                    <Label htmlFor="note">Reason for change (optional)</Label>
                    <Input
                        id="note"
                        type="text"
                        value={form.note}
                        onChange={(e) => setForm(prev => ({ ...prev, note: e.target.value }))}
                        placeholder="e.g., Bank transfer, Cash deposit, Error correction"
                    />
                </div>
                <div>
                    <Label htmlFor="date">Date</Label>
                    <DatePicker
                        date={selectedDate}
                        onDateChange={(date) => setSelectedDate(date || new Date())}
                    />
                </div>
            </div>
            <div className="flex gap-2 mt-4">
                <Button
                    type="submit"
                    className="flex-1"
                    disabled={!isValid || !hasChanged || loading}
                >
                    {loading && <Spinner />} {loading ? "Updating..." : "Update Balance"}
                </Button>
                {onCancel && (
                    <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
            </div>
        </form>
    );
}

export function TransactionForm({ initial, loading, onSubmit, onCancel }: {
    initial?: { name: string; currency: string };
    loading: boolean;
    onSubmit: (data: { amount: number; note?: string; date?: Date }) => void;
    onCancel?: () => void;
}) {
    const [form, setForm] = useState({
        amount: '',
        note: '',
    });
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const isValid = form.amount && !isNaN(Number(form.amount)) && Number(form.amount) !== 0;

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!isValid) return;
        onSubmit({
            amount: Number(form.amount),
            note: form.note || undefined,
            date: selectedDate,
        });
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-2">
                <div>
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input
                        id="accountName"
                        type="text"
                        value={initial?.name || ''}
                        readOnly
                        className="bg-muted text-muted-foreground"
                    />
                </div>
                <div>
                    <Label htmlFor="amount">Amount ({initial?.currency || ''})</Label>
                    <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={form.amount}
                        onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="Enter amount (+ for deposit, - for withdrawal)"
                        autoFocus
                        required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        Use positive numbers for deposits, negative for withdrawals
                    </p>
                </div>
                <div>
                    <Label htmlFor="note">Description (optional)</Label>
                    <Input
                        id="note"
                        type="text"
                        value={form.note}
                        onChange={(e) => setForm(prev => ({ ...prev, note: e.target.value }))}
                        placeholder="e.g., Salary, Rent payment, Grocery shopping"
                    />
                </div>
                <div>
                    <Label htmlFor="date">Date</Label>
                    <DatePicker
                        date={selectedDate}
                        onDateChange={(date) => setSelectedDate(date || new Date())}
                    />
                </div>
            </div>
            <div className="flex gap-2 mt-4">
                <Button
                    type="submit"
                    className="flex-1"
                    disabled={!isValid || loading}
                >
                    {loading && <Spinner />} {loading ? "Adding..." : "Add Transaction"}
                </Button>
                {onCancel && (
                    <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
            </div>
        </form>
    );
}

export function DebtPaymentForm({ debtAmount, currency, loading, onSubmit, onCancel }: {
    debtAmount: number;
    currency: string;
    loading: boolean;
    onSubmit: (data: { amount: number; note: string }) => void;
    onCancel?: () => void;
}) {
    const [form, setForm] = useState({
        amount: '',
        note: '',
    });

    const isValid = form.amount && Number(form.amount) > 0;

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!isValid) return;

        onSubmit({
            amount: Number(form.amount),
            note: form.note || "Debt payment",
        });
    }

    function setFullAmount() {
        setForm(f => ({ ...f, amount: debtAmount.toString() }));
    }

    return (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="grid w-full gap-3">
                <Label htmlFor="payment-amount">Payment Amount ({currency})</Label>
                <div className="flex gap-2">
                    <Input
                        id="payment-amount"
                        name="amount"
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                        required
                        value={form.amount}
                        onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={setFullAmount}
                        className="whitespace-nowrap"
                    >
                        Full Amount
                    </Button>
                </div>
            </div>
            <div className="grid w-full gap-3">
                <Label htmlFor="payment-note">Note (optional)</Label>
                <Input
                    id="payment-note"
                    name="note"
                    placeholder="Payment description..."
                    value={form.note}
                    onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                />
            </div>
            <div className="flex gap-2 mt-2">
                <Button
                    type="submit"
                    className="flex-1"
                    disabled={!isValid || loading}
                >
                    {loading && <Spinner />} {loading ? "Recording..." : "Record Payment"}
                </Button>
                {onCancel && (
                    <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
            </div>
        </form>
    );
}
