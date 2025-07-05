"use server";
import { getDb } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const COOKIE_NAME = "auth-token";

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
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                username: user.username,
                email: user.email
            },
            JWT_SECRET,
            { expiresIn: "7d" } // Token expires in 7 days
        );

        // Set secure HTTP-only cookie
        const cookieStore = await cookies();
        cookieStore.set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
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
        const token = jwt.sign(
            {
                userId: result.insertedId.toString(),
                username,
                email
            },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Set secure HTTP-only cookie
        const cookieStore = await cookies();
        cookieStore.set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
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

export async function getCurrentUser(): Promise<{ id: string; username: string; email: string } | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(COOKIE_NAME)?.value;

        if (!token) {
            return null;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        return {
            id: decoded.userId,
            username: decoded.username,
            email: decoded.email,
        };
    } catch (error) {
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
