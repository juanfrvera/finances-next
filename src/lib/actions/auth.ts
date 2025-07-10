"use server";
import { getDb } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/**
 * Authentication Configuration
 * 
 * Environment variables:
 * - JWT_SECRET: Secret key for JWT token signing
 * - AUTH_COOKIE_EXPIRES_SECONDS: Number of seconds until cookie expires (default: 604800 = 7 days)
 * - AUTH_EXTEND_ON_ACTIVITY: Whether to extend cookie on user activity (default: false)
 */

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const COOKIE_NAME = "auth-token";

// Cookie configuration
const getCookieConfig = () => {
    const expireSeconds = parseInt(process.env.AUTH_COOKIE_EXPIRES_SECONDS || "604800");
    const expireDays = Math.ceil(expireSeconds / (24 * 60 * 60)); // Convert seconds to days for JWT

    return {
        expireSeconds,
        maxAge: expireSeconds,
        expiresIn: `${expireDays}d`, // JWT token expiration
        extendOnActivity: process.env.AUTH_EXTEND_ON_ACTIVITY === "true"
    };
};

// Types for authentication
interface User {
    _id: string;
    username: string;
    email: string;
    password: string;
    createdAt: string;
}

interface AuthResult {
    success: boolean;
    error?: string;
    user?: {
        id: string;
        username: string;
        email: string;
    };
}

// User data we include in the JWT payload (before signing)
interface TokenData {
    userId: string;
    username: string;
    email: string;
}

// Complete JWT payload after signing (includes exp, iat added by JWT library)
// This is what we get back when we decode the token with jwt.verify()
interface TokenPayload extends TokenData {
    exp: number;    // JWT expiration timestamp (seconds since epoch) - added by jwt.sign()
    iat: number;    // JWT issued at timestamp (seconds since epoch) - added by jwt.sign()
}

// Authentication server actions
export async function loginUser(username: string, password: string): Promise<AuthResult> {
    try {
        const db = await getDb();

        // Find user by username
        const user = await db.collection("users").findOne({ username });
        if (!user) {
            return { success: false, error: "Invalid username or password" };
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return { success: false, error: "Invalid username or password" };
        }

        // Create JWT token
        const cookieConfig = getCookieConfig();
        const payload: TokenData = {
            userId: user._id.toString(),
            username: user.username,
            email: user.email
        };
        const token = jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: cookieConfig.expiresIn } as jwt.SignOptions
        );

        // Set secure HTTP-only cookie
        const cookieStore = await cookies();
        cookieStore.set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: cookieConfig.maxAge,
            path: "/",
        });

        return {
            success: true,
            user: {
                id: user._id.toString(),
                username: user.username,
                email: user.email,
            },
        };
    } catch (error) {
        console.error("Login error:", error);
        return { success: false, error: "An error occurred during login" };
    }
}

export async function signupUser(
    username: string,
    email: string,
    password: string,
    confirmPassword: string
): Promise<AuthResult> {
    try {
        // Validate passwords match
        if (password !== confirmPassword) {
            return { success: false, error: "Passwords do not match" };
        }

        // Validate password strength
        if (password.length < 8) {
            return { success: false, error: "Password must be at least 8 characters long" };
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { success: false, error: "Please enter a valid email address" };
        }

        const db = await getDb();

        // Check if username or email already exists
        const existingUser = await db.collection("users").findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            if (existingUser.username === username) {
                return { success: false, error: "Username already exists" };
            }
            if (existingUser.email === email) {
                return { success: false, error: "Email already registered" };
            }
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        const now = new Date().toISOString();
        const result = await db.collection("users").insertOne({
            username,
            email,
            password: hashedPassword,
            createdAt: now,
        });

        // Create JWT token
        const cookieConfig = getCookieConfig();
        const payload: TokenData = {
            userId: result.insertedId.toString(),
            username,
            email
        };
        const token = jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: cookieConfig.expiresIn } as jwt.SignOptions
        );

        // Set secure HTTP-only cookie
        const cookieStore = await cookies();
        cookieStore.set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: cookieConfig.maxAge,
            path: "/",
        });

        return {
            success: true,
            user: {
                id: result.insertedId.toString(),
                username,
                email,
            },
        };
    } catch (error) {
        console.error("Signup error:", error);
        return { success: false, error: "An error occurred during signup" };
    }
}

export async function logoutUser(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

// Helper function to extend cookie expiration on activity
async function extendCookieExpirationIfConfigured(token: string): Promise<void> {
    const cookieConfig = getCookieConfig();

    if (!cookieConfig.extendOnActivity) {
        return;
    }

    try {
        const cookieStore = await cookies();
        cookieStore.set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: cookieConfig.maxAge,
            path: "/",
        });
    } catch (error) {
        console.error("Error extending cookie expiration:", error);
    }
}

