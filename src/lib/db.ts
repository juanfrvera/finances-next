import { MongoClient } from "mongodb";

export async function getDb() {
    // Connection URL
    const url = process.env.DB_URL!;
    const client = new MongoClient(url);

    // Database Name
    const dbName = process.env.DB_NAME!;

    // Use connect method to connect to the server
    await client.connect();
    
    return client.db(dbName);
}