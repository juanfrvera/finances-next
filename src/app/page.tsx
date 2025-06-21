import { getDb } from "@/lib/db";
import DashboardClient from "./DashboardClient";

export default async function Dashboard() {
  const db = await getDb();
  const items = await db.collection("items").find().toArray();
  // Convert to plain objects and _id to string
  const plainItems = items.map((item: any) => ({
    ...item,
    _id: item._id?.toString?.() ?? undefined,
  }));

  // Calculate currency values
  const accountItems = plainItems.filter((item) => item.type === "account");
  const mappedItems = plainItems.map((item) => {
    if (item.type === "currency") {
      const sum = accountItems
        .filter((acc) => acc.currency === item.currency)
        .reduce((acc, curr) => acc + Number(curr.balance), 0);
      return { ...item, value: sum };
    }
    return item;
  });

  return (
    <div className="px-4 md:px-12 lg:px-32">
      Welcome to the Dashboard
      <DashboardClient items={mappedItems} />
    </div>
  );
}