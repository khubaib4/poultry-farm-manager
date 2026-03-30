import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isElectron } from "@/lib/api";
import FarmCard from "@/components/farms/FarmCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { Plus, Building2 } from "lucide-react";

interface Farm {
  id: number;
  name: string;
  location?: string | null;
  capacity?: number | null;
  isActive?: number | null;
  loginUsername?: string | null;
  createdAt?: string | null;
}

export default function FarmsListPage(): React.ReactElement {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFarms = async () => {
    if (!isElectron() || !user) {
      setIsLoading(false);
      return;
    }

    try {
      const result = await window.electronAPI.farms.getAll(user.id);
      if (result.success && result.data) {
        setFarms(result.data as Farm[]);
      } else {
        setError(result.error || "Failed to load farms");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load farms");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFarms();
  }, [user]);

  const handleDelete = async (farmId: number) => {
    if (!isElectron()) return;
    try {
      const result = await window.electronAPI.farms.delete(farmId);
      if (result.success) {
        setFarms((prev) =>
          prev.map((f) => (f.id === farmId ? { ...f, isActive: 0 } : f))
        );
      } else {
        setError(result.error || "Failed to deactivate farm");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate farm");
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading farms..." />;
  }

  if (error && farms.length === 0) {
    return <ErrorState message={error} onRetry={loadFarms} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Farms</h2>
          <p className="text-gray-500 mt-1">
            {farms.length} farm{farms.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <button
          onClick={() => navigate("/owner/add-farm")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Farm
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {farms.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState
            icon={<Building2 className="h-8 w-8" />}
            title="No farms yet"
            description="You haven't added any farms yet. Click 'Add Farm' to get started."
            actionLabel="Add Your First Farm"
            onAction={() => navigate("/owner/add-farm")}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {farms.map((farm) => (
            <FarmCard
              key={farm.id}
              farm={farm}
              onClick={() => navigate(`/owner/farms`)}
              onEdit={() => navigate(`/owner/farms`)}
              onViewDashboard={() => navigate(`/owner/farms`)}
              onDelete={() => handleDelete(farm.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
