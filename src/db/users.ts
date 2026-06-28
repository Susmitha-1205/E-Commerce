import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string) {
  const lowercaseEmail = email.toLowerCase();
  // Automatically grant admin role to the developer/tester's email
  const role = lowercaseEmail === 'susmithamungara28@gmail.com' ? 'admin' : 'user';

  try {
    const result = await db.insert(users)
      .values({
        uid,
        email: lowercaseEmail,
        role,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: lowercaseEmail,
          // Do not overwrite role if it's already set to prevent non-admins hijacking admin,
          // but allow upgrading
          role: role === 'admin' ? 'admin' : users.role,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database user get/create failed:", error);
    throw new Error("Failed to synchronize user profile.", { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return result[0];
  } catch (error) {
    console.error("Database getUserByUid failed:", error);
    throw new Error("Failed to retrieve user by UID.", { cause: error });
  }
}

export async function updateUserRole(uid: string, role: 'admin' | 'user') {
  try {
    const result = await db.update(users)
      .set({ role })
      .where(eq(users.uid, uid))
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database updateUserRole failed:", error);
    throw new Error("Failed to update user role.", { cause: error });
  }
}
