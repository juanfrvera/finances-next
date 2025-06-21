"use server";
import { getDb } from "@/lib/db";

export async function addItemToDb(item: any) {
  const db = await getDb();
  await db.collection("items").insertOne(item);
  // Optionally return the inserted item or id
  return { success: true };
}
