"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DebtForm, DebtPaymentForm } from "./ItemForms";
import TransactionsList from "./TransactionsList";
import { useState, useEffect } from "react";
import { updateItemToDb, deleteItemFromDb, archiveItem, unarchiveItem, createDebtPayment, getDebtPaymentStatus } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { MoreVertical, X, Trash2, Archive, CreditCard, Edit } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { showToast, toastMessages } from "@/lib/toast";

// Helper function to generate debt summary text
function getDebtSummaryText(item: any) {
    const personName = item.withWho || item.name || 'Someone';
    const totalAmount = item.amount || 0;
    const totalPaid = item.totalPaid || 0;
    const remainingAmount = item.remainingAmount || totalAmount;
    const currency = item.currency || 'USD';
    const theyPayMe = item.theyPayMe; // true = they owe me, false = I owe them

    if (totalPaid === 0) {
        // No payments made - show full amount owed
        if (theyPayMe) {
            return `${personName} owes you ${totalAmount} ${currency}`;
        } else {
            return `You owe ${remainingAmount} ${currency} to ${personName}`;
        }
    } else if (remainingAmount <= 0) {
        // Fully paid - show past tense with full amount
        if (theyPayMe) {
            return `${personName} paid you ${totalAmount} ${currency} ✅`;
        } else {
            return `You paid ${totalAmount} ${currency} to ${personName} ✅`;
        }
    } else {
        // Partially paid - show remaining amount for current debt
        if (theyPayMe) {
            return `${personName} owes you ${remainingAmount} ${currency} (paid ${totalPaid} of ${totalAmount})`;
        } else {
            return `You owe ${remainingAmount} ${currency} to ${personName} (paid ${totalPaid} of ${totalAmount})`;
        }
    }
}

