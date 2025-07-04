"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthPage from "@/components/auth/AuthPage";

export default function Login() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (username: string, password: string) => {
        setIsLoading(true);
        setError("");

        try {
            console.log("Login attempt:", { username, password });

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Example validation (replace with real authentication)
            if (username === "admin" && password === "password") {
                console.log("Login successful!");
                // Redirect to dashboard or set authentication state
                router.push("/");
            } else {
                throw new Error("Invalid username or password");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async (username: string, email: string, password: string, confirmPassword: string) => {
        setIsLoading(true);
        setError("");

        try {
            // Validate that passwords match
            if (password !== confirmPassword) {
                throw new Error("Passwords do not match");
            }

            console.log("Signup attempt:", { username, email, password });

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Example validation (replace with real user creation)
            if (username.length >= 3 && email.includes("@") && password.length >= 8) {
                console.log("Signup successful!");
                // Redirect to dashboard or set authentication state
                router.push("/");
            } else {
                throw new Error("Failed to create account. Please check your information.");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Signup failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthPage
            onLogin={handleLogin}
            onSignup={handleSignup}
            isLoading={isLoading}
            error={error}
            defaultMode="login"
        />
    );
}
