"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthPage from "@/components/auth/AuthPage";
import { AuthGuard } from "@/components/auth-guard";
import { loginUser, signupUser } from "@/app/actions";

export default function Login() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (username: string, password: string) => {
        setIsLoading(true);
        setError("");

        try {
            const result = await loginUser(username, password);

            if (result.success) {
                console.log("Login successful!", result.user);
                // Keep loading true during redirect - page will unmount anyway
                router.push("/");
            } else {
                setIsLoading(false);
                setError(result.error || "Login failed");
            }
        } catch (err) {
            console.error("Login error:", err);
            setIsLoading(false);
            setError(err instanceof Error ? err.message : "Login failed");
        }
    };

    const handleSignup = async (username: string, email: string, password: string, confirmPassword: string) => {
        setIsLoading(true);
        setError("");

        try {
            const result = await signupUser(username, email, password, confirmPassword);

            if (result.success) {
                console.log("Signup successful!", result.user);
                // Keep loading true during redirect - page will unmount anyway
                router.push("/");
            } else {
                setIsLoading(false);
                setError(result.error || "Signup failed");
            }
        } catch (err) {
            console.error("Signup error:", err);
            setIsLoading(false);
            setError(err instanceof Error ? err.message : "Signup failed");
        }
    };

    return (
        <AuthGuard requireAuth={false} redirectTo="/login">
            <AuthPage
                onLogin={handleLogin}
                onSignup={handleSignup}
                isLoading={isLoading}
                error={error}
                defaultMode="login"
            />
        </AuthGuard>
    );
}
