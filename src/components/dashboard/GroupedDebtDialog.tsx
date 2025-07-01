"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";

// Helper function to format money with smaller decimals
function formatMoney(amount: number) {
    const formatted = Number(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const parts = formatted.split('.');

    return (<span>{parts[0]}<span className="text-sm">.{parts[1]}</span></span>);
}

interface GroupedDebtDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groupedDebt: any;
    onDebtClick: (debt: any) => void;
}

export default function GroupedDebtDialog({
    open,
    onOpenChange,
    groupedDebt,
    onDebtClick
}: GroupedDebtDialogProps) {
    if (!groupedDebt || !groupedDebt.isGrouped) {
        return null;
    }

    const { withWho, theyPayMe, groupedItems = [] } = groupedDebt;

    // Helper function to get payment status info
    const getPaymentStatusInfo = (debt: any) => {
        if (!debt.paymentStatus) {
            return { text: 'Status unknown', color: 'text-muted-foreground' };
        }

        switch (debt.paymentStatus) {
            case 'paid':
                return { text: 'Fully paid', color: 'text-green-600 dark:text-green-400' };
            case 'partially_paid':
                return { text: 'Partially paid', color: 'text-yellow-600 dark:text-yellow-400' };
            case 'unpaid':
                return { text: 'Unpaid', color: 'text-red-600 dark:text-red-400' };
            default:
                return { text: 'Status unknown', color: 'text-muted-foreground' };
        }
    };

    // Sort debts by edit date (most recent first)
    const sortedDebts = [...groupedItems].sort((a, b) => {
        const aDate = new Date(a.editDate || 0).getTime();
        const bDate = new Date(b.editDate || 0).getTime();
        return bDate - aDate;
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Debts with {withWho}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        {theyPayMe ? `${withWho} owes you` : `You owe ${withWho}`} • {groupedItems.length} debt{groupedItems.length > 1 ? 's' : ''}
                    </p>
                </DialogHeader>

                <div className="space-y-3 mt-4">
                    {sortedDebts.map((debt, index) => {
                        const statusInfo = getPaymentStatusInfo(debt);

                        return (
                            <Card
                                key={debt._id || index}
                                className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                                onClick={() => {
                                    onDebtClick(debt);
                                    onOpenChange(false);
                                }}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-sm mb-1">
                                            {debt.description || 'No description'}
                                        </h3>
                                        <div className="text-lg font-semibold">
                                            {formatMoney(debt.amount)} {debt.currency}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-sm font-medium ${statusInfo.color}`}>
                                            {statusInfo.text}
                                        </div>
                                        {debt.editDate && (
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {new Date(debt.editDate).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Payment details */}
                                {debt.paymentStatus && debt.paymentStatus !== 'unpaid' && (
                                    <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                                        <div className="grid grid-cols-2 gap-4">
                                            {debt.totalPaid !== undefined && (
                                                <div>
                                                    <span className="font-medium">Paid:</span> {formatMoney(debt.totalPaid)} {debt.currency}
                                                </div>
                                            )}
                                            {debt.remainingAmount !== undefined && debt.remainingAmount > 0 && (
                                                <div>
                                                    <span className="font-medium">Remaining:</span> {formatMoney(debt.remainingAmount)} {debt.currency}
                                                </div>
                                            )}
                                        </div>
                                        {debt.transactionCount !== undefined && debt.transactionCount > 0 && (
                                            <div className="mt-1">
                                                <span className="font-medium">Payments:</span> {debt.transactionCount} transaction{debt.transactionCount > 1 ? 's' : ''}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>

                {groupedItems.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        No debts found in this group
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
