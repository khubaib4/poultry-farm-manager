import React from "react";
import { useNavigate } from "react-router-dom";
import { Phone, MapPin, Building2, Edit, Eye, Trash2 } from "lucide-react";
import type { Customer } from "@/types/electron";
import CategoryBadge from "./CategoryBadge";

interface CustomerCardProps {
  customer: Customer;
  onDelete?: (customer: Customer) => void;
}

export default function CustomerCard({ customer, onDelete }: CustomerCardProps): React.ReactElement {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{customer.name}</h3>
          {customer.businessName && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
              <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{customer.businessName}</span>
            </div>
          )}
        </div>
        <CategoryBadge category={customer.category} />
      </div>

      <div className="space-y-1.5 mb-4">
        {customer.phone && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Phone className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{customer.phone}</span>
          </div>
        )}
        {customer.address && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{customer.address}</span>
          </div>
        )}
      </div>

      {customer.isActive === 0 && (
        <div className="mb-3">
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
            Inactive
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <button
          onClick={() => navigate(`/farm/customers/${customer.id}`)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </button>
        <button
          onClick={() => navigate(`/farm/customers/${customer.id}/edit`)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Edit className="h-3.5 w-3.5" />
          Edit
        </button>
        <button
          onClick={() => onDelete?.(customer)}
          className="flex items-center justify-center p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete permanently"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
