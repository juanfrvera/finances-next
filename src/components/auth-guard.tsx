"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/app/actions";

interface AuthGuardProps {
    children: React.ReactNode;
    requireAuth?: boolean;
    redirectTo?: string;
}

export function AuthGuard({ 
    children, 
    requireAuth = false, 
    redirectTo = "/login" 
}: AuthGuardProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const user = await getCurrentUser();
                setIsAuthenticated(!!user);
            } catch (error) {
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    useEffect(() => {
        if (!isLoading) {
            if (requireAuth && !isAuthenticated) {
                router.push(redirectTo);
            } else if (!requireAuth && isAuthenticated && redirectTo === "/login") {
                // If user is authenticated and tries to access login, redirect to dashboard
                router.push("/");
            }
        }
    }, [isLoading, isAuthenticated, requireAuth, redirectTo, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (requireAuth && !isAuthenticated) {
        return null; // Will redirect
    }

    if (!requireAuth && isAuthenticated && redirectTo === "/login") {
        return null; // Will redirect  
    }

    return <>{children}</>;
}
