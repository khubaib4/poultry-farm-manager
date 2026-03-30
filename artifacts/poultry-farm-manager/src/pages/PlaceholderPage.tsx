import React from "react";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Construction className="h-16 w-16 text-slate-300 mb-4" />
      <h2 className="text-xl font-semibold text-slate-700 mb-2">{title}</h2>
      <p className="text-sm text-slate-500">
        {description || "This page is coming soon."}
      </p>
    </div>
  );
}
