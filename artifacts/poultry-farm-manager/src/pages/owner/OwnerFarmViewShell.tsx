import React from "react";
import { Outlet, useParams, Navigate, Link } from "react-router-dom";
import { ArrowLeft, Building2 } from "lucide-react";
import { OwnerFarmViewProvider } from "@/contexts/OwnerFarmViewContext";
import { farms, isElectron } from "@/lib/api";
import { useEffect, useState } from "react";

export default function OwnerFarmViewShell(): React.ReactElement {
  const { farmId: farmIdParam } = useParams<{ farmId: string }>();
  const farmId = farmIdParam ? Number(farmIdParam) : NaN;
  const [farmName, setFarmName] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!isElectron() || Number.isNaN(farmId)) return;
    void farms
      .getById(farmId)
      .then((f) => {
        setFarmName((f as { name?: string })?.name ?? null);
        setDenied(false);
      })
      .catch(() => {
        setDenied(true);
        setFarmName(null);
      });
  }, [farmId]);

  if (!farmIdParam || Number.isNaN(farmId)) {
    return <Navigate to="/owner/farms" replace />;
  }

  if (denied) {
    return (
      <div className="p-6 max-w-lg">
        <p className="text-red-700 font-medium">You do not have access to this farm.</p>
        <Link to="/owner/farms" className="mt-4 inline-block text-primary font-medium">
          Back to farms
        </Link>
      </div>
    );
  }

  return (
    <OwnerFarmViewProvider farmId={farmId}>
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950 flex flex-wrap items-center justify-between gap-2">
        <span>
          <span className="font-medium">Owner view</span>
          {farmName ? (
            <>
              {" "}
              — <span className="text-amber-900">{farmName}</span>
            </>
          ) : null}
          . Data is read-only; use the farm login to record entries or sales.
        </span>
        <Link
          to="/owner/dashboard"
          className="inline-flex items-center gap-1 font-medium text-amber-900 hover:underline shrink-0"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Owner dashboard
        </Link>
      </div>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
        <Building2 className="h-6 w-6 text-primary shrink-0" aria-hidden />
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-gray-900 truncate">{farmName ?? `Farm #${farmId}`}</h1>
          <Link to="/owner/farms" className="text-sm text-gray-500 hover:text-gray-800">
            All farms
          </Link>
        </div>
      </div>
      <Outlet />
    </OwnerFarmViewProvider>
  );
}
