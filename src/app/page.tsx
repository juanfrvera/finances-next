import { Card } from "@/components/ui/card";
import { getDb } from "@/lib/db";
import AddItemDialog from "./AddItemDialog";

// Types for items
interface AccountItem {
  type: 'account';
  _id?: any;
  name: string;
  balance: number;
  currency: string;
}
interface CurrencyItem {
  type: 'currency';
  _id?: any;
  currency: string;
  value?: number;
}
interface DebtItem {
  type: 'debt';
  _id?: any;
  description: string;
  withWho: string;
  amount: number;
  currency: string;
  theyPayMe: boolean;
}
interface ServiceItem {
  type: 'service';
  _id?: any;
  name: string;
  cost: number;
  currency: string;
  isManual: boolean;
}
type Item = AccountItem | CurrencyItem | DebtItem | ServiceItem;

type ItemType = 'service' | 'account' | 'debt' | 'currency' | null;

export default async function Dashboard() {
  const db = await getDb();
  const items = await db.collection("items").find().toArray();

  // Calculate currency values
  const accountItems = items.filter((item) => item.type === "account");
  const mappedItems = items.map((item) => {
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
      <div className="mt-4 grid gap-4 grid-cols-[repeat(auto-fit,minmax(250px,1fr))] items-start">
        <AddItemDialog />
        {mappedItems.map((item) => {
          // Type guard to ensure item matches Item type
          if (
            item.type === "account" ||
            item.type === "currency" ||
            item.type === "debt" ||
            item.type === "service"
          ) {
            return (
              <div key={item._id?.toString() ?? Math.random()}>
                <ItemCard {...(item as Item)} />
              </div>
            );
          }
          // Render JSON for unknown types
          return (
            <div key={item._id?.toString() ?? Math.random()}>
              <Card>
                <pre>{JSON.stringify(item, null, 2)}</pre>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ItemCard(data: Item) {
  if (data.type === 'account') {
    return <Account {...data} />;
  }
  if (data.type === 'currency') {
    return <Currency {...data} />;
  }
  if (data.type === 'debt') {
    return <Debt {...data} />;
  }
  if (data.type === 'service') {
    return <Service {...data} />;
  }
  return (
    <Card>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </Card>
  );
}

function Account(data: AccountItem) {
  return (
    <Card>
      <div className="flex flex-col items-center">
        <h2 className="text-lg font-semibold mb-2 text-center">{data.name}</h2>
        <div className="text-2xl font-bold flex items-baseline gap-1 justify-center">
          {Number(data.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="text-base font-normal ml-1">{data.currency}</span>
        </div>
      </div>
      {/* Optionally, display the rest of the data for debugging */}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </Card>
  );
}

function Currency(data: CurrencyItem) {
  return (
    <Card>
      <div className="flex flex-col items-center">
        <h2 className="text-lg font-semibold mb-2 text-center">{data.currency}</h2>
        <div className="text-2xl font-bold flex items-baseline gap-1 justify-center">
          {Number(data.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="text-base font-normal ml-1">{data.currency}</span>
        </div>
      </div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </Card>
  );
}

function Debt({ description, withWho, amount, currency, theyPayMe, ...rest }: DebtItem) {
  let message = "";
  if (theyPayMe) {
    message = `${withWho} owes you ${amount} ${currency}.`;
  } else {
    message = `You owe ${amount} ${currency} to ${withWho}.`;
  }
  return (
    <Card>
      <div className="flex flex-col items-center">
        <div className="text-base mb-2 text-center">{description}</div>
        <div className="text-lg font-semibold text-center">{message}</div>
      </div>
      <pre>{JSON.stringify({ description, withWho, amount, currency, theyPayMe, ...rest }, null, 2)}</pre>
    </Card>
  );
}

function Service({ name, cost, currency, isManual, ...rest }: ServiceItem) {
  return (
    <Card>
      <div className="flex flex-col items-center">
        <h2 className="text-lg font-semibold mb-1 text-center">{name}</h2>
        <div className="text-base font-medium mb-2 text-center">
          {Number(cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
        </div>
        <div className="text-sm text-gray-600 mb-2 text-center">
          {isManual ? 'Manual payment' : 'Payment is automatic'}
        </div>
      </div>
      <pre>{JSON.stringify({ name, cost, currency, isManual, ...rest }, null, 2)}</pre>
    </Card>
  );
}