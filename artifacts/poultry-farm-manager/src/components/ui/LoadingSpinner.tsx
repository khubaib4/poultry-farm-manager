import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

const sizeMap = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" };
const textSize = { sm: "text-xs", md: "text-sm", lg: "text-base" };

export default function LoadingSpinner({ size = "md", text, className = "" }: LoadingSpinnerProps): React.ReactElement {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-12 ${className}`}>
      <Loader2 className={`${sizeMap[size]} animate-spin text-emerald-600`} />
      {text && <p className={`${textSize[size]} text-gray-500`}>{text}</p>}
    </div>
  );
}
