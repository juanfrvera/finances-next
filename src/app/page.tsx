import { getServerComponentUserId } from "@/lib/actions/auth";
import Dashboard from "@/components/dashboard/Dashboard";
import LandingPage from "@/components/landing/LandingPage";

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const userId = await getServerComponentUserId();

  // If user is authenticated, show dashboard
  if (userId) {
    return <Dashboard userId={userId} />;
  }

  // If user is not authenticated, show landing page
  return <LandingPage />;
}
