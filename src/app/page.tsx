import { getDb } from "@/lib/db";
import { getServerComponentUserId } from "@/lib/actions/auth";
import { getCurrencies, getPersons } from "@/lib/actions/entities";
import { CurrencyEntity, PersonEntity, DbItem, Item, PaymentStatusInfo } from "@/lib/types";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { redirect } from "next/navigation";
import { Db } from "mongodb";

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic';

// Helper function to calculate debt payment statuses
async function calculateDebtPaymentStatuses(db: Db, debtItems: DbItem[]): Promise<Record<string, PaymentStatusInfo>> {
  const debtItemIds = debtItems.map((item) => item._id);
  
  const debtPaymentStatuses: Record<string, PaymentStatusInfo> = {};

  if (debtItemIds.length > 0) {
    const transactions = await db.collection("transactions")
      .find({ itemId: { $in: debtItemIds } })
      .toArray();

    // Calculate payment status for each debt item
    debtItems.forEach(debtItem => {
      const itemId = debtItem._id;
      const debtAmount = debtItem.amount || 0;
      const itemTransactions = transactions.filter(t => t.itemId === itemId);
      const totalPaid = itemTransactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
      const remainingAmount = debtAmount - totalPaid;

      // Determine payment status
      let paymentStatus: 'paid' | 'partially_paid' | 'unpaid';
      if (totalPaid <= 0) {
        paymentStatus = 'unpaid';
      } else if (remainingAmount <= 0) {
        paymentStatus = 'paid';
      } else {
        paymentStatus = 'partially_paid';
      }

      debtPaymentStatuses[itemId] = {
        totalPaid,
        remainingAmount: Math.max(0, remainingAmount),
        paymentStatus,
        transactionCount: itemTransactions.length,
      };
    });
  }

  return debtPaymentStatuses;
}

// Helper function to process currency items with account breakdowns
function processCurrencyItems(items: DbItem[], accountItems: DbItem[]): DbItem[] {
  return items.map((item) => {
    if (item.type === "currency") {
      const accounts = accountItems.filter((acc) => acc.currency === item.currency);
      const sum = accounts.reduce((acc, curr) => acc + Number(curr.balance || 0), 0);
      const accountBreakdown = accounts
        .map(acc => ({
          id: acc._id,
          name: acc.name || '',
          balance: Number(acc.balance || 0),
        }))
        .sort((a, b) => b.balance - a.balance); // Sort by balance descending (highest first)
      return { ...item, value: sum, accountBreakdown };
    }
    return item;
  });
}

// Helper function to attach debt payment statuses to items
function attachDebtPaymentStatuses(items: DbItem[], debtPaymentStatuses: Record<string, PaymentStatusInfo>): DbItem[] {
  return items.map((item) => {
    if (item.type === "debt") {
      const paymentStatus = debtPaymentStatuses[item._id] || {
        totalPaid: 0,
        remainingAmount: item.amount || 0,
        paymentStatus: 'unpaid' as const,
        transactionCount: 0,
      };
      return { ...item, ...paymentStatus };
    }
    return item;
  });
}

// Helper function to process archived items
function processArchivedItems(archivedItems: DbItem[], debtPaymentStatuses: Record<string, PaymentStatusInfo>): DbItem[] {
  return attachDebtPaymentStatuses(archivedItems, debtPaymentStatuses);
}

export default async function Dashboard() {
  const userId = await getServerComponentUserId();
  
  // Use the userId or fallback to TEST_USER_ID if no user found
  const finalUserId = userId || process.env.TEST_USER_ID;
  
  if (!finalUserId) {
    redirect("/login");
  }
  
  const db = await getDb();
  const items = await db.collection("items").find({ userId: finalUserId }).toArray();
  
  // Load currencies and persons from database
  let currencies: CurrencyEntity[] = [];
  let persons: PersonEntity[] = [];
  
  try {
    // These functions require auth, so we need to handle the case where userId is from TEST_USER_ID
    if (userId) {
      currencies = await getCurrencies();
      persons = await getPersons();
    }
  } catch (error) {
    console.log("Could not load currencies and persons:", error);
  }
  
  // Convert to plain objects and _id to string, ensure createDate/editDate are strings
  const plainItems: DbItem[] = items.map((item) => ({
    ...item,
    _id: item._id?.toString?.() ?? '',
    createDate: item.createDate ? new Date(item.createDate).toISOString() : new Date().toISOString(),
    editDate: item.editDate ? new Date(item.editDate).toISOString() : new Date().toISOString(),
    userId: item.userId || finalUserId,
    type: item.type || 'account',
  }));

  // Separate active and archived items
  const activeItems = plainItems.filter((item) => !item.archived);
  const archivedItems = plainItems.filter((item) => item.archived);

  // Get all debt items (both active and archived) and calculate payment statuses
  const allDebtItems = plainItems.filter((item) => item.type === "debt");
  const debtPaymentStatuses = await calculateDebtPaymentStatuses(db, allDebtItems);

  // Process active items
  const accountItems = activeItems.filter((item) => item.type === "account");
  let mappedItems = processCurrencyItems(activeItems, accountItems);
  mappedItems = attachDebtPaymentStatuses(mappedItems, debtPaymentStatuses);

  // Process archived items
  const mappedArchivedItems = processArchivedItems(archivedItems, debtPaymentStatuses);

  const hasItems = mappedItems.length > 0;

  return (
    <div className="px-4 md:px-12 lg:px-32 pb-8">
      {!hasItems && (
        <div className="text-center my-8">
          <h1 className="text-2xl font-bold mb-2">Welcome to your Dashboard</h1>
          <p className="text-gray-600 mb-4">Get started by creating your first item!</p>
        </div>
      )}
      <DashboardClient 
        items={mappedItems as Item[]} 
        archivedItems={mappedArchivedItems as Item[]}
        availableCurrencies={currencies.map(c => c.name).sort()}
        availablePersons={persons.map(p => p.name).sort()}
      />
    </div>
  );
}