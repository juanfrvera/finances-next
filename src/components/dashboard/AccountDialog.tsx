"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AccountForm, UpdateBalanceForm, TransactionForm } from "./ItemForms";
import TransactionsList from "./TransactionsList";
import { useState, useEffect } from "react";
import { updateItemToDb, deleteItemFromDb, updateAccountBalance, createTransaction, getTransactions } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { MoreVertical, X, Trash2, ArrowLeft, Plus } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { showToast, toastMessages } from "@/lib/toast";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

type AccountAction = 'updateBalance' | 'transactions' | 'editInfo' | 'addTransaction' | null;

// Format money helper
function formatMoney(amount: number) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

function ActionBox({ label, description, onClick }: { label: string, description: string, onClick: () => void }) {
    return (
        <div
            className="p-3 border border-border rounded-lg cursor-pointer hover:bg-accent transition-colors"
            onClick={onClick}
        >
            <h3 className="font-medium text-foreground text-sm">{label}</h3>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
    );
}

function BalanceChart({ itemId, currentBalance }: { itemId: string; currentBalance: number }) {
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadChartData() {
            try {
                const transactions = await getTransactions(itemId);

                if (transactions.length === 0) {
                    // If no transactions, just show current balance
                    setChartData([{
                        date: 'Current',
                        balance: Math.round(currentBalance * 100) / 100,
                    }]);
                    return;
                }

                // Start with current balance and work backwards
                let runningBalance = Math.round(currentBalance * 100) / 100;
                const balanceData: any[] = [];

                // Add current balance as the last point
                balanceData.unshift({
                    date: 'Current',
                    balance: runningBalance,
                });

                // Sort transactions by date (newest first) and work backwards
                const sortedTransactions = [...transactions];

                // Work backwards through transactions to calculate historical balances
                sortedTransactions.forEach((transaction, index) => {
                    const transactionAmount = (transaction as any).amount || 0;
                    const transactionDate = (transaction as any).date || new Date().toISOString();

                    // Subtract this transaction to get the balance before it
                    runningBalance -= transactionAmount;

                    // Round to 2 decimal places to avoid floating point precision issues
                    runningBalance = Math.round(runningBalance * 100) / 100;

                    balanceData.unshift({
                        date: new Date(transactionDate).toLocaleDateString(),
                        balance: runningBalance,
                    });
                });

                // Limit to last 10 data points for readability
                setChartData(balanceData.slice(-10));
            } catch (error) {
                console.error('Failed to load chart data:', error);
                setChartData([]);
            } finally {
                setLoading(false);
            }
        }

        if (itemId) {
            loadChartData();
        }
    }, [itemId, currentBalance]);

    if (loading) {
        return (
            <div className="h-48 flex items-center justify-center">
                <div className="text-sm text-muted-foreground">Loading chart...</div>
            </div>
        );
    }

    if (chartData.length === 0) {
        return (
            <div className="h-48 flex items-center justify-center">
                <div className="text-sm text-muted-foreground">No transaction history</div>
            </div>
        );
    }

    return (
        <div className="h-48 bg-card rounded-lg border p-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.4} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="date"
                        fontSize={11}
                        tick={{ fill: 'var(--muted-foreground)' }}
                        axisLine={{ stroke: 'var(--border)' }}
                        tickLine={{ stroke: 'var(--border)' }}
                    />
                    <YAxis
                        fontSize={11}
                        tick={{ fill: 'var(--muted-foreground)' }}
                        axisLine={{ stroke: 'var(--border)' }}
                        tickLine={{ stroke: 'var(--border)' }}
                        domain={['dataMin - 100', 'dataMax + 100']}
                        tickFormatter={(value) => {
                            // Round to nearest 10 for clean display, no decimals
                            const rounded = Math.round(value / 10) * 10;
                            return new Intl.NumberFormat('en-US', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                            }).format(rounded);
                        }}
                    />
                    <Tooltip
                        formatter={(value: number) => [formatMoney(value), 'Balance']}
                        labelStyle={{ color: 'var(--foreground)' }}
                        contentStyle={{
                            backgroundColor: 'var(--popover)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            color: 'var(--popover-foreground)',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                    />
                    <Bar
                        dataKey="balance"
                        fill="url(#barGradient)"
                        stroke="var(--primary)"
                        strokeWidth={1}
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// Confirmation Dialog Component
function DeleteConfirmationDialog({ 
    open, 
    onOpenChange, 
    onConfirm, 
    accountName, 
    isDeleting 
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    accountName: string;
    isDeleting: boolean;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <Trash2 className="h-5 w-5" />
                        Are you sure?
                    </DialogTitle>
                    <DialogDescription className="text-left space-y-2">
                        <div>
                            You are about to delete <strong>{accountName}</strong> forever, 
                            along with all the transactions ever done in this account.
                        </div>
                        <div className="text-sm text-muted-foreground">
                            This action cannot be undone. All data will be permanently removed from our servers.
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2 mt-6">
                    <Button 
                        variant="outline" 
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="destructive" 
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="min-w-[100px]"
                    >
                        {isDeleting ? "Deleting..." : "Delete Account"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
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
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

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

    async function handleUpdateBalance(data: { newBalance: number; note?: string }) {
        setLoading(true);
        const toastId = showToast.loading('Updating balance...');
        try {
            const updated = await updateAccountBalance(item._id, data.newBalance, data.note);
            onItemUpdated(updated);
            showToast.update(toastId, 'Balance updated successfully!', 'success');
        } catch (error) {
            showToast.update(toastId, 'Failed to update balance', 'error');
        } finally {
            setLoading(false);
            onOpenChange(false);
        }
    }

    async function handleCreateTransaction(data: { amount: number; note?: string }) {
        setLoading(true);
        const toastId = showToast.loading('Adding transaction...');
        try {
            await createTransaction(item._id, data.amount, data.note);

            // Calculate the new balance with proper rounding
            const newBalance = Math.round(((item.balance || 0) + data.amount) * 100) / 100;
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
            setShowDeleteConfirmation(false);
            onOpenChange(false);
        }
    }

    function showDeleteDialog() {
        setShowDeleteConfirmation(true);
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
            <>
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
                                        onSelect={showDeleteDialog}
                                        disabled={deleting}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                                        <span>Delete Account</span>
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
                            <DialogTitle>Account Overview</DialogTitle>
                            <DialogDescription>
                                {item.name} - Manage your account balance and transactions.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Main content area with balance and actions */}
                        <div className="grid grid-cols-3 gap-6">
                            {/* Left side - Balance display */}
                            <div className="col-span-1 flex flex-col items-center justify-center p-6 bg-accent/50 rounded-lg">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-foreground mb-1">
                                        {formatMoney(item.balance || 0)}
                                    </div>
                                    <div className="text-sm text-muted-foreground uppercase tracking-wider">
                                        {item.currency || 'USD'}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Current Balance
                                    </div>
                                </div>
                            </div>

                            {/* Right side - Action buttons */}
                            <div className="col-span-2 grid grid-cols-1 gap-3">
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
                        </div>

                        {/* Balance chart */}
                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-foreground mb-3">Balance History</h3>
                            <BalanceChart itemId={item._id} currentBalance={item.balance || 0} />
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <DeleteConfirmationDialog
                    open={showDeleteConfirmation}
                    onOpenChange={setShowDeleteConfirmation}
                    onConfirm={handleDelete}
                    accountName={item?.name || 'this account'}
                    isDeleting={deleting}
                />
            </>
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
        <>
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
                                            onSelect={showDeleteDialog}
                                            disabled={deleting}
                                            className="text-destructive focus:text-destructive flex items-center gap-2"
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                            Delete Account
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

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                open={showDeleteConfirmation}
                onOpenChange={setShowDeleteConfirmation}
                onConfirm={handleDelete}
                accountName={item?.name || 'this account'}
                isDeleting={deleting}
            />
        </>
    );
}
