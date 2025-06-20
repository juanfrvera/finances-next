import { Card } from "@/components/ui/card";
import Image from "next/image";

export default function Dashboard() {
  return (
    <div>
      Welcome to the Dashboard
      <ul>
        <li>
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card Description</CardDescription>
              <CardAction>Card Action</CardAction>
            </CardHeader>
            <CardContent>
              <p>Card Content</p>
            </CardContent>
            <CardFooter>
              <p>Card Footer</p>
            </CardFooter>
          </Card>
        </li>
      </ul>
    </div>
  );
}
