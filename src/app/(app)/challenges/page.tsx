import { fetchChallengesData } from "./actions";
import { KanbanBoard } from "./kanban-board";
import { db } from "@/db";
import { categories, badges } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";

export const metadata = {
  title: "Challenges Kanban | EcoSphere",
};

export default async function ChallengesPage() {
  const session = await auth();
  const role = (session?.user as any)?.role ?? "EMPLOYEE";
  const canManage = role === "ADMIN" || role === "HR_MANAGER"; // challenge.create/update

  const [challengeRows, categoryRows, badgeRows] = await Promise.all([
    fetchChallengesData(),
    db.select().from(categories).where(eq(categories.type, "CHALLENGE")),
    db.select().from(badges).where(eq(badges.status, "ACTIVE"))
  ]);

  return (
    <div className="flex flex-col h-full bg-canvas">
      <header className="flex items-center justify-between px-8 py-6 bg-surface border-b border-line">
        <div>
          <h1 className="text-[20px] font-semibold text-ink">Challenges Kanban</h1>
          <p className="text-[12.5px] text-faint mt-1">Manage gamified challenges across their lifecycle.</p>
        </div>
      </header>
      
      <main className="flex-1 overflow-x-auto p-8">
        <KanbanBoard
          initialChallenges={challengeRows}
          categories={categoryRows}
          badges={badgeRows}
          canManage={canManage}
        />
      </main>
    </div>
  );
}
