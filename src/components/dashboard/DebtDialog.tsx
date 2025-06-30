"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DebtForm, DebtPaymentForm } from "./ItemForms";
import TransactionsList from "./TransactionsList";
import { useState } from "react";
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
    const [activeView, setActiveView] = useState<'details' | 'payments'>('details');

    async function handleSave(data: any) {
        setLoading(true);
        const toastId = showToast.loading(toastMessages.saving);
        try {
            const updated = await updateItemToDb({ ...item, ...data });
            
            if (updated) {
                // Refresh payment status
                const paymentStatus = await getDebtPaymentStatus(updated._id);
                const updatedWithStatus = { ...updated, ...paymentStatus };
                onItemUpdated(updatedWithStatus);
            } else {
                onItemUpdated({ ...item, ...data });
            }
            
            showToast.update(toastId, toastMessages.saved, 'success');
        } catch (error) {
            showToast.update(toastId, toastMessages.saveError, 'error');
        } finally {
            setLoading(false);
            setActiveView('details');
        }
    }

    async function handlePayment(data: { amount: number; note: string }) {
        setPaymentLoading(true);
        const toastId = showToast.loading('Recording payment...');
        try {
            await createDebtPayment(item._id, data.amount, data.note);
            
            // Update item with new payment status
            const paymentStatus = await getDebtPaymentStatus(item._id);
            const updated = await updateItemToDb(item); // Refresh the item
            if (updated) {
                const updatedWithStatus = { ...updated, ...paymentStatus };
                onItemUpdated(updatedWithStatus);
            }
            
            showToast.update(toastId, 'Payment recorded successfully!', 'success');
            setActiveView('details'); // Return to details view
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

    async function handleArchive() {
        if (!onItemArchived) return;

        setArchiving(true);
        const toastId = showToast.loading('Archiving debt...');
        try {
            const archived = await archiveItem(item._id);
            // Preserve payment status
            const archivedWithStatus = { ...archived, ...item };
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
            const unarchived = await unarchiveItem(item._id);
            
            if (unarchived) {
                // Refresh payment status
                const paymentStatus = await getDebtPaymentStatus(unarchived._id);
                const unarchivedWithStatus = { ...unarchived, ...paymentStatus };
                onItemUnarchived(unarchivedWithStatus);
            } else {
                onItemUnarchived(item);
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
        setActiveView('details');
    }

    if (!item) return null;

    const remainingAmount = item.remainingAmount || item.amount;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto" showCloseButton={false}>
                {/* Action buttons positioned absolutely */}
                <div className="absolute top-4 right-4 flex items-center gap-1 z-10">
                    {/* View toggle buttons */}
                    {activeView === 'details' && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setActiveView('payments')}
                                title="Add payment"
                            >
                                <CreditCard className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setActiveView('payments')}
                                title="View payments"
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                        </>
                    )}

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
                            {item.archived ? (
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
                        {activeView === 'details' ? 'Debt Details' : 'Record Payment'}
                    </DialogTitle>
                    <DialogDescription>
                        {activeView === 'details' 
                            ? 'View and edit debt information and payment status.'
                            : 'Add a payment towards this debt.'
                        }
                    </DialogDescription>
                </DialogHeader>

                {/* Content based on active view */}
                {activeView === 'details' && (
                    <div className="space-y-6">
                        <DebtForm 
                            initial={item} 
                            loading={loading} 
                            deleting={deleting} 
                            onSubmit={handleSave} 
                            onCancel={handleCancel} 
                            submitLabel={loading ? "Saving..." : "Save"} 
                        />
                        
                        {/* Payment status summary */}
                        {item.paymentStatus && (
                            <div className="border-t pt-4">
                                <h3 className="text-sm font-medium mb-2">Payment Status</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Total Amount:</span>
                                        <div className="font-medium">{item.amount} {item.currency}</div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Paid:</span>
                                        <div className="font-medium">{item.totalPaid || 0} {item.currency}</div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Remaining:</span>
                                        <div className="font-medium">{remainingAmount} {item.currency}</div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Payments:</span>
                                        <div className="font-medium">{item.transactionCount || 0}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Transactions list */}
                        <div className="border-t pt-4">
                            <h3 className="text-sm font-medium mb-2">Payment History</h3>
                            <TransactionsList 
                                itemId={item._id}
                                currency={item.currency}
                                onRefresh={async () => {
                                    // Refresh payment status when transactions change
                                    const paymentStatus = await getDebtPaymentStatus(item._id);
                                    const updatedWithStatus = { ...item, ...paymentStatus };
                                    onItemUpdated(updatedWithStatus);
                                }}
                            />
                        </div>
                    </div>
                )}

                {activeView === 'payments' && (
                    <DebtPaymentForm
                        debtAmount={remainingAmount}
                        currency={item.currency}
                        loading={paymentLoading}
                        onSubmit={handlePayment}
                        onCancel={handleCancel}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
