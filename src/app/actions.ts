"use server";
import { getDb } from "@/lib/db";

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
