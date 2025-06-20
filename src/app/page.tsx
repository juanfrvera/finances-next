import { Card } from "@/components/ui/card";
import { getDb } from "@/lib/db";

export default async function Dashboard() {
  const db = await getDb();
  const items = await db.collection("items").find().toArray();

  // Calculate currency values
  const accounts = items.filter((item) => item.type === "account");
  const mappedItems = items.map((item) => {
    if (item.type === "currency") {
      const sum = accounts
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
        {mappedItems.map((item) => (
          <div key={item._id.toString()}>
            <Item {...item} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Item(data) {
  if (data.type === 'account') {
    return <Account {...data} />;
  }
  if (data.type === 'currency') {
    return <Currency {...data} />;
  }
  if (data.type === 'debt') {
    return <Debt {...data} />;
  }
  return (
    <Card>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </Card>
  );
}

function Account(data) {
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

function Currency(data) {
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

function Debt({ description, withWho, amount, currency, theyPayMe, ...rest }) {
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