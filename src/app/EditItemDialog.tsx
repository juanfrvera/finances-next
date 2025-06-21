"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ServiceForm, AccountForm, DebtForm, CurrencyForm } from "./ItemForms";
import { useState } from "react";
import { addItemToDb, updateItemToDb, deleteItemFromDb } from "./actions";

export default function EditItemDialog({ open, onOpenChange, item, onItemUpdated, onItemDeleted }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: any;
    onItemUpdated: (item: any) => void;
    onItemDeleted: (id: string) => void;
}) {
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    async function handleSave(data: any) {
        setLoading(true);
        try {
            const updated = await updateItemToDb({ ...item, ...data });
            onItemUpdated(updated);
        } finally {
            setLoading(false);
            onOpenChange(false);
        }
    }
    async function handleDelete() {
        setDeleting(true);
        try {
            await deleteItemFromDb(item._id);
            onItemDeleted(item._id);
        } finally {
            setDeleting(false);
            onOpenChange(false);
        }
    }
    function handleCancel() {
        onOpenChange(false);
    }
    if (!item) return null;
    let form: React.ReactNode = null;
    if (item.type === 'service') {
        form = <ServiceForm initial={item} loading={loading} deleting={deleting} onSubmit={handleSave} onCancel={handleCancel} submitLabel={loading ? "Saving..." : "Save"} showDelete onDelete={handleDelete} />;
    } else if (item.type === 'account') {
        form = <AccountForm initial={item} loading={loading} deleting={deleting} onSubmit={handleSave} onCancel={handleCancel} submitLabel={loading ? "Saving..." : "Save"} showDelete onDelete={handleDelete} />;
    } else if (item.type === 'debt') {
        form = <DebtForm initial={item} loading={loading} deleting={deleting} onSubmit={handleSave} onCancel={handleCancel} submitLabel={loading ? "Saving..." : "Save"} showDelete onDelete={handleDelete} />;
    } else if (item.type === 'currency') {
        form = <CurrencyForm initial={item} loading={loading} deleting={deleting} onSubmit={handleSave} onCancel={handleCancel} submitLabel={loading ? "Saving..." : "Save"} showDelete onDelete={handleDelete} />;
    }
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Item</DialogTitle>
                </DialogHeader>
                {form}
            </DialogContent>
        </Dialog>
    );
}
