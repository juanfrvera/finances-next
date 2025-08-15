"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Plus, ArrowLeft } from "lucide-react";
import { addItemToDb } from "@/app/actions";
import { ServiceForm, AccountForm, DebtForm, CurrencyForm, InvestmentForm } from "./ItemForms";
import { CARD_SIZE_UNIT } from "@/lib/constants";
import { showToast, toastMessages } from "@/lib/toast";

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
    notes?: string;
}

interface InvestmentItem {
    type: 'investment';
    name: string;
    tag?: string;
    initialValue: number;
    currency?: string;
    description?: string;
    expectedReturn?: number;
    expectedCashOutDate?: string;
    accountId?: string;
}

type ItemType = 'service' | 'account' | 'debt' | 'currency' | 'investment' | null;
type AnyItem = ServiceItem | AccountItem | DebtItem | CurrencyItem | InvestmentItem;

export default function AddItemDialog({ 
    onItemCreated, 
    availableCurrencies = [], 
    availablePersons = [],
    availableAccounts = []
}: { 
    onItemCreated: (item: AnyItem) => void, 
    availableCurrencies?: string[], 
    availablePersons?: string[],
    availableAccounts?: any[]
}) {
    const [open, setOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<ItemType>(null);

    // Reset selectedType when dialog closes
    useEffect(() => {
        if (!open) {
            setSelectedType(null);
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Card
                    className="flex flex-col items-center justify-center cursor-pointer transition-all border-2 border-dashed border-gray-300 hover:border-gray-400 hover:shadow-lg p-4"
                    style={{ width: CARD_SIZE_UNIT, height: CARD_SIZE_UNIT }}
                >
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
                    <DialogDescription>
                        Select the type of item to add, then fill out the form to create it.
                    </DialogDescription>
                </DialogHeader>
                {!selectedType ? (
                    <div className="grid grid-cols-2 gap-4">
                        <TypeBox label="Service" description="Create a service that is payed every month." onClick={() => setSelectedType('service')} />
                        <TypeBox label="Account" description="Track the balance of your accounts." onClick={() => setSelectedType('account')} />
                        <TypeBox label="Debt" description="Track what you owe or who owes you." onClick={() => setSelectedType('debt')} />
                        <TypeBox label="Currency" description="Keep track of all the account balances in certain currency." onClick={() => setSelectedType('currency')} />
                        <TypeBox label="Investment" description="Track investments and their value over time." onClick={() => setSelectedType('investment')} />
                    </div>
                ) : (
                    <div>
                        {selectedType === 'service' && <CreateServiceForm onClose={() => setOpen(false)} onItemCreated={onItemCreated} availableCurrencies={availableCurrencies} />}
                        {selectedType === 'account' && <CreateAccountForm onClose={() => setOpen(false)} onItemCreated={onItemCreated} availableCurrencies={availableCurrencies} />}
                        {selectedType === 'debt' && <CreateDebtForm onClose={() => setOpen(false)} onItemCreated={onItemCreated} availableCurrencies={availableCurrencies} availablePersons={availablePersons} />}
                        {selectedType === 'currency' && <CreateCurrencyForm onClose={() => setOpen(false)} onItemCreated={onItemCreated} availableCurrencies={availableCurrencies} />}
                        {selectedType === 'investment' && <CreateInvestmentForm onClose={() => setOpen(false)} onItemCreated={onItemCreated} availableCurrencies={availableCurrencies} availableAccounts={availableAccounts} />}
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

function CreateServiceForm({ onClose, onItemCreated, availableCurrencies = [] }: { onClose: () => void, onItemCreated: (item: AnyItem) => void, availableCurrencies?: string[] }) {
    const [loading, setLoading] = useState(false);
    async function handleSubmit(data: Omit<ServiceItem, 'type'>) {
        setLoading(true);
        const toastId = showToast.loading(toastMessages.creating);
        try {
            const item: ServiceItem = { type: 'service' as const, ...data };
            const created = await addItemToDb(item);
            if (created) {
                onItemCreated(created as AnyItem);
                showToast.update(toastId, toastMessages.created, 'success');
                onClose();
            } else {
                throw new Error('Failed to create item');
            }
        } catch (error) {
            console.error('Failed to create service:', error);
            showToast.update(toastId, toastMessages.createError, 'error');
        } finally {
            setLoading(false);
        }
    }
    return (
        <ServiceForm loading={loading} onSubmit={handleSubmit} onCancel={onClose} availableCurrencies={availableCurrencies} />
    );
}

function CreateAccountForm({ onClose, onItemCreated, availableCurrencies = [] }: { onClose: () => void, onItemCreated: (item: AnyItem) => void, availableCurrencies?: string[] }) {
    const [loading, setLoading] = useState(false);
    async function handleSubmit(data: Omit<AccountItem, 'type'>) {
        setLoading(true);
        const toastId = showToast.loading(toastMessages.creating);
        try {
            const item: AccountItem = { type: 'account' as const, ...data };
            const created = await addItemToDb(item);
            if (created) {
                onItemCreated(created as AnyItem);
                showToast.update(toastId, toastMessages.created, 'success');
                onClose();
            } else {
                throw new Error('Failed to create item');
            }
        } catch (error) {
            console.error('Failed to create account:', error);
            showToast.update(toastId, toastMessages.createError, 'error');
        } finally {
            setLoading(false);
        }
    }
    return (
        <AccountForm loading={loading} onSubmit={handleSubmit} onCancel={onClose} availableCurrencies={availableCurrencies} />
    );
}

function CreateDebtForm({ onClose, onItemCreated, availableCurrencies = [], availablePersons = [] }: { onClose: () => void, onItemCreated: (item: AnyItem) => void, availableCurrencies?: string[], availablePersons?: string[] }) {
    const [loading, setLoading] = useState(false);
    async function handleSubmit(data: Omit<DebtItem, 'type'>) {
        setLoading(true);
        const toastId = showToast.loading(toastMessages.creating);
        try {
            const item: DebtItem = { type: 'debt' as const, ...data };
            const created = await addItemToDb(item);
            if (created) {
                onItemCreated(created as AnyItem);
                showToast.update(toastId, toastMessages.created, 'success');
                onClose();
            } else {
                throw new Error('Failed to create item');
            }
        } catch (error) {
            console.error('Failed to create debt:', error);
            showToast.update(toastId, toastMessages.createError, 'error');
        } finally {
            setLoading(false);
        }
    }
    return (
        <DebtForm loading={loading} onSubmit={handleSubmit} onCancel={onClose} availableCurrencies={availableCurrencies} availablePersons={availablePersons} />
    );
}

function CreateCurrencyForm({ onClose, onItemCreated, availableCurrencies = [] }: { onClose: () => void, onItemCreated: (item: AnyItem) => void, availableCurrencies?: string[] }) {
    const [loading, setLoading] = useState(false);
    async function handleSubmit(data: Pick<CurrencyItem, 'currency'>) {
        setLoading(true);
        const toastId = showToast.loading(toastMessages.creating);
        try {
            const item: CurrencyItem = { type: 'currency' as const, ...data };
            const created = await addItemToDb(item);
            if (created) {
                onItemCreated(created as AnyItem);
                showToast.update(toastId, toastMessages.created, 'success');
                onClose();
            } else {
                throw new Error('Failed to create item');
            }
        } catch (error) {
            console.error('Failed to create currency:', error);
            showToast.update(toastId, toastMessages.createError, 'error');
        } finally {
            setLoading(false);
        }
    }
    return (
        <CurrencyForm loading={loading} onSubmit={handleSubmit} onCancel={onClose} availableCurrencies={availableCurrencies} />
    );
}

function CreateInvestmentForm({ onClose, onItemCreated, availableCurrencies = [], availableAccounts = [] }: { onClose: () => void, onItemCreated: (item: AnyItem) => void, availableCurrencies?: string[], availableAccounts?: any[] }) {
    const [loading, setLoading] = useState(false);
    async function handleSubmit(data: Omit<InvestmentItem, 'type'>) {
        setLoading(true);
        const toastId = showToast.loading(toastMessages.creating);
        try {
            const item: InvestmentItem = { type: 'investment' as const, ...data };
            const created = await addItemToDb(item);
            if (created) {
                onItemCreated(created as AnyItem);
                showToast.update(toastId, toastMessages.created, 'success');
                onClose();
            } else {
                throw new Error('Failed to create item');
            }
        } catch (error) {
            console.error('Failed to create investment:', error);
            showToast.update(toastId, toastMessages.createError, 'error');
        } finally {
            setLoading(false);
        }
    }
    return (
        <InvestmentForm loading={loading} onSubmit={handleSubmit} onCancel={onClose} availableCurrencies={availableCurrencies} availableAccounts={availableAccounts} />
    );
}
