"use server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function addItemToDb(item: any) {
    const now = new Date().toISOString();
    const db = await getDb();
    const result = await db.collection("items").insertOne({
        ...item,
        createDate: now,
        editDate: now,
    });
    // Fetch the inserted item with all fields
    const inserted = await db.collection("items").findOne({ _id: result.insertedId });
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
    const { _id: _omit, ...updateFields } = item;
    await db.collection("items").updateOne({ _id }, { $set: { ...updateFields, editDate } });
    const updated = await db.collection("items").findOne({ _id });
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
    await db.collection("items").deleteOne({ _id });
    return true;
}

export async function updateAccountBalance(itemId: string, newBalance: number, note?: string) {
    if (!itemId) throw new Error("Missing itemId for balance update");
    const db = await getDb();
    const _id = typeof itemId === "string" ? ObjectId.createFromHexString(itemId) : itemId;
    const editDate = new Date().toISOString();

    // Get the current account to calculate the difference
    const currentAccount = await db.collection("items").findOne({ _id });
    if (!currentAccount) throw new Error("Account not found");

    const currentBalance = currentAccount.balance || 0;
    const difference = newBalance - currentBalance;

    // Create a transaction record if there's a difference
    if (difference !== 0) {
        await db.collection("transactions").insertOne({
            itemId: itemId, // Store as string instead of ObjectId
            amount: difference,
            note: note || "balance update",
            date: editDate,
        });
    }

    // Update the balance and editDate
    await db.collection("items").updateOne(
        { _id },
        {
            $set: {
                balance: newBalance,
                editDate
            }
        }
    );

    const updated = await db.collection("items").findOne({ _id });
    if (!updated) return null;

    return {
        ...updated,
        _id: updated._id?.toString?.() ?? undefined,
        createDate: updated.createDate ? new Date(updated.createDate).toISOString() : undefined,
        editDate: updated.editDate ? new Date(updated.editDate).toISOString() : undefined,
    };
}

// Transaction-related actions
export async function createTransaction(itemId: string, amount: number, note?: string) {
    if (!itemId) throw new Error("Missing itemId for transaction");
    const db = await getDb();
    const now = new Date().toISOString();

    const itemObjectId = typeof itemId === "string" ? ObjectId.createFromHexString(itemId) : itemId;

    // Insert the transaction
    const result = await db.collection("transactions").insertOne({
        itemId: itemId, // Store as string instead of ObjectId
        amount,
        note: note || null,
        date: now,
    });

    // Update the account balance
    const account = await db.collection("items").findOne({ _id: itemObjectId });
    if (!account) throw new Error("Account not found");

    const newBalance = (account.balance || 0) + amount;

    // Update account balance and editDate
    await db.collection("items").updateOne(
        { _id: itemObjectId },
        {
            $set: {
                balance: newBalance,
                editDate: now
            }
        }
    );

    const inserted = await db.collection("transactions").findOne({ _id: result.insertedId });
    if (!inserted) return null;

    return {
        ...inserted,
        _id: inserted._id?.toString?.() ?? undefined,
        itemId: inserted.itemId?.toString?.() ?? undefined,
        date: inserted.date ? new Date(inserted.date).toISOString() : undefined,
    };
}

export async function getTransactions(itemId: string) {
    if (!itemId) throw new Error("Missing itemId for transactions");
    const db = await getDb();

    const transactions = await db.collection("transactions")
        .find({ itemId: itemId }) // Query by string itemId instead of ObjectId
        .sort({ date: -1 }) // Newest first
        .toArray();

    return transactions.map(transaction => ({
        ...transaction,
        _id: transaction._id?.toString?.() ?? undefined,
        itemId: transaction.itemId?.toString?.() ?? undefined,
        date: transaction.date ? new Date(transaction.date).toISOString() : undefined,
    }));
}

export async function deleteTransaction(transactionId: string) {
    if (!transactionId) throw new Error("Missing transactionId for deletion");
    const db = await getDb();
    const _id = typeof transactionId === "string" ? ObjectId.createFromHexString(transactionId) : transactionId;

    // Get the transaction to reverse its amount
    const transaction = await db.collection("transactions").findOne({ _id });
    if (!transaction) throw new Error("Transaction not found");

    // Delete the transaction
    await db.collection("transactions").deleteOne({ _id });

    // Update account balance by reversing the transaction
    const account = await db.collection("items").findOne({ _id: transaction.itemId });
    if (!account) throw new Error("Account not found");

    const newBalance = (account.balance || 0) - transaction.amount;
    const editDate = new Date().toISOString();

    await db.collection("items").updateOne(
        { _id: transaction.itemId },
        {
            $set: {
                balance: newBalance,
                editDate
            }
        }
    );

    return true;
}
