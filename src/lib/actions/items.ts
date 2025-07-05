"use server";
import { getDb } from "@/lib/db";
import { ObjectId, MongoClient } from "mongodb";
import { requireAuth } from "./auth";

export async function addItemToDb(item: any) {
    const user = await requireAuth();
    const now = new Date().toISOString();
    const db = await getDb();
    const result = await db.collection("items").insertOne({
        ...item,
        userId: user.id,
        createDate: now,
        editDate: now,
    });
    // Fetch the inserted item with all fields
    const inserted = await db.collection("items").findOne({ _id: result.insertedId, userId: user.id });
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
    const user = await requireAuth();
    const db = await getDb();
    const _id = typeof item._id === "string" ? ObjectId.createFromHexString(item._id) : item._id;
    const editDate = new Date().toISOString();
    // Exclude _id from the update payload to avoid attempting to overwrite it
    const { _id: _, ...updateFields } = item;
    await db.collection("items").updateOne({ _id, userId: user.id }, { $set: { ...updateFields, editDate } });
    const updated = await db.collection("items").findOne({ _id, userId: user.id });
    if (!updated) return null;

    return {
        ...updated,
        _id: updated._id?.toString?.() ?? undefined,
        createDate: updated.createDate ? new Date(updated.createDate).toISOString() : undefined,
        editDate: updated.editDate ? new Date(updated.editDate).toISOString() : undefined,
    };
}

export async function deleteItemFromDb(id: string) {
    const user = await requireAuth();
    const db = await getDb();
    const _id = typeof id === "string" ? ObjectId.createFromHexString(id) : id;

    // First get the item to check its type
    const item = await db.collection("items").findOne({ _id, userId: user.id });
    if (!item) {
        return true; // Item doesn't exist, consider it deleted
    }

    // Check if this item type involves transactions (but exclude currency items)
    const hasTransactions = item.type === 'debt' || item.type === 'account';
    const isCurrencyItem = item.type === 'currency';

    if (hasTransactions && !isCurrencyItem) {
        // Use a transaction to ensure data consistency
        // Get a new client connection for the transaction
        const url = process.env.DB_URL!;
        const client = new MongoClient(url);

        try {
            await client.connect();
            const transactionDb = client.db(process.env.DB_NAME!);
            const session = client.startSession();

            await session.withTransaction(async () => {
                // Delete all transactions associated with this item
                await transactionDb.collection("transactions").deleteMany(
                    { itemId: id },
                    { session }
                );

                // Delete the item itself
                await transactionDb.collection("items").deleteOne(
                    { _id, userId: user.id },
                    { session }
                );
            });

            await session.endSession();
        } finally {
            await client.close();
        }
    } else {
        // For items without transactions, just delete the item
        await db.collection("items").deleteOne({ _id, userId: user.id });
    }

    return true;
}

export async function archiveItem(id: string) {
    const user = await requireAuth();
    const db = await getDb();
    const _id = typeof id === "string" ? ObjectId.createFromHexString(id) : id;
    const editDate = new Date().toISOString();

    await db.collection("items").updateOne(
        { _id, userId: user.id },
        { $set: { archived: true, editDate } }
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

export async function unarchiveItem(id: string) {
    const user = await requireAuth();
    const db = await getDb();
    const _id = typeof id === "string" ? ObjectId.createFromHexString(id) : id;
    const editDate = new Date().toISOString();

    await db.collection("items").updateOne(
        { _id, userId: user.id },
        { $set: { archived: false, editDate } }
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
