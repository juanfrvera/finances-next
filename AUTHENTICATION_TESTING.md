# Authentication Testing Guide

## Testing the Login System

The login page now uses real authentication with JWT tokens and bcrypt password hashing.

### Creating a Test User

Since the app uses MongoDB, you can create a test user by running the signup process or by adding a user directly to the database.

#### Option 1: Use the Signup Form
1. Go to `http://localhost:3000/login`
2. Click "Sign Up" tab
3. Fill in the form:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123` (min 8 characters)
   - Confirm Password: `password123`
4. Click "Sign Up"

#### Option 2: MongoDB Direct Insert (Advanced)
Connect to your MongoDB database and insert a user manually:

```javascript
// Example user document (password is hashed)
{
  username: "testuser",
  email: "test@example.com", 
  password: "$2a$12$hashed_password_here", // Use bcrypt to hash
  createdAt: "2025-07-04T12:00:00.000Z"
}
```

### Testing Login
1. Go to `http://localhost:3000/login`
2. Enter credentials:
   - Username: `testuser`
   - Password: `password123`
3. Click "Login"
4. Should redirect to dashboard with authentication cookie set

### Testing Logout
1. In the dashboard, look for the logout button (next to theme toggle)
2. Click the logout button
3. Should redirect to `/login` and clear the authentication cookie

### Development Mode Behavior
- If no authentication cookie exists, the app falls back to `TEST_USER_ID` for development
- This allows the app to work seamlessly during development
- In production (NODE_ENV=production), proper authentication is enforced

### Authentication Flow
1. **Login**: Creates JWT token, sets HTTP-only cookie, redirects to dashboard
2. **Server Actions**: All protected actions verify JWT token from cookie
3. **Logout**: Clears authentication cookie, redirects to login
4. **Auto-redirect**: Unauthenticated users accessing protected pages redirect to login

### Security Features
- ✅ JWT tokens with 7-day expiration
- ✅ HTTP-only cookies (not accessible via JavaScript)
- ✅ Secure cookies in production
- ✅ bcrypt password hashing (12 rounds)
- ✅ User data isolation
- ✅ Server-side session validation
