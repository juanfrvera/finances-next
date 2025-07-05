"use server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import type { Transaction } from "@/lib/types";
import { requireAuth } from "./auth";

export async function updateAccountBalance(itemId: string, newBalance: number, note?: string) {
    if (!itemId) throw new Error("Missing itemId for balance update");
    const user = await requireAuth();
    const db = await getDb();
    const _id = typeof itemId === "string" ? ObjectId.createFromHexString(itemId) : itemId;
    const editDate = new Date().toISOString();

    // Get the current account to calculate the difference
    const currentAccount = await db.collection("items").findOne({ _id, userId: user.id });
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
        { _id, userId: user.id },
        {
            $set: {
                balance: newBalance,
                editDate
            }
        }
    );

    const updated = await db.collection("items").findOne({ _id, userId: user.id });
    if (!updated) return null;

    return {
        ...updated,
        _id: updated._id?.toString?.() ?? undefined,
        createDate: updated.createDate ? new Date(updated.createDate).toISOString() : undefined,
        editDate: updated.editDate ? new Date(updated.editDate).toISOString() : undefined,
    };
}

export async function createTransaction(itemId: string, amount: number, note?: string): Promise<Transaction> {
    if (!itemId) throw new Error("Missing itemId for transaction");
    const user = await requireAuth();
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
    const account = await db.collection("items").findOne({ _id: itemObjectId, userId: user.id });
    if (!account) throw new Error("Account not found");

    const newBalance = (account.balance || 0) + amount;

    // Update account balance and editDate
    await db.collection("items").updateOne(
        { _id: itemObjectId, userId: user.id },
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
    const user = await requireAuth();
    const db = await getDb();

    // First verify that the item belongs to the current user
    const itemObjectId = typeof itemId === "string" ? ObjectId.createFromHexString(itemId) : itemId;
    const item = await db.collection("items").findOne({ _id: itemObjectId, userId: user.id });
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
    const user = await requireAuth();
    const db = await getDb();
    const _id = typeof transactionId === "string" ? ObjectId.createFromHexString(transactionId) : transactionId;

    // Get the transaction to reverse its amount
    const transaction = await db.collection("transactions").findOne({ _id }) as { _id: ObjectId; itemId: string; amount: number; note: string; date: string } | null;
    if (!transaction) throw new Error("Transaction not found");

    // Verify that the transaction's item belongs to the current user
    const transactionItemObjectId = typeof transaction.itemId === "string" ? ObjectId.createFromHexString(transaction.itemId) : transaction.itemId;
    const item = await db.collection("items").findOne({ _id: transactionItemObjectId, userId: user.id });
    if (!item) throw new Error("Transaction not found or access denied");

    // Delete the transaction
    await db.collection("transactions").deleteOne({ _id });

    // Update account balance by reversing the transaction
    const itemObjectId = typeof transaction.itemId === "string" ? ObjectId.createFromHexString(transaction.itemId) : transaction.itemId;
    const account = await db.collection("items").findOne({ _id: itemObjectId, userId: user.id });
    if (!account) throw new Error("Account not found");

    const newBalance = (account.balance || 0) - transaction.amount;
    const editDate = new Date().toISOString();

    await db.collection("items").updateOne(
        { _id: itemObjectId, userId: user.id },
        {
            $set: {
                balance: newBalance,
                editDate
            }
        }
    );

    return true;
}

export async function getDebtPaymentStatus(itemId: string): Promise<{
    totalPaid: number;
    remainingAmount: number;
    paymentStatus: 'paid' | 'partially_paid' | 'unpaid';
    transactionCount: number;
}> {
    if (!itemId) throw new Error("Missing itemId for debt payment status");
    const user = await requireAuth();
    const db = await getDb();

    // First verify that the item is a debt and belongs to the current user
    const itemObjectId = typeof itemId === "string" ? ObjectId.createFromHexString(itemId) : itemId;
    const item = await db.collection("items").findOne({ _id: itemObjectId, userId: user.id, type: 'debt' });
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
    const user = await requireAuth();
    const db = await getDb();
    const now = new Date().toISOString();

    const debtObjectId = typeof debtId === "string" ? ObjectId.createFromHexString(debtId) : debtId;

    // Verify that the item is a debt and belongs to the current user
    const debt = await db.collection("items").findOne({ _id: debtObjectId, userId: user.id, type: 'debt' });
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
        { _id: debtObjectId, userId: user.id },
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
