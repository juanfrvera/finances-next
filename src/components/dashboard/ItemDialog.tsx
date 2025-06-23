"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ServiceForm, AccountForm, DebtForm, CurrencyForm, UpdateBalanceForm } from "./ItemForms";
import { useState, useEffect } from "react";
import { updateItemToDb, deleteItemFromDb, updateAccountBalance } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { MoreVertical, X, Trash2, ArrowLeft } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { showToast, toastMessages } from "@/lib/toast";

type AccountAction = 'updateBalance' | 'doTransaction' | 'editInfo' | null;

function ActionBox({ label, description, onClick }: { label: string, description: string, onClick: () => void }) {
    return (
        <div 
            className="p-4 border border-border rounded-lg cursor-pointer hover:bg-accent transition-colors"
            onClick={onClick}
        >
            <h3 className="font-medium text-foreground">{label}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
    );
}

export default function ItemDialog({ open, onOpenChange, item, onItemUpdated, onItemDeleted }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: any;
    onItemUpdated: (item: any) => void;
    onItemDeleted: (id: string) => void;
}) {
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selectedAction, setSelectedAction] = useState<AccountAction>(null);

    // Reset selectedAction when dialog opens
    useEffect(() => {
        if (open) {
            setSelectedAction(null);
        }
    }, [open]);

    async function handleSave(data: any) {
        setLoading(true);
        const toastId = showToast.loading(toastMessages.saving);
        try {
            const updated = await updateItemToDb({ ...item, ...data });
            onItemUpdated(updated);
            showToast.update(toastId, toastMessages.saved, 'success');
        } catch (error) {
            showToast.update(toastId, toastMessages.saveError, 'error');
        } finally {
            setLoading(false);
            onOpenChange(false);
        }
    }

    async function handleUpdateBalance(data: { newBalance: number; motive?: string }) {
        setLoading(true);
        const toastId = showToast.loading('Updating balance...');
        try {
            const updated = await updateAccountBalance(item._id, data.newBalance, data.motive);
            onItemUpdated(updated);
            showToast.update(toastId, 'Balance updated successfully!', 'success');
        } catch (error) {
            showToast.update(toastId, 'Failed to update balance', 'error');
        } finally {
            setLoading(false);
            onOpenChange(false);
        }
    }

    async function handleDelete() {
        setDeleting(true);
        const toastId = showToast.loading(toastMessages.deleting);
        try {
            await deleteItemFromDb(item._id);
            onItemDeleted(item._id);
            showToast.update(toastId, toastMessages.deleted, 'success');
        } catch (error) {
            showToast.update(toastId, toastMessages.deleteError, 'error');
        } finally {
            setDeleting(false);
            onOpenChange(false);
        }
    }
    function handleCancel() {
        onOpenChange(false);
    }
    function resetToSelection() {
        setSelectedAction(null);
    }
    if (!item) return null;

    // For account items, show action selection first
    if (item.type === 'account' && !selectedAction) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-h-[90vh] overflow-y-auto" showCloseButton={false}>
                    {/* Action buttons positioned absolutely */}
                    <div className="absolute top-4 right-4 flex items-center gap-1 z-10">
                        {/* More actions dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={deleting}
                                >
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">More options</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onSelect={handleDelete}
                                    disabled={deleting}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                                    <span>{deleting ? "Deleting..." : "Delete item"}</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        
                        {/* Close button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onOpenChange(false)}
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </Button>
                    </div>

                    <DialogHeader className="pr-20">
                        <DialogTitle>Account Actions</DialogTitle>
                        <DialogDescription>
                            Choose what you want to do with this account.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-1 gap-4">
                        <ActionBox 
                            label="Update balance" 
                            description="Update the current balance of the account." 
                            onClick={() => setSelectedAction('updateBalance')} 
                        />
                        <ActionBox 
                            label="Do transaction" 
                            description="Record a new transaction for this account." 
                            onClick={() => setSelectedAction('doTransaction')} 
                        />
                        <ActionBox 
                            label="Edit information" 
                            description="Edit the account name and other details." 
                            onClick={() => setSelectedAction('editInfo')} 
                        />
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // Determine dialog content based on item type and selected action
    let form: React.ReactNode = null;
    let dialogTitle = "Edit Item";
    let dialogDescription = "Edit the details of your item and save changes.";
    let showBackButton = false;

    if (item.type === 'account' && selectedAction) {
        showBackButton = true;
        switch (selectedAction) {
            case 'updateBalance':
                dialogTitle = "Update Balance";
                dialogDescription = "Update the current balance of the account.";
                form = <UpdateBalanceForm initial={item} loading={loading} onSubmit={handleUpdateBalance} onCancel={handleCancel} />;
                break;
            case 'doTransaction':
                dialogTitle = "New Transaction";
                dialogDescription = "Record a new transaction for this account.";
                // TODO: Create TransactionForm
                form = <div className="p-4 text-center text-gray-500">Transaction Form - Coming Soon</div>;
                break;
            case 'editInfo':
                dialogTitle = "Edit Account";
                dialogDescription = "Edit the account details.";
                form = <AccountForm initial={item} loading={loading} deleting={deleting} onSubmit={handleSave} onCancel={handleCancel} submitLabel={loading ? "Saving..." : "Save"} />;
                break;
        }
    } else {
        // Handle other item types with direct edit
        if (item.type === 'service') {
            form = <ServiceForm initial={item} loading={loading} deleting={deleting} onSubmit={handleSave} onCancel={handleCancel} submitLabel={loading ? "Saving..." : "Save"} />;
        } else if (item.type === 'account') {
            // This shouldn't happen with the new logic, but keep as fallback
            form = <AccountForm initial={item} loading={loading} deleting={deleting} onSubmit={handleSave} onCancel={handleCancel} submitLabel={loading ? "Saving..." : "Save"} />;
        } else if (item.type === 'debt') {
            form = <DebtForm initial={item} loading={loading} deleting={deleting} onSubmit={handleSave} onCancel={handleCancel} submitLabel={loading ? "Saving..." : "Save"} />;
        } else if (item.type === 'currency') {
            form = <CurrencyForm initial={item} loading={loading} deleting={deleting} onSubmit={handleSave} onCancel={handleCancel} submitLabel={loading ? "Saving..." : "Save"} />;
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto" showCloseButton={false}>
                {/* Action buttons positioned absolutely */}
                <div className="absolute top-4 right-4 flex items-center gap-1 z-10">
                    {/* More actions dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={deleting}
                            >
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">More options</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onSelect={handleDelete}
                                disabled={deleting}
                                className="text-destructive focus:text-destructive flex items-center gap-2"
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                                {deleting ? "Deleting..." : "Delete item"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {/* Close button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </Button>
                </div>

                {/* Standard dialog header */}
                <DialogHeader className="pr-20">
                    <div className="flex items-center gap-2 min-h-[2.5rem] w-full">
                        {showBackButton && (
                            <button
                                className="cursor-pointer p-1 rounded hover:bg-gray-100 flex items-center justify-center"
                                onClick={resetToSelection}
                                aria-label="Back"
                                type="button"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}
                        <div className="flex-1">
                            <DialogTitle>{dialogTitle}</DialogTitle>
                            <DialogDescription>
                                {dialogDescription}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                
                {form}
            </DialogContent>
        </Dialog>
    );
}
