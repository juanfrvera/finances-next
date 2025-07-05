"use server";
import { getDb } from "@/lib/db";
import { requireAuth } from "./auth";

// Currency evolution data types
interface CurrencyEvolutionDataPoint {
    date: string;
    value: number;
    topAccounts: Array<{ name: string; balance: number }>;
}

// Helper function to get currency evolution data (not cached)
async function getCurrencyEvolutionDataInternal(currency: string, userId: string): Promise<CurrencyEvolutionDataPoint[]> {
    const db = await getDb();

    // Get all accounts for this currency
    const accounts = await db.collection("items")
        .find({ type: "account", currency: currency, userId: userId })
        .toArray();

    if (accounts.length === 0) {
        return [];
    }

    // Get all transactions for these accounts
    const accountIds = accounts.map(acc => acc._id.toString());
    const transactions = await db.collection("transactions")
        .find({ itemId: { $in: accountIds } })
        .sort({ date: 1 }) // Oldest first for calculations
        .toArray();

    // Build evolution data
    const evolutionData: CurrencyEvolutionDataPoint[] = [];
    const accountBalances = new Map<string, number>();

    // Initialize account balances to 0
    accounts.forEach(acc => {
        accountBalances.set(acc._id.toString(), 0);
    });

    // Group transactions by date
    const transactionsByDate = new Map<string, any[]>();
    transactions.forEach(transaction => {
        const dateKey = new Date(transaction.date).toDateString();
        if (!transactionsByDate.has(dateKey)) {
            transactionsByDate.set(dateKey, []);
        }
        transactionsByDate.get(dateKey)!.push(transaction);
    });

    // Process transactions chronologically
    const sortedDates = Array.from(transactionsByDate.keys()).sort((a, b) =>
        new Date(a).getTime() - new Date(b).getTime()
    );

    sortedDates.forEach(dateKey => {
        const dayTransactions = transactionsByDate.get(dateKey)!;

        // Apply all transactions for this day
        dayTransactions.forEach(transaction => {
            const currentBalance = accountBalances.get(transaction.itemId) || 0;
            accountBalances.set(transaction.itemId, currentBalance + transaction.amount);
        });

        // Calculate total value and get top 3 accounts
        const accountEntries = Array.from(accountBalances.entries())
            .map(([accountId, balance]) => {
                const account = accounts.find(acc => acc._id.toString() === accountId);
                return {
                    name: account?.name || 'Unknown',
                    balance: balance
                };
            })
            .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
            .slice(0, 3);

        const totalValue = Array.from(accountBalances.values()).reduce((sum, balance) => sum + balance, 0);

        evolutionData.push({
            date: new Date(dateKey).toISOString().split('T')[0], // YYYY-MM-DD format
            value: Math.round(totalValue * 100) / 100, // Round to 2 decimals
            topAccounts: accountEntries
        });
    });

    // Always add current date as the last data point to show current state
    const today = new Date().toISOString().split('T')[0];
    const lastDataPoint = evolutionData[evolutionData.length - 1];

    // Only add today's data point if it's not already the last one
    if (!lastDataPoint || lastDataPoint.date !== today) {
        // Use actual current balances from the database instead of calculated balances
        const currentAccountEntries = accounts
            .map(account => ({
                name: account.name || 'Unknown',
                balance: account.balance || 0
            }))
            .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
            .slice(0, 3);

        const currentTotalValue = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);

        evolutionData.push({
            date: today,
            value: Math.round(currentTotalValue * 100) / 100, // Round to 2 decimals
            topAccounts: currentAccountEntries
        });
    }

    // Limit to last 30 data points for performance
    return evolutionData.slice(-30);
}

// Get currency evolution data (no server-side caching)
export async function getCurrencyEvolutionData(currency: string): Promise<CurrencyEvolutionDataPoint[]> {
    const user = await requireAuth();
    return getCurrencyEvolutionDataInternal(currency, user.id);
}
