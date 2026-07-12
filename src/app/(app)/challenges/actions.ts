"use server";

import { db } from "@/db";
import { challenges, categories, badges } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireActionRole } from "@/server/action-guards";
import { isForeignKeyViolation, foreignKeyMessage } from "@/server/db-errors";

// Map difficulty to XP Reward as defined in the schema business rules
const difficultyXpMap: Record<string, number> = {
  EASY: 100,
  MEDIUM: 200,
  HARD: 300,
};

// Since relations might not be explicitly defined in schema.ts, let's use a standard select with leftJoin for safety.
export async function fetchChallengesData() {
  const rows = await db
    .select({
      id: challenges.id,
      title: challenges.title,
      description: challenges.description,
      status: challenges.status,
      difficulty: challenges.difficulty,
      xpReward: challenges.xpReward,
      categoryName: categories.name,
      badgeName: badges.name,
      deadline: challenges.deadline,
    })
    .from(challenges)
    .leftJoin(categories, eq(challenges.categoryId, categories.id))
    .leftJoin(badges, eq(challenges.badgeId, badges.id))
    .orderBy(desc(challenges.createdAt));
  
  return rows;
}

export async function createChallenge(formData: FormData) {
  await requireActionRole("ADMIN", "HR_MANAGER"); // challenge.create
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const categoryId = formData.get("categoryId") as string;
  const esgCategory = formData.get("esgCategory") as any;
  const difficulty = formData.get("difficulty") as any;
  const evidenceRequired = formData.get("evidenceRequired") === "on";
  const deadlineStr = formData.get("deadline") as string;
  const badgeId = formData.get("badgeId") as string;

  if (!title || !categoryId) {
    throw new Error("Title and Category are required");
  }

  const xpReward = difficultyXpMap[difficulty] || 200;
  const deadline = deadlineStr ? new Date(deadlineStr) : null;

  await db.insert(challenges).values({
    title,
    description,
    categoryId,
    esgCategory,
    difficulty,
    xpReward,
    evidenceRequired,
    badgeId: badgeId || null,
    deadline,
    status: "DRAFT",
  });

  revalidatePath("/challenges");
}

export async function updateChallengeStatus(id: string, newStatus: any) {
  await requireActionRole("ADMIN", "HR_MANAGER"); // challenge.update
  await db.update(challenges).set({ status: newStatus }).where(eq(challenges.id, id));
  revalidatePath("/challenges");
}

export async function deleteChallenge(id: string) {
  await requireActionRole("ADMIN", "HR_MANAGER"); // challenge.delete
  // Guard: Only DRAFT challenges can be deleted
  const [challenge] = await db.select({ status: challenges.status }).from(challenges).where(eq(challenges.id, id));
  
  if (!challenge) return; // already gone — treat as success
  if (challenge.status !== "DRAFT") {
    throw new Error("Only DRAFT challenges can be deleted.");
  }

  try {
    await db.delete(challenges).where(eq(challenges.id, id));
  } catch (e) {
    // e.g. participants already joined this challenge — block with a clear reason.
    if (isForeignKeyViolation(e)) throw new Error(foreignKeyMessage(e));
    throw e;
  }
  revalidatePath("/challenges");
}
