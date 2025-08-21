import { getDb } from "@/lib/db";
import { getCurrencies, getPersons } from "@/lib/actions/entities";
import { CurrencyEntity, PersonEntity, DbItem, Item, PaymentStatusInfo, InvestmentValueUpdate } from "@/lib/types";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { Db } from "mongodb";

interface DashboardProps {
    userId: string;
}

export default async function Dashboard({ userId }: DashboardProps) {
    const db = await getDb();
    const items = await db.collection("items").find({ userId }).toArray();

    // Load currencies and persons from database
    let currencies: CurrencyEntity[] = [];
    let persons: PersonEntity[] = [];

    try {
        currencies = await getCurrencies();
        persons = await getPersons();
    } catch (error) {
        console.log("Could not load currencies and persons:", error);
    }

    // Convert to plain objects and _id to string, ensure createDate/editDate are strings
    const plainItems: DbItem[] = items.map((item) => ({
        ...item,
        _id: item._id?.toString?.() ?? '',
        createDate: item.createDate ? new Date(item.createDate).toISOString() : new Date().toISOString(),
        editDate: item.editDate ? new Date(item.editDate).toISOString() : new Date().toISOString(),
        userId: item.userId || userId,
        type: item.type || 'account',
        // Ensure account items have amount field for consistency (copy from balance if needed)
        amount: item.amount || item.balance || 0,
    }));

    // Separate active and archived items
    const activeItems = plainItems.filter((item) => !item.archived);
    const archivedItems = plainItems.filter((item) => item.archived);

    // Get all debt items (both active and archived) and calculate payment statuses
    const allDebtItems = plainItems.filter((item) => item.type === "debt");
    const debtPaymentStatuses = await calculateDebtPaymentStatuses(db, allDebtItems);

    // Get all investment items (both active and archived) and load value histories
    const allInvestmentItems = plainItems.filter((item) => item.type === "investment");
    const investmentHistories = await loadInvestmentValueHistories(db, allInvestmentItems);

    // Process active items
    const accountItems = activeItems.filter((item) => item.type === "account");

    let mappedItems = processCurrencyItems(activeItems, accountItems);
    mappedItems = attachDebtPaymentStatuses(mappedItems, debtPaymentStatuses);
    mappedItems = attachInvestmentValueHistories(mappedItems, investmentHistories);

    // Process archived items
    const mappedArchivedItems = processArchivedItems(archivedItems, debtPaymentStatuses, investmentHistories);

    const hasItems = mappedItems.length > 0;

    return (
        <div className="px-4 md:px-12 lg:px-32 pb-8">
            {!hasItems && (
                <div className="text-center my-8">
                    <h1 className="text-2xl font-bold mb-2">Welcome to your Dashboard</h1>
                    <p className="text-gray-600 mb-4">Get started by creating your first item!</p>
                </div>
            )}
            <DashboardClient
                items={mappedItems as Item[]}
                archivedItems={mappedArchivedItems as Item[]}
                availableCurrencies={currencies.map(c => c.name).sort()}
                availablePersons={persons.map(p => p.name).sort()}
            />
        </div>
    );
}

// Helper function to calculate debt payment statuses
async function calculateDebtPaymentStatuses(db: Db, debtItems: DbItem[]): Promise<Record<string, PaymentStatusInfo>> {
    const debtItemIds = debtItems.map((item) => item._id);

    const debtPaymentStatuses: Record<string, PaymentStatusInfo> = {};

    if (debtItemIds.length > 0) {
        const transactions = await db.collection("transactions")
            .find({ itemId: { $in: debtItemIds } })
            .toArray();

        // Calculate payment status for each debt item
        debtItems.forEach(debtItem => {
            const itemId = debtItem._id;
            const debtAmount = debtItem.amount || 0;
            const itemTransactions = transactions.filter(t => t.itemId === itemId);
            const totalPaid = itemTransactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
            const remainingAmount = debtAmount - totalPaid;

            // Determine payment status
            let paymentStatus: 'paid' | 'partially_paid' | 'unpaid';
            if (totalPaid <= 0) {
                paymentStatus = 'unpaid';
            } else if (remainingAmount <= 0) {
                paymentStatus = 'paid';
            } else {
                paymentStatus = 'partially_paid';
            }

            debtPaymentStatuses[itemId] = {
                totalPaid,
                remainingAmount: Math.max(0, remainingAmount),
                paymentStatus,
                transactionCount: itemTransactions.length,
            };
        });
    }

    return debtPaymentStatuses;
}

