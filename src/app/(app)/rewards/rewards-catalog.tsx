"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RecordDrawer } from "@/components/shared/record-drawer";
import { checkoutReward, createRewardItem, updateRewardStock } from "./actions";

export function RewardsCatalog({ 
  initialRewards, 
  walletBalance,
  userId,
  isAdmin 
}: { 
  initialRewards: any[], 
  walletBalance: number,
  userId: string,
  isAdmin: boolean 
}) {
  const [rewards, setRewards] = useState(initialRewards);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewReward, setViewReward] = useState<any | null>(null);
  const [stockEdit, setStockEdit] = useState<number>(0);
  const [savingStock, setSavingStock] = useState(false);

  const displayRewards = isAdmin ? rewards : rewards.filter(r => r.status === "ACTIVE");

  const rewardEmoji = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("coffee")) return "☕";
    if (n.includes("day")) return "🌴";
    if (n.includes("merch") || n.includes("mug")) return "👕";
    return "🎁";
  };

  function openView(reward: any) {
    setViewReward(reward);
    setStockEdit(reward.stock);
  }

  async function saveStock() {
    if (!viewReward) return;
    setSavingStock(true);
    try {
      await updateRewardStock(viewReward.id, Number(stockEdit));
      setRewards(prev => prev.map(r => (r.id === viewReward.id ? { ...r, stock: Number(stockEdit) } : r)));
      setViewReward(null);
    } catch {
      alert("Failed to update stock.");
    } finally {
      setSavingStock(false);
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createRewardItem(formData);
      window.location.reload(); 
    } catch (err) {
      console.error(err);
      alert("Failed to create reward.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRedeem(rewardId: string, cost: number) {
    if (!confirm(`Are you sure you want to spend ${cost} points on this reward?`)) return;
    
    setProcessingId(rewardId);
    try {
      const res = await checkoutReward(userId, rewardId);
      if (!res.success) {
        alert("Checkout failed: " + res.error);
      } else {
        alert("Success! Your reward is being processed.");
        // We reload to sync wallet balance from server, or we could just rely on Next.js server actions revalidating the path.
        // Actually, since checkoutReward calls revalidatePath, the page should auto-refresh props!
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div>
      {isAdmin && (
        <div className="mb-8 flex justify-end">
          <Button onClick={() => setDrawerOpen(true)} className="bg-[#33503C] hover:bg-[#33503C]/90 text-white">
            + Add New Reward
          </Button>
        </div>
      )}

      {displayRewards.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <div className="text-4xl mb-4">🎁</div>
          <h3 className="text-lg font-semibold text-gray-700">No rewards available yet.</h3>
          <p className="text-gray-500 mt-2">Check back later for new items in the catalog!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayRewards.map(reward => {
            const isOutOfStock = reward.stock <= 0;
            const cannotAfford = walletBalance < reward.pointsRequired;
            const isProcessing = processingId === reward.id;

            return (
              <div 
                key={reward.id} 
                className={`flex flex-col bg-white rounded-2xl border ${isOutOfStock ? 'border-gray-200 opacity-70' : 'border-gray-200 shadow-sm hover:shadow-md'} transition-all overflow-hidden`}
              >
                {/* Image Placeholder */}
                <div className="h-40 bg-gray-100 flex items-center justify-center text-4xl">
                  {reward.name.toLowerCase().includes("coffee") ? "☕" : 
                   reward.name.toLowerCase().includes("day") ? "🌴" : 
                   reward.name.toLowerCase().includes("merch") || reward.name.toLowerCase().includes("mug") ? "👕" : "🎁"}
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg line-clamp-1">{reward.name}</h3>
                  </div>
                  
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                    {reward.description}
                  </p>

                  <div className="flex items-end justify-between mt-auto pt-4 border-t border-gray-50">
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">Cost</div>
                      <div className={`font-mono font-bold text-lg ${cannotAfford ? 'text-red-500' : 'text-[#33503C]'}`}>
                        {reward.pointsRequired} pts
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xs font-medium text-gray-500 mb-1">Stock</div>
                      <div className="font-semibold text-gray-700">
                        {isOutOfStock ? "Out" : reward.stock}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    {isAdmin ? (
                      <Button
                        className="w-full font-medium bg-[#33503C] hover:bg-[#33503C]/90 text-white"
                        onClick={() => openView(reward)}
                      >
                        View Details
                      </Button>
                    ) : (
                      <Button
                        className={`w-full font-medium ${isOutOfStock || cannotAfford ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-[#33503C] hover:bg-[#33503C]/90 text-white'}`}
                        disabled={isOutOfStock || cannotAfford || isProcessing}
                        onClick={() => handleRedeem(reward.id, reward.pointsRequired)}
                      >
                        {isProcessing ? "Processing..." :
                         isOutOfStock ? "Out of Stock" :
                         cannotAfford ? "Insufficient Points" : "Redeem Now"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isAdmin && (
        <RecordDrawer 
          open={drawerOpen} 
          onOpenChange={setDrawerOpen} 
          title="Add New Reward"
          loading={isSaving}
          onSave={() => document.getElementById('create-reward-form-btn')?.click()}
        >
          <form id="create-reward-form" onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reward Name</label>
              <input name="name" required className="w-full border border-gray-300 rounded-md p-2 focus:ring-[#33503C] focus:border-[#33503C]" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" rows={3} className="w-full border border-gray-300 rounded-md p-2 focus:ring-[#33503C] focus:border-[#33503C]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Point Cost</label>
                <input name="pointsRequired" type="number" min="1" required className="w-full border border-gray-300 rounded-md p-2 focus:ring-[#33503C] focus:border-[#33503C]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                <input name="stock" type="number" min="1" required className="w-full border border-gray-300 rounded-md p-2 focus:ring-[#33503C] focus:border-[#33503C]" />
              </div>
            </div>

            <button type="submit" id="create-reward-form-btn" className="hidden" />
          </form>
        </RecordDrawer>
      )}

      <RecordDrawer
        open={!!viewReward}
        onOpenChange={(o) => !o && setViewReward(null)}
        title="Reward Details"
        loading={savingStock}
        onSave={saveStock}
        onDiscard={() => setViewReward(null)}
      >
        {viewReward && (
          <div className="space-y-5">
            <div className="h-40 bg-gray-100 rounded-xl flex items-center justify-center text-5xl">
              {rewardEmoji(viewReward.name)}
            </div>
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xl font-semibold text-gray-900">{viewReward.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${viewReward.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {viewReward.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">{viewReward.description || 'No description provided.'}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="text-xs font-medium text-gray-500 mb-1">Point Cost</div>
              <div className="font-mono font-bold text-lg text-[#33503C]">{viewReward.pointsRequired} pts</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
              <input
                type="number"
                min={0}
                value={stockEdit}
                onChange={(e) => setStockEdit(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-[#33503C] focus:border-[#33503C]"
              />
              <p className="text-xs text-gray-400 mt-1">Adjust stock and press Save to update the catalog.</p>
            </div>
          </div>
        )}
      </RecordDrawer>
    </div>
  );
}
