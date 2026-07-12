import { fetchParticipations, fetchMyChallenges } from "./actions";
import { ParticipationTable } from "./participation-table";
import { MyChallenges } from "./my-challenges";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Challenge Participation | EcoSphere",
};

export default async function ChallengeParticipationPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const userRole = (session.user as any).role || "EMPLOYEE";
  // Approving/rejecting challenge proofs is ADMIN / HR_MANAGER only (matrix).
  const isManager = userRole === "HR_MANAGER" || userRole === "ADMIN";

  const [participations, myChallenges] = await Promise.all([
    fetchParticipations(),
    fetchMyChallenges(),
  ]);

  const pendingCount = participations.filter((p) => p.status === "PROOF_SUBMITTED").length;

  return (
    <div className="flex flex-col h-full bg-canvas overflow-y-auto">
      <header className="px-8 py-8 bg-surface border-b border-line">
        <h1 className="text-[24px] font-bold text-ink mb-2">Challenges</h1>
        <p className="text-ink-2 max-w-2xl">
          Join active challenges, upload proof of completion, and track approvals. Approving a
          proof awards XP instantly and evaluates badge progress.
        </p>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-8 py-8 space-y-10">
        {/* Everyone: join + submit proof for active challenges */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink">My Challenges</h2>
          <MyChallenges challenges={myChallenges as any} />
        </section>

        {/* Managers: the approval queue */}
        {isManager && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-lg font-semibold text-ink">Approval Queue</h2>
              {pendingCount > 0 && (
                <span className="rounded-full bg-pill-amber-bg px-2 py-0.5 text-xs font-semibold text-pill-amber-fg">
                  {pendingCount} pending
                </span>
              )}
            </div>
            <ParticipationTable data={participations} isAdmin={isManager} />
          </section>
        )}
      </main>
    </div>
  );
}
