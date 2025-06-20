import { Card } from "@/components/ui/card";
import { getDb } from "@/lib/db";

export default async function Dashboard() {
  const db = await getDb();
  const items = await db.collection("items").find().toArray();
  return (
    <div>
      Welcome to the Dashboard
      <ul>
        {items.map((item) => (
          <li key={item._id.toString()}>
            <Item {...item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Item(data) {
  if (data.type === 'account') {
    return <Account {...data} />;
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
      <h2>Account</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </Card>
  );
}