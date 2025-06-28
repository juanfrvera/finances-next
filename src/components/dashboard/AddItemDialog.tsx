"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Plus, ArrowLeft } from "lucide-react";
import { addItemToDb } from "@/app/actions";
import { ServiceForm, AccountForm, DebtForm, CurrencyForm } from "./ItemForms";
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
}
type ItemType = 'service' | 'account' | 'debt' | 'currency' | null;

export default function AddItemDialog({ onItemCreated }: { onItemCreated: (item: any) => void }) {
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

function CreateServiceForm({ onClose, onItemCreated }: { onClose: () => void, onItemCreated: (item: any) => void }) {
    const [loading, setLoading] = useState(false);
    async function handleSubmit(data: { name: string; cost: number; currency: string; isManual: boolean }) {
        setLoading(true);
        const toastId = showToast.loading(toastMessages.creating);
        try {
            const item = { type: 'service', ...data };
            const created = await addItemToDb(item);
            onItemCreated(created);
            showToast.update(toastId, toastMessages.created, 'success');
            onClose();
        } catch (error) {
            showToast.update(toastId, toastMessages.createError, 'error');
        } finally {
            setLoading(false);
        }
    }
    return (
        <ServiceForm loading={loading} onSubmit={handleSubmit} onCancel={onClose} />
    );
}

function CreateAccountForm({ onClose, onItemCreated }: { onClose: () => void, onItemCreated: (item: any) => void }) {
    const [loading, setLoading] = useState(false);
    async function handleSubmit(data: { name: string; balance: number; currency: string }) {
        setLoading(true);
        const toastId = showToast.loading(toastMessages.creating);
        try {
            const item = { type: 'account', ...data };
            const created = await addItemToDb(item);
            onItemCreated(created);
            showToast.update(toastId, toastMessages.created, 'success');
            onClose();
        } catch (error) {
            showToast.update(toastId, toastMessages.createError, 'error');
        } finally {
            setLoading(false);
        }
    }
    return (
        <AccountForm loading={loading} onSubmit={handleSubmit} onCancel={onClose} />
    );
}

function CreateDebtForm({ onClose, onItemCreated }: { onClose: () => void, onItemCreated: (item: any) => void }) {
    const [loading, setLoading] = useState(false);
    async function handleSubmit(data: { description: string; withWho: string; amount: number; currency: string; theyPayMe: boolean }) {
        setLoading(true);
        const toastId = showToast.loading(toastMessages.creating);
        try {
            const item = { type: 'debt', ...data };
            const created = await addItemToDb(item);
            onItemCreated(created);
            showToast.update(toastId, toastMessages.created, 'success');
            onClose();
        } catch (error) {
            showToast.update(toastId, toastMessages.createError, 'error');
        } finally {
            setLoading(false);
        }
    }
    return (
        <DebtForm loading={loading} onSubmit={handleSubmit} onCancel={onClose} />
    );
}

function CreateCurrencyForm({ onClose, onItemCreated }: { onClose: () => void, onItemCreated: (item: any) => void }) {
    const [loading, setLoading] = useState(false);
    async function handleSubmit(data: { currency: string }) {
        setLoading(true);
        const toastId = showToast.loading(toastMessages.creating);
        try {
            const item = { type: 'currency', ...data };
            const created = await addItemToDb(item);
            onItemCreated(created);
            showToast.update(toastId, toastMessages.created, 'success');
            onClose();
        } catch (error) {
            showToast.update(toastId, toastMessages.createError, 'error');
        } finally {
            setLoading(false);
        }
    }
    return (
        <CurrencyForm loading={loading} onSubmit={handleSubmit} onCancel={onClose} />
    );
}
