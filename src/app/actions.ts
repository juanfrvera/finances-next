"use server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import type { Transaction } from "@/lib/types";

export async function addItemToDb(item: any) {
    const now = new Date().toISOString();
    const db = await getDb();
    const result = await db.collection("items").insertOne({
        ...item,
        userId: process.env.TEST_USER_ID,
        createDate: now,
        editDate: now,
    });
    // Fetch the inserted item with all fields
    const inserted = await db.collection("items").findOne({ _id: result.insertedId, userId: process.env.TEST_USER_ID });
    if (!inserted) return null;
    // Convert _id and dates to string
    return {
        ...inserted,
        _id: inserted._id?.toString?.() ?? undefined,
        createDate: inserted.createDate ? new Date(inserted.createDate).toISOString() : undefined,
        editDate: inserted.editDate ? new Date(inserted.editDate).toISOString() : undefined,
    };
}

export async function updateItemToDb(item: any) {
    if (!item._id) throw new Error("Missing _id for update");
    const db = await getDb();
    const _id = typeof item._id === "string" ? ObjectId.createFromHexString(item._id) : item._id;
    const editDate = new Date().toISOString();
    // Exclude _id from the update payload to avoid attempting to overwrite it
    const { _id: _, ...updateFields } = item;
    await db.collection("items").updateOne({ _id, userId: process.env.TEST_USER_ID }, { $set: { ...updateFields, editDate } });
    const updated = await db.collection("items").findOne({ _id, userId: process.env.TEST_USER_ID });
    if (!updated) return null;

    return {
        ...updated,
        _id: updated._id?.toString?.() ?? undefined,
        createDate: updated.createDate ? new Date(updated.createDate).toISOString() : undefined,
        editDate: updated.editDate ? new Date(updated.editDate).toISOString() : undefined,
    };
}

export async function deleteItemFromDb(id: string) {
    const db = await getDb();
    const _id = typeof id === "string" ? ObjectId.createFromHexString(id) : id;

    await db.collection("items").deleteOne({ _id, userId: process.env.TEST_USER_ID });

    return true;
}

export async function updateAccountBalance(itemId: string, newBalance: number, note?: string) {
    if (!itemId) throw new Error("Missing itemId for balance update");
    const db = await getDb();
    const _id = typeof itemId === "string" ? ObjectId.createFromHexString(itemId) : itemId;
    const editDate = new Date().toISOString();

    // Get the current account to calculate the difference
    const currentAccount = await db.collection("items").findOne({ _id, userId: process.env.TEST_USER_ID });
    if (!currentAccount) throw new Error("Account not found");

    const currentBalance = currentAccount.balance || 0;
    const difference = newBalance - currentBalance;

    // Create a transaction record if there's a difference
    if (difference !== 0) {
        await db.collection("transactions").insertOne({
            itemId: itemId, // Store as string instead of ObjectId
            amount: difference,
            note: note || "Balance adjustment",
            date: editDate,
        });
    }

    // Update the balance and editDate
    await db.collection("items").updateOne(
        { _id, userId: process.env.TEST_USER_ID },
        {
            $set: {
                balance: newBalance,
                editDate
            }
        }
    );

    const updated = await db.collection("items").findOne({ _id, userId: process.env.TEST_USER_ID });
    if (!updated) return null;

    return {
        ...updated,
        _id: updated._id?.toString?.() ?? undefined,
        createDate: updated.createDate ? new Date(updated.createDate).toISOString() : undefined,
        editDate: updated.editDate ? new Date(updated.editDate).toISOString() : undefined,
    };
}

