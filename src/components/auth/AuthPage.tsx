"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LogIn, UserPlus, ArrowLeft } from "lucide-react";

type AuthMode = 'login' | 'signup';

interface AuthPageProps {
    onLogin?: (username: string, password: string) => void | Promise<void>;
    onSignup?: (username: string, email: string, password: string, confirmPassword: string) => void | Promise<void>;
    isLoading?: boolean;
    error?: string;
    defaultMode?: AuthMode;
}

export default function AuthPage({
    onLogin,
    onSignup,
    isLoading = false,
    error,
    defaultMode = 'login'
}: AuthPageProps) {
    const [mode, setMode] = useState<AuthMode>(defaultMode);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [localError, setLocalError] = useState("");

    const isLogin = mode === 'login';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError("");

        // Basic validation
        if (!username.trim()) {
            setLocalError("Username is required");
            return;
        }

        if (!isLogin && !email.trim()) {
            setLocalError("Email is required");
            return;
        }

        if (!isLogin && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setLocalError("Please enter a valid email address");
            return;
        }

        if (!password.trim()) {
            setLocalError("Password is required");
            return;
        }

        if (!isLogin && password.length < 8) {
            setLocalError("Password must be at least 8 characters long");
            return;
        }

        if (!isLogin && password !== confirmPassword) {
            setLocalError("Passwords do not match");
            return;
        }

        try {
            if (isLogin && onLogin) {
                await onLogin(username, password);
            } else if (!isLogin && onSignup) {
                await onSignup(username, email, password, confirmPassword);
            }
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : `${isLogin ? 'Login' : 'Signup'} failed`);
        }
    };

    const switchMode = () => {
        setMode(isLogin ? 'signup' : 'login');
        setLocalError("");
        // Keep username but clear other fields when switching
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    const displayError = error || localError;

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md p-8 space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="flex justify-center">
                        <div className="p-3 bg-primary/10 rounded-full">
                            {isLogin ? (
                                <LogIn className="h-6 w-6 text-primary" />
                            ) : (
                                <UserPlus className="h-6 w-6 text-primary" />
                            )}
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">
                        {isLogin ? "Welcome Back" : "Create Account"}
                    </h1>
                    <p className="text-muted-foreground">
                        {isLogin
                            ? "Please sign in to your account"
                            : "Please fill in the information below"
                        }
                    </p>
                </div>

                {/* Error Message */}
                {displayError && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                        {displayError}
                    </div>
                )}

                {/* Auth Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Username Field */}
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isLoading}
                            className="w-full"
                            autoComplete="username"
                        />
                    </div>

                    {/* Email Field (Signup only) */}
                    {!isLogin && (
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                className="w-full"
                                autoComplete="email"
                            />
                        </div>
                    )}

                    {/* Password Field */}
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder={isLogin ? "Enter your password" : "Create a password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                className="w-full pr-10"
                                autoComplete={isLogin ? "current-password" : "new-password"}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                disabled={isLoading}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        {!isLogin && (
                            <p className="text-xs text-muted-foreground">
                                Password must be at least 8 characters long
                            </p>
                        )}
                    </div>

                    {/* Confirm Password Field (Signup only) */}
                    {!isLogin && (
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isLoading}
                                    className="w-full pr-10"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    disabled={isLoading}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading || !username.trim() || !password.trim() ||
                            (!isLogin && (!email.trim() || !confirmPassword.trim()))}
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                                {isLogin ? "Signing in..." : "Creating account..."}
                            </>
                        ) : (
                            <>
                                {isLogin ? (
                                    <>
                                        <LogIn className="h-4 w-4 mr-2" />
                                        Sign In
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Create Account
                                    </>
                                )}
                            </>
                        )}
                    </Button>
                </form>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            {isLogin ? "New to our platform?" : "Already have an account?"}
                        </span>
                    </div>
                </div>

                {/* Switch Mode Button */}
                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={switchMode}
                    disabled={isLoading}
                >
                    {isLogin ? (
                        <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Create new account
                        </>
                    ) : (
                        <>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to login
                        </>
                    )}
                </Button>

                {/* Footer Links (Login only) */}
                {isLogin && (
                    <div className="text-center">
                        <button
                            type="button"
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => {
                                // Add forgot password logic here
                                console.log("Forgot password clicked");
                            }}
                            disabled={isLoading}
                        >
                            Forgot your password?
                        </button>
                    </div>
                )}
            </Card>
        </div>
    );
}
