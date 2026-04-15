import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isElectron } from "@/lib/api";
import FarmCard from "@/components/farms/FarmCard";
import { Building2, Plus, Loader2 } from "lucide-react";

interface Farm {
  id: number;
  name: string;
  location?: string | null;
  capacity?: number | null;
  isActive?: number | null;
  loginUsername?: string | null;
  createdAt?: string | null;
}

export default function OwnerDashboard(): React.ReactElement {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFarms = async () => {
      if (!isElectron() || !user) {
        setIsLoading(false);
        return;
      }
      try {
        const result = await window.electronAPI.farms.getAll(user.id);
        if (result.success && result.data) {
          const farmList = result.data as Farm[];
          setFarms(farmList);
          if (farmList.length === 0) {
            navigate("/owner/add-farm", { replace: true });
            return;
          }
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    loadFarms();
  }, [user, navigate]);

  const [error, setError] = useState<string | null>(null);
  const activeFarms = farms.filter((f) => f.isActive !== 0);
  const totalCapacity = activeFarms.reduce((sum, f) => sum + (f.capacity || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Welcome back, {user?.name}
        </h2>
        <p className="text-slate-500 mt-1">
          Manage all your farms from here.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-slate-500">Total Farms</p>
          <p className="text-3xl font-bold mt-1 text-blue-700">
            {activeFarms.length}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-slate-500">Total Capacity</p>
          <p className="text-3xl font-bold mt-1 text-green-700">
            {Number(totalCapacity ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-slate-500">Today's Eggs</p>
          <p className="text-3xl font-bold mt-1 text-amber-700">--</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Your Farms</h3>
        <button
          onClick={() => navigate("/owner/add-farm")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Farm
        </button>
      </div>

      {farms.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-slate-700 mb-1">No farms yet</h4>
          <p className="text-sm text-slate-500 mb-4">
            Add your first farm to start managing your poultry operations.
          </p>
          <button
            onClick={() => navigate("/owner/add-farm")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Your First Farm
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {farms.map((farm) => (
            <FarmCard
              key={farm.id}
              farm={farm}
              onClick={() => navigate(`/owner/farms/${farm.id}/dashboard`)}
              onEdit={() => navigate("/owner/farms")}
              onViewDashboard={() => navigate(`/owner/farms/${farm.id}/dashboard`)}
              onDelete={async () => {
                if (!isElectron()) return;
                try {
                  const result = await window.electronAPI.farms.delete(farm.id);
                  if (result.success) {
                    setFarms((prev) =>
                      prev.map((f) =>
                        f.id === farm.id ? { ...f, isActive: 0 } : f
                      )
                    );
                  } else {
                    setError(result.error || "Failed to deactivate farm");
                  }
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed to deactivate farm");
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
