"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { showToast } from "@/lib/toast";
import { getTransactions, deleteTransaction } from "@/app/actions";
import type { Transaction } from "@/lib/types";

function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
        return "Just now";
    } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 48) {
        return "Yesterday";
    } else {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}

function formatCurrency(amount: number, currency: string = '') {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Math.abs(amount)) + (currency ? ` ${currency}` : '');
}

export default function TransactionsList({ 
    itemId, 
    currency, 
    onAddTransaction,
    onRefresh
}: { 
    itemId: string; 
    currency: string; 
    onAddTransaction?: () => void;
    onRefresh?: () => void;
}) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        loadTransactions();
    }, [itemId]);

    async function loadTransactions() {
        try {
            setLoading(true);
            const data = await getTransactions(itemId);
            setTransactions(data as Transaction[]);
        } catch (error) {
            showToast.error("Failed to load transactions");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(transactionId: string) {
        setDeletingId(transactionId);
        const toastId = showToast.loading("Deleting transaction...");
        try {
            await deleteTransaction(transactionId);
            setTransactions(prev => prev.filter(t => t._id !== transactionId));
            showToast.update(toastId, "Transaction deleted successfully!", "success");
            if (onRefresh) onRefresh();
        } catch (error) {
            showToast.update(toastId, "Failed to delete transaction", "error");
        } finally {
            setDeletingId(null);
        }
    }

    // Function to refresh transactions after adding a new one
    const refreshTransactions = () => {
        loadTransactions();
    };

    // Expose refresh function to parent
    useEffect(() => {
        (window as any).__refreshTransactions = refreshTransactions;
        return () => {
            delete (window as any).__refreshTransactions;
        };
    }, []);

    if (loading) {
        return (
            <div className="p-4 text-center text-muted-foreground">
                Loading transactions...
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {transactions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                    <p>No transactions yet.</p>
                    <p className="text-sm mt-1">Click "Add Transaction" to record your first transaction.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {transactions.map((transaction) => (
                        <div
                            key={transaction._id}
                            className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`font-medium ${
                                            transaction.amount > 0
                                                ? "text-green-600 dark:text-green-400"
                                                : "text-red-600 dark:text-red-400"
                                        }`}
                                    >
                                        {transaction.amount > 0 ? "+" : "-"}
                                        {formatCurrency(transaction.amount, currency)}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {formatDate(transaction.date)}
                                    </span>
                                </div>
                                {transaction.note && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {transaction.note}
                                    </p>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(transaction._id)}
                                disabled={deletingId === transaction._id}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete transaction</span>
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