export default function DebtDialog({ open, onOpenChange, item, onItemUpdated, onItemDeleted, onItemArchived, onItemUnarchived }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: any;
    onItemUpdated: (item: any) => void;
    onItemDeleted: (id: string) => void;
    onItemArchived?: (item: any) => void;
    onItemUnarchived?: (item: any) => void;
}) {
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [archiving, setArchiving] = useState(false);
    const [unarchiving, setUnarchiving] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [activeView, setActiveView] = useState<'summary' | 'edit' | 'payments'>('summary');
    const [currentItem, setCurrentItem] = useState(item);

    // Update local state when item prop changes
    useEffect(() => {
        setCurrentItem(item);
    }, [item]);

    async function handleSave(data: any) {
        setLoading(true);
        const toastId = showToast.loading(toastMessages.saving);
        try {
            const updated = await updateItemToDb({ ...currentItem, ...data });

            if (updated) {
                // Refresh payment status
                const paymentStatus = await getDebtPaymentStatus(updated._id);
                const updatedWithStatus = { ...updated, ...paymentStatus };
                setCurrentItem(updatedWithStatus);
                onItemUpdated(updatedWithStatus);
            } else {
                const updatedItem = { ...currentItem, ...data };
                setCurrentItem(updatedItem);
                onItemUpdated(updatedItem);
            }

            showToast.update(toastId, toastMessages.saved, 'success');
        } catch (error) {
            showToast.update(toastId, toastMessages.saveError, 'error');
        } finally {
            setLoading(false);
            setActiveView('summary');
        }
    }

    async function handlePayment(data: { amount: number; note: string }) {
        setPaymentLoading(true);
        const toastId = showToast.loading('Recording payment...');
        try {
            await createDebtPayment(currentItem._id, data.amount, data.note);

            // Update item with new payment status
            const paymentStatus = await getDebtPaymentStatus(currentItem._id);
            const updatedWithStatus = { ...currentItem, ...paymentStatus };

            // Update both local state and parent state
            setCurrentItem(updatedWithStatus);
            onItemUpdated(updatedWithStatus);

            showToast.update(toastId, 'Payment recorded successfully!', 'success');
            setActiveView('summary'); // Return to summary view
        } catch (error) {
            showToast.update(toastId, 'Failed to record payment', 'error');
        } finally {
            setPaymentLoading(false);
        }
    }

    async function handleDelete() {
        setDeleting(true);
        const toastId = showToast.loading(toastMessages.deleting);
        try {
            await deleteItemFromDb(currentItem._id);
            onItemDeleted(currentItem._id);
            showToast.update(toastId, toastMessages.deleted, 'success');
        } catch (error) {
            showToast.update(toastId, toastMessages.deleteError, 'error');
        } finally {
            setDeleting(false);
            onOpenChange(false);
        }
    }

    async function handleArchive() {
        if (!onItemArchived) return;

        setArchiving(true);
        const toastId = showToast.loading('Archiving debt...');
        try {
            const archived = await archiveItem(currentItem._id);
            // Preserve payment status
            const archivedWithStatus = { ...archived, ...currentItem };
            onItemArchived(archivedWithStatus);
            showToast.update(toastId, 'Debt archived successfully!', 'success');
        } catch (error) {
            showToast.update(toastId, 'Failed to archive debt', 'error');
        } finally {
            setArchiving(false);
            onOpenChange(false);
        }
    }

    async function handleUnarchive() {
        if (!onItemUnarchived) return;

        setUnarchiving(true);
        const toastId = showToast.loading('Unarchiving debt...');
        try {
            const unarchived = await unarchiveItem(currentItem._id);

            if (unarchived) {
                // Refresh payment status
                const paymentStatus = await getDebtPaymentStatus(unarchived._id);
                const unarchivedWithStatus = { ...unarchived, ...paymentStatus };
                onItemUnarchived(unarchivedWithStatus);
            } else {
                onItemUnarchived(currentItem);
            }

            showToast.update(toastId, 'Debt unarchived successfully!', 'success');
        } catch (error) {
            showToast.update(toastId, 'Failed to unarchive debt', 'error');
        } finally {
            setUnarchiving(false);
            onOpenChange(false);
        }
    }

    function handleCancel() {
        setActiveView('summary');
    }

    if (!currentItem) return null;

    const remainingAmount = currentItem.remainingAmount || currentItem.amount;

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
                                disabled={deleting || archiving || unarchiving}
                            >
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">More options</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {currentItem.archived ? (
                                onItemUnarchived && (
                                    <DropdownMenuItem
                                        onSelect={handleUnarchive}
                                        disabled={unarchiving}
                                        className="flex items-center gap-2"
                                    >
                                        <Archive className="h-4 w-4" />
                                        {unarchiving ? "Unarchiving..." : "Unarchive debt"}
                                    </DropdownMenuItem>
                                )
                            ) : (
                                onItemArchived && (
                                    <DropdownMenuItem
                                        onSelect={handleArchive}
                                        disabled={archiving}
                                        className="flex items-center gap-2"
                                    >
                                        <Archive className="h-4 w-4" />
                                        {archiving ? "Archiving..." : "Archive debt"}
                                    </DropdownMenuItem>
                                )
                            )}
                            <DropdownMenuItem
                                onSelect={handleDelete}
                                disabled={deleting}
                                className="text-destructive focus:text-destructive flex items-center gap-2"
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                                {deleting ? "Deleting..." : "Delete debt"}
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

                {/* Dialog header */}
                <DialogHeader className="pr-20">
                    <DialogTitle>
                        {activeView === 'summary' ? 'Debt Overview' :
                            activeView === 'edit' ? 'Edit Debt' : 'Record Payment'}
                    </DialogTitle>
                    <DialogDescription>
                        {activeView === 'summary'
                            ? 'View debt information and payment status.'
                            : activeView === 'edit'
                                ? 'Edit debt information and details.'
                                : 'Add a payment towards this debt.'
                        }
                    </DialogDescription>
                </DialogHeader>

                {/* Content based on active view */}
                {activeView === 'summary' && (
                    <div className="space-y-6">
                        {/* Debt Summary */}
                        <div className="bg-muted/50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold mb-2">{getDebtSummaryText(currentItem)}</h3>
                            {currentItem.description && (
                                <p className="text-sm text-muted-foreground mb-3">{currentItem.description}</p>
                            )}

                            {/* Additional Details */}
                            {currentItem.details && (
                                <div className="mb-3">
                                    <h4 className="text-sm font-medium text-foreground mb-1">Additional Details:</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{currentItem.details}</p>
                                </div>
                            )}

                            {/* Payment Status Badge */}
                            {currentItem.paymentStatus && (
                                <div className="mb-3">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${currentItem.paymentStatus === 'paid'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : currentItem.paymentStatus === 'partially_paid'
                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        }`}>
                                        {currentItem.paymentStatus === 'paid' ? '✅ Fully Paid' :
                                            currentItem.paymentStatus === 'partially_paid' ? '🟡 Partially Paid' :
                                                '🔴 Unpaid'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setActiveView('payments')}
                                disabled={loading}
                            >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Record Payment
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setActiveView('edit')}
                                disabled={loading}
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Details
                            </Button>
                        </div>

                        {/* Transactions list */}
                        <div className="border-t pt-4">
                            <h3 className="text-sm font-medium mb-2">Payment History</h3>
                            <TransactionsList
                                itemId={currentItem._id}
                                currency={currentItem.currency}
                                onRefresh={async () => {
                                    // Refresh payment status when transactions change
                                    const paymentStatus = await getDebtPaymentStatus(currentItem._id);
                                    const updatedWithStatus = { ...currentItem, ...paymentStatus };
                                    setCurrentItem(updatedWithStatus);
                                    onItemUpdated(updatedWithStatus);
                                }}
                            />
                        </div>
                    </div>
                )}

                {activeView === 'edit' && (
                    <div className="space-y-6">
                        <DebtForm
                            initial={currentItem}
                            loading={loading}
                            deleting={deleting}
                            onSubmit={handleSave}
                            onCancel={handleCancel}
                            submitLabel={loading ? "Saving..." : "Save"}
                        />
                    </div>
                )}

                {activeView === 'payments' && (
                    <DebtPaymentForm
                        debtAmount={remainingAmount}
                        currency={currentItem.currency}
                        loading={paymentLoading}
                        onSubmit={handlePayment}
                        onCancel={handleCancel}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
