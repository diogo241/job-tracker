import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { initUserBoard } from '../helpers/init-user-board';
import connectDB from '../db';
import { MongoClient } from 'mongodb';

// const mongooseInstance = await connectDB();
// console.log(mongooseInstance.connection);
// const client = mongooseInstance!.connection.getClient();
const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client,
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60,
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (user.id) {
            await initUserBoard(user.id);
          }
        },
      },
    },
  },
});

export async function getSession() {
  const result = await auth.api.getSession({
    headers: await headers(),
  });

  return result;
}

export async function signOut() {
  const result = await auth.api.signOut({
    headers: await headers(),
  });

  if (result.success) {
    return redirect('/sign-in');
  }
}
