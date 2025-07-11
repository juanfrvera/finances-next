"use server";
import { getDb } from "@/lib/db";
import { requireAuth } from "./auth";
import { CurrencyEntity, PersonEntity } from "@/lib/types";

// Currency entity functions
export async function createCurrency(currencyName: string): Promise<CurrencyEntity | null> {
    const user = await requireAuth();
    const db = await getDb();
    
    // Check if currency already exists for this user
    const existingCurrency = await db.collection("currencies").findOne({
        userId: user.id,
        name: currencyName
    });
    
    if (existingCurrency) {
        return {
            _id: existingCurrency._id?.toString?.() ?? '',
            name: existingCurrency.name,
            userId: existingCurrency.userId,
            createDate: existingCurrency.createDate ? new Date(existingCurrency.createDate).toISOString() : new Date().toISOString(),
            editDate: existingCurrency.editDate ? new Date(existingCurrency.editDate).toISOString() : new Date().toISOString(),
        };
    }
    
    // Create new currency
    const now = new Date().toISOString();
    const result = await db.collection("currencies").insertOne({
        name: currencyName,
        userId: user.id,
        createDate: now,
        editDate: now,
    });
    
    const inserted = await db.collection("currencies").findOne({ _id: result.insertedId, userId: user.id });
    if (!inserted) return null;
    
    return {
        _id: inserted._id?.toString?.() ?? '',
        name: inserted.name,
        userId: inserted.userId,
        createDate: inserted.createDate ? new Date(inserted.createDate).toISOString() : new Date().toISOString(),
        editDate: inserted.editDate ? new Date(inserted.editDate).toISOString() : new Date().toISOString(),
    };
}

export async function getCurrencies(): Promise<CurrencyEntity[]> {
    const user = await requireAuth();
    const db = await getDb();
    
    const currencies = await db.collection("currencies").find({ userId: user.id }).toArray();
    
    return currencies.map(currency => ({
        _id: currency._id?.toString?.() ?? '',
        name: currency.name,
        userId: currency.userId,
        createDate: currency.createDate ? new Date(currency.createDate).toISOString() : new Date().toISOString(),
        editDate: currency.editDate ? new Date(currency.editDate).toISOString() : new Date().toISOString(),
    }));
}

// Person entity functions
export async function createPerson(personName: string): Promise<PersonEntity | null> {
    const user = await requireAuth();
    const db = await getDb();
    
    // Check if person already exists for this user
    const existingPerson = await db.collection("persons").findOne({
        userId: user.id,
        name: personName
    });
    
    if (existingPerson) {
        return {
            _id: existingPerson._id?.toString?.() ?? '',
            name: existingPerson.name,
            userId: existingPerson.userId,
            createDate: existingPerson.createDate ? new Date(existingPerson.createDate).toISOString() : new Date().toISOString(),
            editDate: existingPerson.editDate ? new Date(existingPerson.editDate).toISOString() : new Date().toISOString(),
        };
    }
    
    // Create new person
    const now = new Date().toISOString();
    const result = await db.collection("persons").insertOne({
        name: personName,
        userId: user.id,
        createDate: now,
        editDate: now,
    });
    
    const inserted = await db.collection("persons").findOne({ _id: result.insertedId, userId: user.id });
    if (!inserted) return null;
    
    return {
        _id: inserted._id?.toString?.() ?? '',
        name: inserted.name,
        userId: inserted.userId,
        createDate: inserted.createDate ? new Date(inserted.createDate).toISOString() : new Date().toISOString(),
        editDate: inserted.editDate ? new Date(inserted.editDate).toISOString() : new Date().toISOString(),
    };
}

export async function getPersons(): Promise<PersonEntity[]> {
    const user = await requireAuth();
    const db = await getDb();
    
    const persons = await db.collection("persons").find({ userId: user.id }).toArray();
    
    return persons.map(person => ({
        _id: person._id?.toString?.() ?? '',
        name: person.name,
        userId: person.userId,
        createDate: person.createDate ? new Date(person.createDate).toISOString() : new Date().toISOString(),
        editDate: person.editDate ? new Date(person.editDate).toISOString() : new Date().toISOString(),
    }));
}
