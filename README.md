This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Database Setup

First, set up the database:

```bash
npm install
npm run db:generate
npm run db:setup
npm run db:seed
```

### Development Server

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Test Accounts

After running the seed script, you can log in with these test accounts (password: `password123`):

- `admin@kanar.test` - Admin (full access)
- `cbd@kanar.test` - Character Book Director (review characters)
- `gm@kanar.test` - Gamemaster (review characters, run events)
- `econ@kanar.test` - Economy Marshal (manage economy)
- `player1@kanar.test` - Alice Adventurer (player with approved character)
- `player2@kanar.test` - Bob Barbarian (player with pending & rejected characters)
- `player3@kanar.test` - Carol Cleric (player with draft character)

## Database Commands

- `npm run db:setup` - Initialize SQLite database with schema
- `npm run db:generate` - Generate Prisma client
- `npm run db:seed` - Populate database with test data

## Sample Data Included

The seed script creates:
- 7 test user accounts with various roles
- 3 events (past, upcoming, and future)
- 5 sample characters in different states (approved, 2 pending review, draft, rejected)
- 3 sign-out records (pending, for CBD queue testing)
- 5 lore entries with various categories
- 5 lore characters from game history
- Event registrations with payment tracking

## Project Structure

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
