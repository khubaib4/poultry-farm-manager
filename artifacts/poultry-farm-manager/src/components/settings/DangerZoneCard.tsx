import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface DangerZoneCardProps {
  title: string;
  description: string;
  buttonText: string;
  onConfirm: () => Promise<void>;
  confirmMessage?: string;
  requirePassword?: boolean;
}

export default function DangerZoneCard({
  title,
  description,
  buttonText,
  onConfirm,
  confirmMessage,
  requirePassword,
}: DangerZoneCardProps): React.ReactElement {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [password, setPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (confirmMessage && confirmInput !== confirmMessage) return;
    setIsProcessing(true);
    setError(null);
    try {
      await onConfirm();
      setShowConfirm(false);
      setConfirmInput("");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="border border-red-200 rounded-xl bg-red-50/50 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-red-900">{title}</h4>
          <p className="text-xs text-red-700 mt-1">{description}</p>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="mt-3 px-3 py-1.5 text-xs font-medium text-red-700 border border-red-300 rounded-lg hover:bg-red-100"
            >
              {buttonText}
            </button>
          ) : (
            <div className="mt-3 space-y-3">
              {error && (
                <p className="text-xs text-red-600 bg-red-100 rounded p-2">{error}</p>
              )}

              {confirmMessage && (
                <div>
                  <p className="text-xs text-red-700 mb-1">
                    Type <span className="font-mono font-bold">{confirmMessage}</span> to confirm:
                  </p>
                  <input
                    type="text"
                    value={confirmInput}
                    onChange={(e) => setConfirmInput(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-red-300 rounded-lg"
                    placeholder={confirmMessage}
                  />
                </div>
              )}

              {requirePassword && (
                <div>
                  <label className="text-xs text-red-700 mb-1 block">Enter your password:</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-red-300 rounded-lg"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleConfirm}
                  disabled={isProcessing || (confirmMessage ? confirmInput !== confirmMessage : false) || (requirePassword ? !password : false)}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : "Confirm"}
                </button>
                <button
                  onClick={() => { setShowConfirm(false); setConfirmInput(""); setPassword(""); setError(null); }}
                  disabled={isProcessing}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
