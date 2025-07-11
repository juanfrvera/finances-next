// MongoDB Playground - Migration Script for Finances App
// This script migrates existing items to use the new entity system
// Run this against your finances-staging database

use('finances-staging');

// Get the user ID you want to migrate (replace with actual user ID)
const USER_ID = 'your_user_id_here'; // Replace with actual user ID from your database

print('Starting migration for user:', USER_ID);

// 1. Create currencies collection from existing currency strings in items
print('\n=== Creating Currencies ===');
const currencies = db.items.distinct('currency', { userId: USER_ID });
print('Found currencies:', currencies);

currencies.forEach(currencyName => {
  if (currencyName) {
    const result = db.currencies.updateOne(
      { name: currencyName, userId: USER_ID },
      { 
        $setOnInsert: {
          name: currencyName,
          userId: USER_ID,
          createDate: new Date().toISOString(),
          editDate: new Date().toISOString()
        }
      },
      { upsert: true }
    );
    
    if (result.upsertedCount > 0) {
      print(`✓ Created currency: ${currencyName}`);
    } else {
      print(`- Currency already exists: ${currencyName}`);
    }
  }
});

// 2. Create persons collection from existing withWho strings in debt items
print('\n=== Creating Persons ===');
const persons = db.items.distinct('withWho', { userId: USER_ID, type: 'debt' });
print('Found persons:', persons);

persons.forEach(personName => {
  if (personName) {
    const result = db.persons.updateOne(
      { name: personName, userId: USER_ID },
      { 
        $setOnInsert: {
          name: personName,
          userId: USER_ID,
          createDate: new Date().toISOString(),
          editDate: new Date().toISOString()
        }
      },
      { upsert: true }
    );
    
    if (result.upsertedCount > 0) {
      print(`✓ Created person: ${personName}`);
    } else {
      print(`- Person already exists: ${personName}`);
    }
  }
});

// 3. Update items to include entity IDs
print('\n=== Updating Items with Entity IDs ===');
let itemsUpdated = 0;
let itemsProcessed = 0;

db.items.find({ userId: USER_ID }).forEach(item => {
  itemsProcessed++;
  let updates = {};
  
  // Add currency ID if currency exists but currencyId doesn't
  if (item.currency && !item.currencyId) {
    const currency = db.currencies.findOne({ name: item.currency, userId: USER_ID });
    if (currency) {
      updates.currencyId = currency._id;
    }
  }
  
  // Add person ID if it's a debt item with withWho but no personId
  if (item.type === 'debt' && item.withWho && !item.personId) {
    const person = db.persons.findOne({ name: item.withWho, userId: USER_ID });
    if (person) {
      updates.personId = person._id;
    }
  }
  
  // Update the item if we have changes
  if (Object.keys(updates).length > 0) {
    db.items.updateOne(
      { _id: item._id },
      { $set: { ...updates, editDate: new Date().toISOString() } }
    );
    itemsUpdated++;
    print(`✓ Updated item: ${item._id} (${item.type})`);
  }
});

// 4. Summary
print('\n=== Migration Summary ===');
print(`Processed ${itemsProcessed} items for user ${USER_ID}`);
print(`Updated ${itemsUpdated} items with entity IDs`);
print(`Total currencies created: ${db.currencies.countDocuments({ userId: USER_ID })}`);
print(`Total persons created: ${db.persons.countDocuments({ userId: USER_ID })}`);

// 5. Verification queries
print('\n=== Verification ===');
print('Items without currencyId but with currency:');
db.items.find({ 
  userId: USER_ID, 
  currency: { $exists: true, $ne: null }, 
  currencyId: { $exists: false } 
}, { _id: 1, type: 1, currency: 1 }).forEach(item => {
  print(`- ${item._id}: ${item.type} (${item.currency})`);
});

print('\nDebt items without personId but with withWho:');
db.items.find({ 
  userId: USER_ID, 
  type: 'debt',
  withWho: { $exists: true, $ne: null }, 
  personId: { $exists: false } 
}, { _id: 1, withWho: 1 }).forEach(item => {
  print(`- ${item._id}: ${item.withWho}`);
});

print('\n=== Migration Complete ===');