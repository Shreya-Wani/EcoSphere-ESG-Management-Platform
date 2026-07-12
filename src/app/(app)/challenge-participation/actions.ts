"use server";

import { db } from "@/db";
import { challengeParticipations, challenges, users } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import {
  approveParticipation,
  rejectParticipation,
  joinChallenge,
  submitProof,
} from "@/server/services/gamification/participation";
import { revalidatePath } from "next/cache";
import { requireActionRole, requireActionSession } from "@/server/action-guards";

export async function fetchParticipations() {
  const data = await db
    .select({
      id: challengeParticipations.id,
      status: challengeParticipations.status,
      proofUrl: challengeParticipations.proofUrl,
      createdAt: challengeParticipations.createdAt,
      xpAwarded: challengeParticipations.xpAwarded,
      challengeTitle: challenges.title,
      challengeXp: challenges.xpReward,
      userName: users.name,
      userId: users.id
    })
    .from(challengeParticipations)
    .innerJoin(challenges, eq(challengeParticipations.challengeId, challenges.id))
    .innerJoin(users, eq(challengeParticipations.userId, users.id))
    .orderBy(desc(challengeParticipations.createdAt));

  return data;
}

export async function handleApprove(participationId: string) {
  try {
    await requireActionRole("ADMIN", "HR_MANAGER"); // challengeParticipation.approve
    await approveParticipation(participationId);
    revalidatePath("/challenge-participation");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function handleReject(participationId: string) {
  try {
    await requireActionRole("ADMIN", "HR_MANAGER"); // challengeParticipation.approve
    await rejectParticipation(participationId, "Proof was rejected by admin.");
    revalidatePath("/challenge-participation");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * ACTIVE challenges with the signed-in user's participation state joined in,
 * so employees can join and submit proof from their own "My Challenges" view.
 */
export async function fetchMyChallenges() {
  const { userId } = await requireActionSession();
  return db
    .select({
      id: challenges.id,
      title: challenges.title,
      description: challenges.description,
      xpReward: challenges.xpReward,
      difficulty: challenges.difficulty,
      esgCategory: challenges.esgCategory,
      evidenceRequired: challenges.evidenceRequired,
      deadline: challenges.deadline,
      myParticipationId: challengeParticipations.id,
      myStatus: challengeParticipations.status,
      myProofUrl: challengeParticipations.proofUrl,
    })
    .from(challenges)
    .leftJoin(
      challengeParticipations,
      and(
        eq(challengeParticipations.challengeId, challenges.id),
        eq(challengeParticipations.userId, userId),
      ),
    )
    .where(eq(challenges.status, "ACTIVE"))
    .orderBy(desc(challenges.createdAt));
}

/** The signed-in user joins a challenge (challengeParticipation.create). */
export async function joinChallengeAction(challengeId: string) {
  try {
    const { userId } = await requireActionSession();
    await joinChallenge(userId, challengeId);
    revalidatePath("/challenge-participation");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** The signed-in user submits image/link proof for their own participation. */
export async function submitChallengeProofAction(participationId: string, proofUrl: string) {
  try {
    const { userId } = await requireActionSession();
    if (!/^https?:\/\//.test(proofUrl) && !/^data:image\//.test(proofUrl)) {
      throw new Error("Proof must be an uploaded image or a valid link.");
    }
    await submitProof(participationId, userId, proofUrl);
    revalidatePath("/challenge-participation");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