// Transaction-related actions
export async function createTransaction(itemId: string, amount: number, note?: string): Promise<Transaction> {
    if (!itemId) throw new Error("Missing itemId for transaction");
    const db = await getDb();
    const now = new Date().toISOString();

    const itemObjectId = typeof itemId === "string" ? ObjectId.createFromHexString(itemId) : itemId;

    // Insert the transaction
    const result = await db.collection("transactions").insertOne({
        itemId: itemId, // Store as string instead of ObjectId
        amount,
        note: note || "",
        date: now,
    });

    // Update the account balance
    const account = await db.collection("items").findOne({ _id: itemObjectId, userId: process.env.TEST_USER_ID });
    if (!account) throw new Error("Account not found");

    const newBalance = (account.balance || 0) + amount;

    // Update account balance and editDate
    await db.collection("items").updateOne(
        { _id: itemObjectId, userId: process.env.TEST_USER_ID },
        {
            $set: {
                balance: newBalance,
                editDate: now
            }
        }
    );

    const inserted = await db.collection("transactions").findOne({ _id: result.insertedId }) as { _id: ObjectId; itemId: string; amount: number; note: string; date: string } | null;
    if (!inserted) throw new Error("Failed to retrieve inserted transaction");

    return {
        _id: inserted._id.toString(),
        itemId: inserted.itemId,
        amount: inserted.amount,
        note: inserted.note,
        date: inserted.date,
    };
}

export async function getTransactions(itemId: string): Promise<Transaction[]> {
    if (!itemId) throw new Error("Missing itemId for transactions");
    const db = await getDb();

    // First verify that the item belongs to the current user
    const itemObjectId = typeof itemId === "string" ? ObjectId.createFromHexString(itemId) : itemId;
    const item = await db.collection("items").findOne({ _id: itemObjectId, userId: process.env.TEST_USER_ID });
    if (!item) throw new Error("Item not found or access denied");

    const transactions = await db.collection("transactions")
        .find({ itemId: itemId }) // Query by string itemId instead of ObjectId
        .sort({ date: -1 }) // Newest first
        .toArray() as Array<{ _id: ObjectId; itemId: string; amount: number; note: string; date: string }>;

    return transactions.map((transaction): Transaction => ({
        _id: transaction._id.toString(),
        itemId: transaction.itemId,
        amount: transaction.amount,
        note: transaction.note,
        date: transaction.date,
    }));
}

export async function deleteTransaction(transactionId: string): Promise<boolean> {
    if (!transactionId) throw new Error("Missing transactionId for deletion");
    const db = await getDb();
    const _id = typeof transactionId === "string" ? ObjectId.createFromHexString(transactionId) : transactionId;

    // Get the transaction to reverse its amount
    const transaction = await db.collection("transactions").findOne({ _id }) as { _id: ObjectId; itemId: string; amount: number; note: string; date: string } | null;
    if (!transaction) throw new Error("Transaction not found");

    // Verify that the transaction's item belongs to the current user
    const transactionItemObjectId = typeof transaction.itemId === "string" ? ObjectId.createFromHexString(transaction.itemId) : transaction.itemId;
    const item = await db.collection("items").findOne({ _id: transactionItemObjectId, userId: process.env.TEST_USER_ID });
    if (!item) throw new Error("Transaction not found or access denied");

    // Delete the transaction
    await db.collection("transactions").deleteOne({ _id });

    // Update account balance by reversing the transaction
    const itemObjectId = typeof transaction.itemId === "string" ? ObjectId.createFromHexString(transaction.itemId) : transaction.itemId;
    const account = await db.collection("items").findOne({ _id: itemObjectId, userId: process.env.TEST_USER_ID });
    if (!account) throw new Error("Account not found");

    const newBalance = (account.balance || 0) - transaction.amount;
    const editDate = new Date().toISOString();

    await db.collection("items").updateOne(
        { _id: itemObjectId, userId: process.env.TEST_USER_ID },
        {
            $set: {
                balance: newBalance,
                editDate
            }
        }
    );

    return true;
}

// Currency evolution data types
interface CurrencyEvolutionDataPoint {
    date: string;
    value: number;
    topAccounts: Array<{ name: string; balance: number }>;
}

// Helper function to get currency evolution data (not cached)
async function getCurrencyEvolutionDataInternal(currency: string): Promise<CurrencyEvolutionDataPoint[]> {
    const db = await getDb();

    // Get all accounts for this currency
    const accounts = await db.collection("items")
        .find({ type: "account", currency: currency, userId: process.env.TEST_USER_ID })
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
    return getCurrencyEvolutionDataInternal(currency);
}