// Helper function to load investment value histories
async function loadInvestmentValueHistories(db: Db, investmentItems: DbItem[]): Promise<Record<string, InvestmentValueUpdate[]>> {
    const investmentItemIds = investmentItems.map((item) => item._id);

    const investmentHistories: Record<string, InvestmentValueUpdate[]> = {};

    if (investmentItemIds.length > 0) {
        const valueUpdates = await db.collection("investmentValueUpdates")
            .find({ investmentId: { $in: investmentItemIds } })
            .sort({ date: 1 }) // Sort by date ascending
            .toArray();

        // Group value updates by investment ID
        investmentItems.forEach(investmentItem => {
            const itemId = investmentItem._id;
            const itemUpdates = valueUpdates.filter(u => u.investmentId === itemId);

            investmentHistories[itemId] = itemUpdates.map(update => ({
                _id: update._id?.toString?.() ?? '',
                investmentId: update.investmentId,
                value: update.value || 0,
                note: update.note || '',
                date: update.date ? new Date(update.date).toISOString() : new Date().toISOString(),
                userId: update.userId || '',
            }));
        });
    }

    return investmentHistories;
}

// Helper function to process currency items with account breakdowns
function processCurrencyItems(items: DbItem[], accountItems: DbItem[]): DbItem[] {
    return items.map((item) => {
        if (item.type === "currency") {
            const accounts = accountItems.filter((acc) => acc.currency === item.currency);
            const sum = accounts.reduce((acc, curr) => acc + Number(curr.balance || 0), 0);
            const accountBreakdown = accounts
                .map(acc => ({
                    id: acc._id,
                    name: acc.name || '',
                    balance: Number(acc.balance || 0),
                }))
                .sort((a, b) => b.balance - a.balance); // Sort by balance descending (highest first)
            return { ...item, value: sum, accountBreakdown };
        }
        return item;
    });
}

// Helper function to attach debt payment statuses to items
function attachDebtPaymentStatuses(items: DbItem[], debtPaymentStatuses: Record<string, PaymentStatusInfo>): DbItem[] {
    return items.map((item) => {
        if (item.type === "debt") {
            const paymentStatus = debtPaymentStatuses[item._id] || {
                totalPaid: 0,
                remainingAmount: item.amount || 0,
                paymentStatus: 'unpaid' as const,
                transactionCount: 0,
            };
            return { ...item, ...paymentStatus };
        }
        return item;
    });
}

// Helper function to attach investment value histories
function attachInvestmentValueHistories(items: DbItem[], investmentHistories: Record<string, InvestmentValueUpdate[]>): DbItem[] {
    return items.map((item) => {
        if (item.type === "investment") {
            const valueHistory = investmentHistories[item._id] || [];

            // Calculate current value and gain/loss information
            const initialValue = item.initialValue || 0;
            const currentValue = item.currentValue || initialValue;
            const totalGainLoss = currentValue - initialValue;
            const gainLossPercentage = initialValue > 0 ? (totalGainLoss / initialValue) * 100 : 0;

            return {
                ...item,
                valueHistory,
                currentValue,
                totalGainLoss,
                gainLossPercentage
            };
        }
        return item;
    });
}

// Helper function to process archived items
function processArchivedItems(archivedItems: DbItem[], debtPaymentStatuses: Record<string, PaymentStatusInfo>, investmentHistories: Record<string, InvestmentValueUpdate[]>): DbItem[] {
    let processedItems = attachDebtPaymentStatuses(archivedItems, debtPaymentStatuses);
    processedItems = attachInvestmentValueHistories(processedItems, investmentHistories);
    return processedItems;
}