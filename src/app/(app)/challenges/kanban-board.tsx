"use client";

import { useState } from "react";
import { RecordDrawer } from "@/components/shared/record-drawer";
import { Button } from "@/components/ui/button";
import { createChallenge, updateChallengeStatus, deleteChallenge } from "./actions";

// Define the 5 explicit statuses from the schema
const COLUMNS = ["DRAFT", "UNDER_REVIEW", "ACTIVE", "COMPLETED", "ARCHIVED"] as const;

export function KanbanBoard({ initialChallenges, categories, badges, canManage }: {
  initialChallenges: any[],
  categories: any[],
  badges: any[],
  canManage: boolean
}) {
  const [challenges, setChallenges] = useState(initialChallenges);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  // Group challenges by status
  const grouped = COLUMNS.reduce((acc, status) => {
    acc[status] = challenges.filter(c => c.status === status);
    return acc;
  }, {} as Record<string, any[]>);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createChallenge(formData);
      // In a real app we'd fetch the new list or let Next.js revalidate do it, 
      // but since Server Actions with revalidatePath refresh the page data, 
      // we can just reload or let Next.js handle the server state update.
      window.location.reload(); 
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAdvanceStatus(id: string, currentStatus: string) {
    const currentIndex = COLUMNS.indexOf(currentStatus as any);
    if (currentIndex < COLUMNS.length - 1) {
      const nextStatus = COLUMNS[currentIndex + 1];
      
      // Optimistic update
      setChallenges(prev => prev.map(c => c.id === id ? { ...c, status: nextStatus } : c));
      
      try {
        await updateChallengeStatus(id, nextStatus);
      } catch (err) {
        // Revert on failure
        setChallenges(initialChallenges);
      }
    }
  }

  // Jira-style drag-and-drop: dropping a card on a column moves it to that
  // column's status via the same action the "Advance" button uses.
  async function handleDrop(targetStatus: string) {
    const id = dragId;
    setOverCol(null);
    setDragId(null);
    if (!id) return;
    const card = challenges.find(c => c.id === id);
    if (!card || card.status === targetStatus) return;

    const previous = challenges;
    setChallenges(prev => prev.map(c => (c.id === id ? { ...c, status: targetStatus } : c)));
    try {
      await updateChallengeStatus(id, targetStatus);
    } catch {
      setChallenges(previous); // revert on failure
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this draft challenge?")) return;
    const previous = challenges;
    setChallenges(prev => prev.filter(c => c.id !== id)); // optimistic
    try {
      await deleteChallenge(id);
    } catch (err: any) {
      setChallenges(previous); // revert on failure
      alert(err?.message ?? "Delete failed");
    }
  }

  return (
    <div className="h-full flex flex-col">
      {canManage && (
        <div className="mb-6">
          <Button onClick={() => setDrawerOpen(true)} className="bg-brand-primary-darker hover:bg-brand-primary-dark text-white">
            + Create Challenge
          </Button>
        </div>
      )}

      <div className="flex gap-6 overflow-x-auto pb-4 h-full">
        {COLUMNS.map(col => (
          <div
            key={col}
            onDragOver={(e) => {
              e.preventDefault();
              if (overCol !== col) setOverCol(col);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverCol(null);
            }}
            onDrop={() => handleDrop(col)}
            className={`min-w-[300px] w-[300px] flex flex-col rounded-xl border transition-colors ${
              overCol === col ? "border-2 border-brand-primary-darker bg-tint-green" : "border-line bg-canvas"
            }`}
          >
            <div className="p-4 border-b border-line bg-surface-2 rounded-t-xl">
              <h3 className="font-semibold text-ink flex items-center justify-between">
                {col.replace("_", " ")}
                <span className="text-xs bg-surface-2 text-ink-2 py-0.5 px-2 rounded-full">
                  {grouped[col].length}
                </span>
              </h3>
            </div>
            
            <div className="p-3 flex-1 overflow-y-auto space-y-3">
              {grouped[col].map(challenge => (
                <div
                  key={challenge.id}
                  draggable={canManage}
                  onDragStart={(e) => {
                    if (!canManage) return;
                    setDragId(challenge.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverCol(null);
                  }}
                  className={`bg-surface p-4 rounded-lg shadow-[0_1px_2px_rgba(31,41,55,.04)] border border-line-soft hover:shadow-md transition-shadow ${
                    canManage ? "cursor-grab active:cursor-grabbing" : ""
                  } ${
                    dragId === challenge.id ? "opacity-50 ring-2 ring-brand-primary-darker" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium text-brand-primary bg-tint-green px-2 py-1 rounded">
                      {challenge.categoryName || "General"}
                    </span>
                    <span className="text-xs text-pill-amber-fg font-semibold flex items-center gap-1">
                      ⭐ {challenge.xpReward} XP
                    </span>
                  </div>
                  <h4 className="font-semibold text-ink mb-1">{challenge.title}</h4>
                  <p className="text-xs text-ink-2 line-clamp-2 mb-3">{challenge.description}</p>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-line-soft">
                    {col === "DRAFT" && canManage ? (
                      <button onClick={() => handleDelete(challenge.id)} className="text-xs text-pill-red-fg hover:underline">
                        Delete
                      </button>
                    ) : (
                      <span className="text-xs text-faint">
                        {challenge.difficulty}
                      </span>
                    )}

                    {col !== "ARCHIVED" && canManage && (
                      <button
                        onClick={() => handleAdvanceStatus(challenge.id, challenge.status)}
                        className="text-xs font-medium text-brand-primary-darker hover:underline flex items-center gap-1"
                      >
                        Advance →
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {grouped[col].length === 0 && (
                <div className="text-center p-6 text-faint text-sm border-2 border-dashed border-line rounded-lg">
                  No challenges here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <RecordDrawer 
        open={drawerOpen} 
        onOpenChange={setDrawerOpen} 
        title="Create Challenge"
        loading={isSaving}
        onSave={() => document.getElementById('submit-btn')?.click()}
      >
        <form id="create-challenge-form" onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Title</label>
            <input name="title" required className="w-full border border-input-line rounded-md p-2 focus:ring-brand-primary/15 focus:border-brand-primary" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Description</label>
            <textarea name="description" rows={3} className="w-full border border-input-line rounded-md p-2 focus:ring-brand-primary/15 focus:border-brand-primary" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Category</label>
              <select name="categoryId" required className="w-full border border-input-line rounded-md p-2 bg-surface">
                <option value="">Select...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">ESG Dimension</label>
              <select name="esgCategory" required className="w-full border border-input-line rounded-md p-2 bg-surface">
                <option value="ENVIRONMENTAL">Environmental</option>
                <option value="SOCIAL">Social</option>
                <option value="GOVERNANCE">Governance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Difficulty</label>
              <select name="difficulty" required className="w-full border border-input-line rounded-md p-2 bg-surface">
                <option value="EASY">Easy (100 XP)</option>
                <option value="MEDIUM">Medium (200 XP)</option>
                <option value="HARD">Hard (300 XP)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Badge (Optional)</label>
              <select name="badgeId" className="w-full border border-input-line rounded-md p-2 bg-surface">
                <option value="">None</option>
                {badges.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="evidenceRequired" name="evidenceRequired" defaultChecked className="rounded text-brand-primary-darker focus:ring-brand-primary/15" />
            <label htmlFor="evidenceRequired" className="text-sm text-ink">Proof of completion required</label>
          </div>

          {/* Hidden submit button triggered by RecordDrawer's footer */}
          <button type="submit" id="submit-btn" className="hidden" />
        </form>
      </RecordDrawer>
    </div>
  );
}