export async function getCurrentUser(): Promise<{ id: string; username: string; email: string } | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(COOKIE_NAME)?.value;

        if (!token) {
            return null;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

        // Double-check token expiration (jwt.verify should catch this, but adding extra safety)
        // JWT exp is in seconds, Date.now() is in milliseconds
        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
            console.log("Token has expired, clearing cookie");
            // Clear the expired cookie
            const cookieStore = await cookies();
            cookieStore.delete(COOKIE_NAME);
            return null;
        }

        // Extend cookie expiration if configured to do so
        await extendCookieExpirationIfConfigured(token);

        return {
            id: decoded.userId,
            username: decoded.username,
            email: decoded.email,
        };
    } catch (error) {
        // Handle JWT verification errors
        if (error instanceof jwt.JsonWebTokenError) {
            console.log("Invalid JWT token, clearing cookie");
            // Clear invalid cookie
            const cookieStore = await cookies();
            cookieStore.delete(COOKIE_NAME);
            return null;
        }

        console.error("Get current user error:", error);
        return null;
    }
}

// Helper function to verify authentication and redirect if needed
export async function requireAuth(): Promise<{ id: string; username: string; email: string }> {
    // In development mode, use TEST_USER_ID if no authentication is set up
    if (process.env.TEST_USER_ID) {
        const user = await getCurrentUser();
        if (!user) {
            // Return a mock user for development
            return {
                id: process.env.TEST_USER_ID,
                username: "testuser",
                email: "test@example.com"
            };
        }
        return user;
    }

    // In production, require proper authentication
    const user = await getCurrentUser();
    if (!user) {
        redirect("/login");
    }
    return user;
}

// Helper function to get current user ID (for server actions)
export async function getCurrentUserId(): Promise<string> {
    const user = await requireAuth();
    return user.id;
}

// Safe functions for Server Components - these avoid direct cookie access
export async function getUserFromToken(token: string): Promise<{ id: string; username: string; email: string } | null> {
    try {
        if (!token) {
            return null;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

        // Double-check token expiration (jwt.verify should catch this, but adding extra safety)
        // JWT exp is in seconds, Date.now() is in milliseconds
        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
            console.log("Token has expired");
            return null;
        }

        return {
            id: decoded.userId,
            username: decoded.username,
            email: decoded.email,
        };
    } catch (error) {
        // Handle JWT verification errors
        if (error instanceof jwt.JsonWebTokenError) {
            console.log("Invalid JWT token");
            return null;
        }

        console.error("Get user from token error:", error);
        return null;
    }
}

// Server Component safe authentication - doesn't use cookies() directly
export async function getServerComponentUser(): Promise<{ id: string; username: string; email: string } | null> {
    try {
        // Use the cookies() function from next/headers in a way that works in Server Components
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        const token = cookieStore.get(COOKIE_NAME)?.value;

        if (!token) {
            // In development mode, return test user if configured
            if (process.env.TEST_USER_ID) {
                return {
                    id: process.env.TEST_USER_ID,
                    username: "testuser",
                    email: "test@example.com"
                };
            }
            return null;
        }

        return await getUserFromToken(token);
    } catch (error) {
        console.error("Get server component user error:", error);
        // In development mode, return test user if configured
        if (process.env.TEST_USER_ID) {
            return {
                id: process.env.TEST_USER_ID,
                username: "testuser",
                email: "test@example.com"
            };
        }
        return null;
    }
}

// Server Component safe version of getCurrentUserId
export async function getServerComponentUserId(): Promise<string | null> {
    const user = await getServerComponentUser();
    return user?.id || null;
}

// Function to manually refresh the authentication token
export async function refreshAuthToken(): Promise<boolean> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return false;
        }

        const cookieConfig = getCookieConfig();

        // Create a new token with extended expiration
        const payload: TokenData = {
            userId: user.id,
            username: user.username,
            email: user.email
        };
        const newToken = jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: cookieConfig.expiresIn } as jwt.SignOptions
        );

        // Set the new cookie
        const cookieStore = await cookies();
        cookieStore.set(COOKIE_NAME, newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: cookieConfig.maxAge,
            path: "/",
        });

        return true;
    } catch (error) {
        console.error("Error refreshing auth token:", error);
        return false;
    }
}

// Function to get cookie configuration (for client-side use)
export async function getAuthConfig(): Promise<{
    expireSeconds: number;
    extendOnActivity: boolean;
}> {
    const cookieConfig = getCookieConfig();
    return {
        expireSeconds: cookieConfig.expireSeconds,
        extendOnActivity: cookieConfig.extendOnActivity,
    };
}
