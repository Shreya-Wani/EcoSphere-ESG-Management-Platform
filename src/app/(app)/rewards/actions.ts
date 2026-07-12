"use server";

import { db } from "@/db";
import { rewards } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redeem, getPointsBalance } from "@/server/services/gamification/reward";
import { revalidatePath } from "next/cache";
import { requireActionRole, requireActionSession } from "@/server/action-guards";

// Newest rewards first so freshly-added items surface at the top.
export async function fetchCatalog() {
  return await db.select().from(rewards).orderBy(desc(rewards.createdAt));
}

export async function fetchWalletBalance(userId: string) {
  return await getPointsBalance(userId);
}

// Redeems for the CURRENTLY SIGNED-IN user — the reward recipient is taken
// from the session, never from a client-supplied id (prevents redeeming
// against another user's balance).
export async function checkoutReward(rewardId: string) {
  try {
    const { userId } = await requireActionSession();
    const result = await redeem(userId, rewardId);
    revalidatePath("/rewards");
    return { success: true, reward: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createRewardItem(formData: FormData) {
  await requireActionRole("ADMIN", "HR_MANAGER"); // reward.create
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const pointsRequired = parseInt(formData.get("pointsRequired") as string);
  const stock = parseInt(formData.get("stock") as string);

  await db.insert(rewards).values({
    name,
    description,
    pointsRequired,
    stock,
    status: "ACTIVE"
  });

  revalidatePath("/rewards");
}

export async function updateRewardStock(id: string, newStock: number) {
  await requireActionRole("ADMIN", "HR_MANAGER"); // reward.update
  await db.update(rewards).set({ stock: newStock }).where(eq(rewards.id, id));
  revalidatePath("/rewards");
}
