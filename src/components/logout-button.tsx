"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { logoutUser } from "@/app/actions";

export function LogoutButton() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        setIsLoading(true);
        try {
            await logoutUser();
            router.push("/login");
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleLogout}
            disabled={isLoading}
            className="p-1 rounded hover:bg-secondary/80 focus:outline-none transition-colors disabled:opacity-50"
            aria-label="Logout"
            title="Logout"
        >
            <LogOut className={`h-5 w-5 text-muted-foreground ${isLoading ? 'animate-pulse' : ''}`} />
        </button>
    );
}