export async function archiveItem(id: string) {
    const db = await getDb();
    const _id = typeof id === "string" ? ObjectId.createFromHexString(id) : id;
    const editDate = new Date().toISOString();

    await db.collection("items").updateOne(
        { _id, userId: process.env.TEST_USER_ID },
        { $set: { archived: true, editDate } }
    );

    const updated = await db.collection("items").findOne({ _id, userId: process.env.TEST_USER_ID });
    if (!updated) return null;

    return {
        ...updated,
        _id: updated._id?.toString?.() ?? undefined,
        createDate: updated.createDate ? new Date(updated.createDate).toISOString() : undefined,
        editDate: updated.editDate ? new Date(updated.editDate).toISOString() : undefined,
    };
}

export async function unarchiveItem(id: string) {
    const db = await getDb();
    const _id = typeof id === "string" ? ObjectId.createFromHexString(id) : id;
    const editDate = new Date().toISOString();

    await db.collection("items").updateOne(
        { _id, userId: process.env.TEST_USER_ID },
        { $set: { archived: false, editDate } }
    );

    const updated = await db.collection("items").findOne({ _id, userId: process.env.TEST_USER_ID });
    if (!updated) return null;

    return {
        ...updated,
        _id: updated._id?.toString?.() ?? undefined,
        createDate: updated.createDate ? new Date(updated.createDate).toISOString() : undefined,
        editDate: updated.editDate ? new Date(updated.editDate).toISOString() : undefined,
    };
}

export async function getDebtPaymentStatus(itemId: string): Promise<{
    totalPaid: number;
    remainingAmount: number;
    paymentStatus: 'paid' | 'partially_paid' | 'unpaid';
    transactionCount: number;
}> {
    if (!itemId) throw new Error("Missing itemId for debt payment status");
    const db = await getDb();

    // First verify that the item is a debt and belongs to the current user
    const itemObjectId = typeof itemId === "string" ? ObjectId.createFromHexString(itemId) : itemId;
    const item = await db.collection("items").findOne({ _id: itemObjectId, userId: process.env.TEST_USER_ID, type: 'debt' });
    if (!item) throw new Error("Debt item not found or access denied");

    const debtAmount = item.amount || 0;

    // Get all transactions for this debt item
    const transactions = await db.collection("transactions")
        .find({ itemId: itemId }) // Query by string itemId
        .toArray() as Array<{ _id: ObjectId; itemId: string; amount: number; note: string; date: string }>;

    // Calculate total payments (sum of all transaction amounts)
    const totalPaid = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
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

    return {
        totalPaid,
        remainingAmount: Math.max(0, remainingAmount), // Don't show negative remaining
        paymentStatus,
        transactionCount: transactions.length,
    };
}

export async function createDebtPayment(debtId: string, amount: number, note?: string): Promise<{ _id: string; itemId: string; amount: number; note: string; date: string }> {
    if (!debtId) throw new Error("Missing debtId for payment");
    const db = await getDb();
    const now = new Date().toISOString();

    const debtObjectId = typeof debtId === "string" ? ObjectId.createFromHexString(debtId) : debtId;

    // Verify that the item is a debt and belongs to the current user
    const debt = await db.collection("items").findOne({ _id: debtObjectId, userId: process.env.TEST_USER_ID, type: 'debt' });
    if (!debt) throw new Error("Debt item not found or access denied");

    // Insert the payment transaction
    const result = await db.collection("transactions").insertOne({
        itemId: debtId, // Store as string
        amount: amount,
        note: note || "Debt payment",
        date: now,
    });

    // Update the debt's editDate to reflect the payment
    await db.collection("items").updateOne(
        { _id: debtObjectId, userId: process.env.TEST_USER_ID },
        {
            $set: {
                editDate: now
            }
        }
    );

    const inserted = await db.collection("transactions").findOne({ _id: result.insertedId }) as { _id: ObjectId; itemId: string; amount: number; note: string; date: string } | null;
    if (!inserted) throw new Error("Failed to retrieve inserted payment transaction");

    return {
        _id: inserted._id.toString(),
        itemId: inserted.itemId,
        amount: inserted.amount,
        note: inserted.note,
        date: inserted.date,
    };
}
