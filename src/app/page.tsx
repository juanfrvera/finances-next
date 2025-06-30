import { getDb } from "@/lib/db";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { getDebtPaymentStatus } from "./actions";

export default async function Dashboard() {
  const db = await getDb();
  const items = await db.collection("items").find({ userId: process.env.TEST_USER_ID }).toArray();
  // Convert to plain objects and _id to string, ensure createDate/editDate are strings
  const plainItems = items.map((item: any) => ({
    ...item,
    _id: item._id?.toString?.() ?? undefined,
    createDate: item.createDate ? new Date(item.createDate).toISOString() : undefined,
    editDate: item.editDate ? new Date(item.editDate).toISOString() : undefined,
  }));

  // Separate active and archived items
  const activeItems = plainItems.filter((item) => !item.archived);
  const archivedItems = plainItems.filter((item) => item.archived);

  // Calculate currency values and account breakdowns (only for active items)
  const accountItems = activeItems.filter((item) => item.type === "account");
  const mappedItems = await Promise.all(activeItems.map(async (item) => {
    if (item.type === "currency") {
      const accounts = accountItems.filter((acc) => acc.currency === item.currency);
      const sum = accounts.reduce((acc, curr) => acc + Number(curr.balance), 0);
      const accountBreakdown = accounts
        .map(acc => ({
          id: acc._id,
          name: acc.name,
          balance: Number(acc.balance),
        }))
        .sort((a, b) => b.balance - a.balance); // Sort by balance descending (highest first)
      return { ...item, value: sum, accountBreakdown };
    } else if (item.type === "debt") {
      // Fetch payment status for debt items
      try {
        const paymentStatus = await getDebtPaymentStatus(item._id);
        return { ...item, ...paymentStatus };
      } catch (error) {
        console.warn(`Failed to get payment status for debt ${item._id}:`, error);
        return item;
      }
    }
    return item;
  }));

  // Also add payment status to archived debt items
  const mappedArchivedItems = await Promise.all(archivedItems.map(async (item) => {
    if (item.type === "debt") {
      try {
        const paymentStatus = await getDebtPaymentStatus(item._id);
        return { ...item, ...paymentStatus };
      } catch (error) {
        console.warn(`Failed to get payment status for archived debt ${item._id}:`, error);
        return item;
      }
    }
    return item;
  }));

  const hasItems = mappedItems.length > 0;

  return (
    <div className="px-4 md:px-12 lg:px-32 pb-8">
      {!hasItems && (
        <div className="text-center my-8">
          <h1 className="text-2xl font-bold mb-2">Welcome to your Dashboard</h1>
          <p className="text-gray-600 mb-4">Get started by creating your first item!</p>
        </div>
      )}
      <DashboardClient items={mappedItems} archivedItems={mappedArchivedItems} />
    </div>
  );
}