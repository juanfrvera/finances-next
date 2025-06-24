"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AccountForm, UpdateBalanceForm, TransactionForm } from "./ItemForms";
import TransactionsList from "./TransactionsList";
import { useState, useEffect } from "react";
import { updateItemToDb, deleteItemFromDb, updateAccountBalance, createTransaction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { MoreVertical, X, Trash2, ArrowLeft, Plus } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { showToast, toastMessages } from "@/lib/toast";

type AccountAction = 'updateBalance' | 'transactions' | 'editInfo' | 'addTransaction' | null;

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

export default function AccountDialog({ open, onOpenChange, item, onItemUpdated, onItemDeleted }: {
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

    async function handleCreateTransaction(data: { amount: number; motive?: string }) {
        setLoading(true);
        const toastId = showToast.loading('Adding transaction...');
        try {
            const transaction = await createTransaction(item._id, data.amount, data.motive);
            
            // Refresh account data by fetching updated account
            // The server action already updated the balance
            const newBalance = (item.balance || 0) + data.amount;
            const updated = { ...item, balance: newBalance };
            onItemUpdated(updated);
            
            // Refresh transactions list
            if ((window as any).__refreshTransactions) {
                (window as any).__refreshTransactions();
            }
            
            showToast.update(toastId, 'Transaction added successfully!', 'success');
            setSelectedAction('transactions'); // Go back to transactions list
        } catch (error) {
            showToast.update(toastId, 'Failed to add transaction', 'error');
        } finally {
            setLoading(false);
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

    // Show action selection first
    if (!selectedAction) {
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
                            label="Transactions" 
                            description="View and manage account transactions." 
                            onClick={() => setSelectedAction('transactions')} 
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

    // Determine dialog content based on selected action
    let form: React.ReactNode = null;
    let dialogTitle = "Account";
    let dialogDescription = "Manage your account.";

    switch (selectedAction) {
        case 'updateBalance':
            dialogTitle = "Update Balance";
            dialogDescription = "Update the current balance of the account.";
            form = <UpdateBalanceForm initial={item} loading={loading} onSubmit={handleUpdateBalance} onCancel={handleCancel} />;
            break;
        case 'transactions':
            dialogTitle = "Transactions";
            dialogDescription = "View and manage account transactions.";
            form = <TransactionsList 
                itemId={item._id} 
                currency={item.currency || ''} 
                onRefresh={() => {
                    // Refresh account data if needed
                }}
            />;
            break;
        case 'addTransaction':
            dialogTitle = "Add Transaction";
            dialogDescription = "Record a new transaction for this account.";
            form = <TransactionForm initial={item} loading={loading} onSubmit={handleCreateTransaction} onCancel={() => setSelectedAction('transactions')} />;
            break;
        case 'editInfo':
            dialogTitle = "Edit Account";
            dialogDescription = "Edit the account details.";
            form = <AccountForm initial={item} loading={loading} deleting={deleting} onSubmit={handleSave} onCancel={handleCancel} submitLabel={loading ? "Saving..." : "Save"} />;
            break;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto" showCloseButton={false}>
                {/* Action buttons positioned absolutely */}
                <div className="absolute top-4 right-4 flex items-center gap-1 z-10">
                    {selectedAction !== 'transactions' && (
                        <>
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
                        </>
                    )}
                </div>

                {/* Standard dialog header */}
                <DialogHeader className="pr-4">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 min-h-[2.5rem]">
                            {selectedAction && (
                                <button
                                    className="cursor-pointer p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center"
                                    onClick={resetToSelection}
                                    aria-label="Back"
                                    type="button"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                            )}
                            <div>
                                <DialogTitle>{dialogTitle}</DialogTitle>
                                <DialogDescription>
                                    {dialogDescription}
                                </DialogDescription>
                            </div>
                        </div>
                        {selectedAction === 'transactions' && (
                            <Button
                                onClick={() => setSelectedAction('addTransaction')}
                                size="sm"
                                className="flex items-center gap-2 ml-4"
                            >
                                <Plus className="h-4 w-4" />
                                Add Transaction
                            </Button>
                        )}
                    </div>
                </DialogHeader>
                
                {form}
            </DialogContent>
        </Dialog>
    );
}
