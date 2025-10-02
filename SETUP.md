# NextAuth with PostgreSQL Setup

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Database (NeonDB)
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token-here"
```

## Setup Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your NeonDB database:**
   - Go to [Neon Console](https://console.neon.tech/)
   - Create a new project
   - Copy the connection string and add it to your `.env.local` file

3. **Generate Prisma client:**
   ```bash
   npm run db:generate
   ```

4. **Push database schema:**
   ```bash
   npm run db:push
   ```

5. **Seed the database with admin user:**
   ```bash
   npm run db:seed
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```

## Features

- ✅ User registration with password hashing
- ✅ User login with credentials
- ✅ Session management
- ✅ Protected dashboard route
- ✅ Beautiful emerald gem UI
- ✅ Form validation
- ✅ Loading states
- ✅ Admin user seeding

## Admin User

The seed script creates an admin user with the following credentials:
- **Email:** `sdillon215@gmail.com`
- **Password:** `admin123`
- **Status:** Email verified

You can use these credentials to test the login functionality immediately after seeding.

## Database Schema

The Prisma schema includes:
- `User` model with authentication fields
- `Account` model for OAuth providers
- `Session` model for session management
- `VerificationToken` model for email verification
- `Gift` model for storing user gifts with image URLs

## API Routes

- `POST /api/auth/register` - User registration
- `GET/POST /api/auth/[...nextauth]` - NextAuth endpoints
- `POST /api/gifts` - Create new gift with image upload
- `GET /api/gifts` - Get user's gifts

## Pages

- `/` - Login/Signup form
- `/dashboard` - Protected dashboard (requires authentication)
