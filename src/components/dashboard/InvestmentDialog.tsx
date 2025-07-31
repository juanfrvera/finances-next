"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { InvestmentForm, InvestmentValueUpdateForm } from "./ItemForms";
import { useState, useEffect, useCallback } from "react";
import { updateItemToDb, deleteItemFromDb, archiveItem, unarchiveItem } from "@/app/actions";
import { addInvestmentValueUpdate, getInvestmentValueHistory, deleteInvestmentValueUpdate, finishInvestment, unfinishInvestment } from "@/lib/actions/investments";
import { Button } from "@/components/ui/button";
import { MoreVertical, X, Trash2, Archive, Plus, TrendingUp, CheckCircle, Circle, Loader2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { showToast, toastMessages } from "@/lib/toast";
import type { InvestmentValueUpdate } from "@/lib/types";

// Helper function to format money with smaller decimals
function formatMoney(amount: number) {
    const formatted = Number(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const parts = formatted.split('.');

    return (<span>{parts[0]}<span className="text-sm">.{parts[1]}</span></span>);
}

export default function InvestmentDialog({ open, onOpenChange, item, onItemUpdated, onItemDeleted, onItemArchived, onItemUnarchived, availableCurrencies = [], availableAccounts = [] }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: any;
    onItemUpdated: (item: any) => void;
    onItemDeleted: (id: string) => void;
    onItemArchived?: (item: any) => void;
    onItemUnarchived?: (item: any) => void;
    availableCurrencies?: string[];
    availableAccounts?: any[];
}) {
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [archiving, setArchiving] = useState(false);
    const [unarchiving, setUnarchiving] = useState(false);
    const [showValueUpdateForm, setShowValueUpdateForm] = useState(false);
    const [valueHistory, setValueHistory] = useState<InvestmentValueUpdate[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const loadValueHistory = useCallback(async () => {
        if (!item?._id) return;

        setLoadingHistory(true);
        try {
            const history = await getInvestmentValueHistory(item._id);
            setValueHistory(history);
        } catch (error) {
            console.error('Failed to load value history:', error);
        } finally {
            setLoadingHistory(false);
        }
    }, [item?._id]);

    // Load value history when dialog opens
    useEffect(() => {
        if (open && item?._id) {
            loadValueHistory();
        }
    }, [open, item?._id, loadValueHistory]);

    async function handleSave(data: any) {
        if (!item) return;

        setLoading(true);
        const toastId = showToast.loading(toastMessages.saving);
        try {
            const updated = await updateItemToDb({ ...item, ...data });
            if (updated) {
                onItemUpdated(updated);
                showToast.update(toastId, toastMessages.saved, 'success');
                onOpenChange(false);
            } else {
                throw new Error('Failed to update item');
            }
        } catch (error) {
            console.error('Failed to update investment:', error);
            showToast.update(toastId, toastMessages.saveError, 'error');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        if (!item) return;

        setDeleting(true);
        const toastId = showToast.loading(toastMessages.deleting);
        try {
            await deleteItemFromDb(item._id);
            onItemDeleted(item._id);
            showToast.update(toastId, toastMessages.deleted, 'success');
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to delete investment:', error);
            showToast.update(toastId, toastMessages.deleteError, 'error');
        } finally {
            setDeleting(false);
        }
    }

    async function handleArchive() {
        if (!item) return;

        const isArchiving = !item.archived;
        const loadingMessage = isArchiving ? 'Archiving investment...' : 'Unarchiving investment...';
        const successMessage = isArchiving ? 'Investment archived successfully!' : 'Investment unarchived successfully!';
        const errorMessage = isArchiving ? 'Failed to archive investment' : 'Failed to unarchive investment';

        if (isArchiving) setArchiving(true);
        else setUnarchiving(true);

        const toastId = showToast.loading(loadingMessage);
        try {
            let updated;
            if (isArchiving) {
                updated = await archiveItem(item._id);
                onItemArchived?.(updated);
            } else {
                updated = await unarchiveItem(item._id);
                onItemUnarchived?.(updated);
            }
            showToast.update(toastId, successMessage, 'success');
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to toggle archive status:', error);
            showToast.update(toastId, errorMessage, 'error');
        } finally {
            setArchiving(false);
            setUnarchiving(false);
        }
    }

    async function handleAddValueUpdate(data: any) {
        if (!item?._id) return;

        const toastId = showToast.loading('Adding value update...');
        try {
            await addInvestmentValueUpdate(item._id, data.value, data.note, data.date);
            showToast.update(toastId, 'Value update added successfully!', 'success');
            setShowValueUpdateForm(false);
            loadValueHistory(); // Reload history

            // Update the item with new current value
            const updatedItem = { ...item, currentValue: data.value };
            onItemUpdated(updatedItem);
        } catch (error) {
            console.error('Failed to add value update:', error);
            showToast.update(toastId, 'Failed to add value update', 'error');
        }
    }

    async function handleDeleteValueUpdate(updateId: string) {
        const toastId = showToast.loading('Deleting value update...');
        try {
            await deleteInvestmentValueUpdate(updateId);
            showToast.update(toastId, 'Value update deleted successfully!', 'success');
            loadValueHistory(); // Reload history
        } catch (error) {
            console.error('Failed to delete value update:', error);
            showToast.update(toastId, 'Failed to delete value update', 'error');
        }
    }

    async function handleToggleFinished() {
        if (!item?._id) return;

        const isFinishing = !item.isFinished;
        const toastId = showToast.loading(isFinishing ? 'Finishing investment...' : 'Unfinishing investment...');
        try {
            if (isFinishing) {
                await finishInvestment(item._id);
            } else {
                await unfinishInvestment(item._id);
            }

            const updatedItem = { ...item, isFinished: isFinishing };
            onItemUpdated(updatedItem);
            showToast.update(toastId, isFinishing ? 'Investment marked as finished!' : 'Investment unmarked as finished!', 'success');
        } catch (error) {
            console.error('Failed to toggle finished status:', error);
            showToast.update(toastId, 'Failed to update finished status', 'error');
        }
    }

    function handleCancel() {
        onOpenChange(false);
    }

    if (!item) return null;

    // Calculate gain/loss information
    const currentValue = item.currentValue || item.initialValue;
    const gainLoss = currentValue - item.initialValue;
    const gainLossPercentage = ((gainLoss / item.initialValue) * 100);
    const isGain = gainLoss >= 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl" showCloseButton={false}>
                {/* Action buttons positioned absolutely */}
                <div className="absolute top-4 right-4 flex items-center gap-1 z-10">
                    {/* More actions dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleToggleFinished}>
                                {item.isFinished ? (
                                    <>
                                        <Circle className="mr-2 h-4 w-4" />
                                        Mark as Active
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Mark as Finished
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleArchive} disabled={archiving || unarchiving}>
                                {archiving || unarchiving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {archiving ? 'Archiving...' : 'Unarchiving...'}
                                    </>
                                ) : (
                                    <>
                                        <Archive className="mr-2 h-4 w-4" />
                                        {item.archived ? 'Unarchive' : 'Archive'}
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleDelete} className="text-red-600" disabled={deleting || archiving || unarchiving}>
                                {deleting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </>
                                )}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Close button */}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onOpenChange(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <DialogHeader className="pr-16">
                    <DialogTitle>Investment: {item.name}</DialogTitle>
                    <DialogDescription>
                        {item.tag} • {item.description}
                    </DialogDescription>
                </DialogHeader>

                {/* Investment Summary */}
                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-sm text-muted-foreground">Current Value</div>
                            <div className="text-2xl font-bold">
                                {formatMoney(currentValue)}
                                {item.currency && <span className="text-lg font-normal ml-1">{item.currency}</span>}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Gain/Loss</div>
                            <div className={`text-2xl font-bold ${isGain ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {isGain ? '+' : ''}{formatMoney(Math.abs(gainLoss))}
                                <span className="text-lg font-normal ml-1">({isGain ? '+' : '-'}{Math.abs(gainLossPercentage).toFixed(1)}%)</span>
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Initial Investment</div>
                            <div className="text-lg">
                                {formatMoney(item.initialValue)}
                                {item.currency && <span className="ml-1">{item.currency}</span>}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Status</div>
                            <div className="text-lg flex items-center gap-2">
                                {item.isFinished ? (
                                    <>
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        Finished
                                    </>
                                ) : (
                                    <>
                                        <TrendingUp className="h-4 w-4 text-blue-600" />
                                        Active
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Value History Section */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold">Value History</h3>
                        <Button
                            onClick={() => setShowValueUpdateForm(true)}
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Update
                        </Button>
                    </div>

                    {loadingHistory ? (
                        <div className="text-center py-4 text-muted-foreground">Loading history...</div>
                    ) : valueHistory.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {valueHistory.map((update) => (
                                <div key={update._id} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                                    <div>
                                        <div className="font-medium">
                                            {formatMoney(update.value)}
                                            {item.currency && <span className="ml-1">{item.currency}</span>}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {new Date(update.date).toLocaleDateString()}
                                            {update.note && ` • ${update.note}`}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteValueUpdate(update._id)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-muted-foreground">
                            No value updates yet. Add the first update to track your investment&apos;s progress.
                        </div>
                    )}
                </div>

                {/* Value Update Form */}
                {showValueUpdateForm && (
                    <div className="border-t pt-4 mb-4">
                        <h3 className="text-lg font-semibold mb-3">Add Value Update</h3>
                        <InvestmentValueUpdateForm
                            onSubmit={handleAddValueUpdate}
                            onCancel={() => setShowValueUpdateForm(false)}
                        />
                    </div>
                )}

                {/* Edit Investment Form */}
                <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-3">Edit Investment</h3>
                    <InvestmentForm
                        initial={item}
                        loading={loading}
                        deleting={deleting}
                        onSubmit={handleSave}
                        onCancel={handleCancel}
                        submitLabel={loading ? "Saving..." : "Save"}
                        availableCurrencies={availableCurrencies}
                        availableAccounts={availableAccounts}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
