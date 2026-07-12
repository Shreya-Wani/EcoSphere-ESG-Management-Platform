import { fetchBadges } from "./actions";
import { BadgesTable } from "./badges-table";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Badges Management | EcoSphere",
};

export default async function BadgesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const userRole = (session.user as any).role || "EMPLOYEE";
  const isAdmin = userRole === "ADMIN"; // badge management is ADMIN-only
  
  const badges = await fetchBadges();

  return (
    <div className="flex flex-col h-full bg-canvas overflow-y-auto">
      <header className="px-8 py-8 bg-surface border-b border-line">
        <h1 className="text-[24px] font-bold text-ink mb-2">Gamification Badges</h1>
        <p className="text-ink-2 max-w-2xl">
          Define the badges employees can earn by completing sustainability actions across the platform.
        </p>
      </header>
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-8 py-8">
        <BadgesTable initialBadges={badges} isAdmin={isAdmin} />
      </main>
    </div>
  );
}
