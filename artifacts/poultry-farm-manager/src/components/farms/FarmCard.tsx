import React from "react";
import { MapPin, Bird, Calendar, MoreVertical } from "lucide-react";

interface FarmCardProps {
  farm: {
    id: number;
    name: string;
    location?: string | null;
    capacity?: number | null;
    isActive?: number | null;
    loginUsername?: string | null;
    createdAt?: string | null;
  };
  onClick?: () => void;
  onEdit?: () => void;
  onViewDashboard?: () => void;
  onDelete?: () => void;
}

export default function FarmCard({
  farm,
  onClick,
  onEdit,
  onViewDashboard,
  onDelete,
}: FarmCardProps): React.ReactElement {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div
      className="bg-white rounded-xl border hover:shadow-md transition-shadow cursor-pointer relative"
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-slate-900 text-lg">{farm.name}</h3>
            {farm.location && (
              <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>{farm.location}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                farm.isActive !== 0
                  ? "bg-green-50 text-green-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {farm.isActive !== 0 ? "Active" : "Inactive"}
            </span>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                    }}
                  />
                  <div className="absolute right-0 top-full mt-1 z-20 w-40 rounded-lg border bg-white shadow-lg py-1">
                    {onViewDashboard && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(false);
                          onViewDashboard();
                        }}
                        className="w-full px-3 py-2 text-sm text-left text-slate-700 hover:bg-slate-50"
                      >
                        View Dashboard
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(false);
                          onEdit();
                        }}
                        className="w-full px-3 py-2 text-sm text-left text-slate-700 hover:bg-slate-50"
                      >
                        Edit Farm
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(false);
                          onDelete();
                        }}
                        className="w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50"
                      >
                        Delete Farm
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-500">
          {farm.capacity != null && (
            <div className="flex items-center gap-1.5">
              <Bird className="h-3.5 w-3.5" />
              <span>{Number(farm.capacity ?? 0).toLocaleString()} birds</span>
            </div>
          )}
          {farm.createdAt && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{new Date(farm.createdAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {farm.loginUsername && (
          <div className="mt-3 pt-3 border-t text-xs text-slate-400">
            Login: <span className="font-mono text-slate-500">{farm.loginUsername}</span>
          </div>
        )}
      </div>
    </div>
  );
}
