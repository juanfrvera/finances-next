"use server";
import { getDb } from "@/lib/db";
import { ObjectId, MongoClient, Db, ClientSession } from "mongodb";
import { requireAuth } from "./auth";
import { CurrencyEntity, PersonEntity, DbItem, Item } from "@/lib/types";

export async function addItemToDb(item: DbItem): Promise<Item | null> {
    const user = await requireAuth();
    const now = new Date().toISOString();
    
    // Use a transaction to ensure data consistency
    const url = process.env.DB_URL!;
    const client = new MongoClient(url);
    
    try {
        await client.connect();
        const transactionDb = client.db(process.env.DB_NAME!);
        const session = client.startSession();
        
        let result: Item | null = null;
        
        await session.withTransaction(async () => {
            // Handle currency creation if needed
            if (item.currency && typeof item.currency === 'string') {
                const currencyDoc = await createCurrencyInTransaction(transactionDb, session, item.currency, user.id, now);
                if (currencyDoc) {
                    item.currencyId = currencyDoc._id;
                }
            }
            
            // Handle person creation if needed (for debt items)
            if (item.type === 'debt' && item.withWho && typeof item.withWho === 'string') {
                const personDoc = await createPersonInTransaction(transactionDb, session, item.withWho, user.id, now);
                if (personDoc) {
                    item.personId = personDoc._id;
                }
            }
            
            // Create item data without _id for insertion
            const { _id: itemId, ...itemData } = item;
            
            // Insert the item
            const insertResult = await transactionDb.collection("items").insertOne({
                ...itemData,
                userId: user.id,
                createDate: now,
                editDate: now,
            }, { session });
            
            // Fetch the inserted item with all fields
            const inserted = await transactionDb.collection("items").findOne(
                { _id: insertResult.insertedId, userId: user.id },
                { session }
            );
            
            if (inserted) {
                result = {
                    ...inserted,
                    _id: inserted._id?.toString?.() ?? '',
                    createDate: inserted.createDate ? new Date(inserted.createDate).toISOString() : now,
                    editDate: inserted.editDate ? new Date(inserted.editDate).toISOString() : now,
                } as Item;
            }
        });
        
        await session.endSession();
        return result;
    } finally {
        await client.close();
    }
}

// Helper function to create currency within a transaction
async function createCurrencyInTransaction(db: Db, session: ClientSession, currencyName: string, userId: string, now: string): Promise<CurrencyEntity | null> {
    // Check if currency already exists for this user
    const existingCurrency = await db.collection("currencies").findOne({
        userId: userId,
        name: currencyName
    }, { session });
    
    if (existingCurrency) {
        return {
            _id: existingCurrency._id?.toString?.() ?? '',
            name: existingCurrency.name,
            userId: existingCurrency.userId,
            createDate: existingCurrency.createDate ? new Date(existingCurrency.createDate).toISOString() : now,
            editDate: existingCurrency.editDate ? new Date(existingCurrency.editDate).toISOString() : now,
        };
    }
    
    // Create new currency
    const result = await db.collection("currencies").insertOne({
        name: currencyName,
        userId: userId,
        createDate: now,
        editDate: now,
    }, { session });
    
    const inserted = await db.collection("currencies").findOne(
        { _id: result.insertedId, userId: userId },
        { session }
    );
    
    if (!inserted) return null;
    
    return {
        _id: inserted._id?.toString?.() ?? '',
        name: inserted.name,
        userId: inserted.userId,
        createDate: inserted.createDate ? new Date(inserted.createDate).toISOString() : now,
        editDate: inserted.editDate ? new Date(inserted.editDate).toISOString() : now,
    };
}

