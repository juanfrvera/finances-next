import { getDb } from "@/lib/db";
import DashboardClient from "@/components/dashboard/DashboardClient";

export default async function Dashboard() {
  const db = await getDb();
  const items = await db.collection("items").find().toArray();
  // Convert to plain objects and _id to string, ensure createDate/editDate are strings
  const plainItems = items.map((item: any) => ({
    ...item,
    _id: item._id?.toString?.() ?? undefined,
    createDate: item.createDate ? new Date(item.createDate).toISOString() : undefined,
    editDate: item.editDate ? new Date(item.editDate).toISOString() : undefined,
  }));

  // Calculate currency values and account breakdowns
  const accountItems = plainItems.filter((item) => item.type === "account");
  const mappedItems = plainItems.map((item) => {
    if (item.type === "currency") {
      const accounts = accountItems.filter((acc) => acc.currency === item.currency);
      const sum = accounts.reduce((acc, curr) => acc + Number(curr.balance), 0);
      const accountBreakdown = accounts.map(acc => ({
        id: acc._id,
        name: acc.name,
        balance: Number(acc.balance),
      }));
      return { ...item, value: sum, accountBreakdown };
    }
    return item;
  });

  const hasItems = mappedItems.length > 0;

  return (
    <div className="px-4 md:px-12 lg:px-32 pb-8">
      {!hasItems && (
        <div className="text-center my-8">
          <h1 className="text-2xl font-bold mb-2">Welcome to your Dashboard</h1>
          <p className="text-gray-600 mb-4">Get started by creating your first item!</p>
        </div>
      )}
      <DashboardClient items={mappedItems} />
    </div>
  );
}