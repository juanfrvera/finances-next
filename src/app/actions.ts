"use server";
import { getDb } from "@/lib/db";

export async function addItemToDb(item: any) {
    const now = new Date().toISOString();
    const db = await getDb();
    await db.collection("items").insertOne({
        ...item,
        createDate: now,
        editDate: now,
    });
    // Optionally return the inserted item or id
    return { success: true };
}