// Helper function to create person within a transaction
async function createPersonInTransaction(db: Db, session: ClientSession, personName: string, userId: string, now: string): Promise<PersonEntity | null> {
    // Check if person already exists for this user
    const existingPerson = await db.collection("persons").findOne({
        userId: userId,
        name: personName
    }, { session });
    
    if (existingPerson) {
        return {
            _id: existingPerson._id?.toString?.() ?? '',
            name: existingPerson.name,
            userId: existingPerson.userId,
            createDate: existingPerson.createDate ? new Date(existingPerson.createDate).toISOString() : now,
            editDate: existingPerson.editDate ? new Date(existingPerson.editDate).toISOString() : now,
        };
    }
    
    // Create new person
    const result = await db.collection("persons").insertOne({
        name: personName,
        userId: userId,
        createDate: now,
        editDate: now,
    }, { session });
    
    const inserted = await db.collection("persons").findOne(
        { _id: result.insertedId, userId: userId },
        { session }
    );
    
    if (!inserted) return null;
    
    return {
        _id: inserted._id?.toString?.() ?? '',
        name: inserted.name,
        userId: inserted.userId,
        createDate: inserted.createDate ? new Date(inserted.createDate).toISOString() : now,
        editDate: inserted.editDate ? new Date(inserted.editDate).toISOString() : now,
    };
}

export async function updateItemToDb(item: DbItem): Promise<Item | null> {
    if (!item._id) throw new Error("Missing _id for update");
    const user = await requireAuth();
    const editDate = new Date().toISOString();
    const _id = typeof item._id === "string" ? ObjectId.createFromHexString(item._id) : new ObjectId(item._id);
    
    // Use a transaction to ensure data consistency
    const url = process.env.DB_URL!;
    const client = new MongoClient(url);
    
    try {
        await client.connect();
        const transactionDb = client.db(process.env.DB_NAME!);
        const session = client.startSession();
        
        let result: Item | null = null;
        
        await session.withTransaction(async () => {
            // Handle currency creation if needed
            if (item.currency && typeof item.currency === 'string') {
                const currencyDoc = await createCurrencyInTransaction(transactionDb, session, item.currency, user.id, editDate);
                if (currencyDoc) {
                    item.currencyId = currencyDoc._id;
                }
            }
            
            // Handle person creation if needed (for debt items)
            if (item.type === 'debt' && item.withWho && typeof item.withWho === 'string') {
                const personDoc = await createPersonInTransaction(transactionDb, session, item.withWho, user.id, editDate);
                if (personDoc) {
                    item.personId = personDoc._id;
                }
            }
            
            // Exclude _id from the update payload to avoid attempting to overwrite it
            const { _id: itemId, ...updateFields } = item;
            await transactionDb.collection("items").updateOne(
                { _id, userId: user.id },
                { $set: { ...updateFields, editDate } },
                { session }
            );
            
            const updated = await transactionDb.collection("items").findOne(
                { _id, userId: user.id },
                { session }
            );
            
            if (updated) {
                result = {
                    ...updated,
                    _id: updated._id?.toString?.() ?? '',
                    createDate: updated.createDate ? new Date(updated.createDate).toISOString() : editDate,
                    editDate: updated.editDate ? new Date(updated.editDate).toISOString() : editDate,
                } as Item;
            }
        });
        
        await session.endSession();
        return result;
    } finally {
        await client.close();
    }
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

export async function archiveItem(id: string): Promise<Item | null> {
    const user = await requireAuth();
    const db = await getDb();
    const _id = typeof id === "string" ? ObjectId.createFromHexString(id) : new ObjectId(id);
    const editDate = new Date().toISOString();

    await db.collection("items").updateOne(
        { _id, userId: user.id },
        { $set: { archived: true, editDate } }
    );

    const updated = await db.collection("items").findOne({ _id, userId: user.id });
    if (!updated) return null;

    return {
        ...updated,
        _id: updated._id?.toString?.() ?? '',
        createDate: updated.createDate ? new Date(updated.createDate).toISOString() : editDate,
        editDate: updated.editDate ? new Date(updated.editDate).toISOString() : editDate,
    } as Item;
}

export async function unarchiveItem(id: string): Promise<Item | null> {
    const user = await requireAuth();
    const db = await getDb();
    const _id = typeof id === "string" ? ObjectId.createFromHexString(id) : new ObjectId(id);
    const editDate = new Date().toISOString();

    await db.collection("items").updateOne(
        { _id, userId: user.id },
        { $set: { archived: false, editDate } }
    );

    const updated = await db.collection("items").findOne({ _id, userId: user.id });
    if (!updated) return null;

    return {
        ...updated,
        _id: updated._id?.toString?.() ?? '',
        createDate: updated.createDate ? new Date(updated.createDate).toISOString() : editDate,
        editDate: updated.editDate ? new Date(updated.editDate).toISOString() : editDate,
    } as Item;
}
