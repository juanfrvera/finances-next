"use server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import type { InvestmentValueUpdate } from "@/lib/types";
import { requireAuth } from "./auth";

export async function addInvestmentValueUpdate(investmentId: string, value: number, note?: string, date?: string): Promise<InvestmentValueUpdate> {
    if (!investmentId) throw new Error("Missing investmentId for value update");
    const user = await requireAuth();
    const db = await getDb();
    const updateDate = date || new Date().toISOString();

    // Insert the value update as a transaction
    const result = await db.collection("transactions").insertOne({
        itemId: investmentId, // Store as string
        type: 'investment_value_update',
        amount: value,
        note: note || "",
        date: updateDate,
        userId: user.id,
    });

    // Update the investment's current value and editDate
    const investmentObjectId = typeof investmentId === "string" ? ObjectId.createFromHexString(investmentId) : investmentId;
    
    await db.collection("items").updateOne(
        { _id: investmentObjectId, userId: user.id, type: 'investment' },
        {
            $set: {
                currentValue: value,
                editDate: updateDate
            }
        }
    );

    const inserted = await db.collection("transactions").findOne({ _id: result.insertedId }) as { _id: ObjectId; itemId: string; type: string; amount: number; note: string; date: string; userId: string } | null;
    if (!inserted) throw new Error("Failed to retrieve inserted value update");

    return {
        _id: inserted._id.toString(),
        investmentId: inserted.itemId,
        value: inserted.amount,
        note: inserted.note,
        date: inserted.date,
        userId: inserted.userId,
    };
}

export async function getInvestmentValueHistory(investmentId: string): Promise<InvestmentValueUpdate[]> {
    if (!investmentId) throw new Error("Missing investmentId for value history");
    const user = await requireAuth();
    const db = await getDb();

    const updates = await db.collection("transactions")
        .find({ 
            itemId: investmentId, 
            userId: user.id, 
            type: 'investment_value_update' 
        })
        .sort({ date: 1 }) // Sort by date ascending
        .toArray();

    return updates.map(update => ({
        _id: update._id.toString(),
        investmentId: update.itemId,
        value: update.amount,
        note: update.note,
        date: update.date,
        userId: update.userId,
    }));
}

export async function deleteInvestmentValueUpdate(updateId: string): Promise<void> {
    if (!updateId) throw new Error("Missing updateId for deletion");
    const user = await requireAuth();
    const db = await getDb();
    const _id = typeof updateId === "string" ? ObjectId.createFromHexString(updateId) : updateId;

    // Get the update to find the investment
    const update = await db.collection("transactions").findOne({ 
        _id, 
        userId: user.id, 
        type: 'investment_value_update' 
    });
    if (!update) throw new Error("Value update not found");

    // Delete the update
    await db.collection("transactions").deleteOne({ 
        _id, 
        userId: user.id, 
        type: 'investment_value_update' 
    });

    // Recalculate the current value from remaining updates
    const remainingUpdates = await db.collection("transactions")
        .find({ 
            itemId: update.itemId, 
            userId: user.id, 
            type: 'investment_value_update' 
        })
        .sort({ date: -1 }) // Sort by date descending to get the latest
        .limit(1)
        .toArray();

    // Get the investment to get initial value as fallback
    const investmentObjectId = ObjectId.createFromHexString(update.itemId);
    const investment = await db.collection("items").findOne({ _id: investmentObjectId, userId: user.id });
    
    if (investment) {
        const newCurrentValue = remainingUpdates.length > 0 
            ? remainingUpdates[0].amount 
            : investment.initialValue;

        await db.collection("items").updateOne(
            { _id: investmentObjectId, userId: user.id },
            {
                $set: {
                    currentValue: newCurrentValue,
                    editDate: new Date().toISOString()
                }
            }
        );
    }
}

export async function finishInvestment(investmentId: string): Promise<void> {
    if (!investmentId) throw new Error("Missing investmentId");
    const user = await requireAuth();
    const db = await getDb();
    const _id = typeof investmentId === "string" ? ObjectId.createFromHexString(investmentId) : investmentId;

    await db.collection("items").updateOne(
        { _id, userId: user.id, type: 'investment' },
        {
            $set: {
                isFinished: true,
                editDate: new Date().toISOString()
            }
        }
    );
}

export async function unfinishInvestment(investmentId: string): Promise<void> {
    if (!investmentId) throw new Error("Missing investmentId");
    const user = await requireAuth();
    const db = await getDb();
    const _id = typeof investmentId === "string" ? ObjectId.createFromHexString(investmentId) : investmentId;

    await db.collection("items").updateOne(
        { _id, userId: user.id, type: 'investment' },
        {
            $set: {
                isFinished: false,
                editDate: new Date().toISOString()
            }
        }
    );
}
