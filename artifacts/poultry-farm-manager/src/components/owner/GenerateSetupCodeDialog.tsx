import React, { useState } from "react";
import { QrCode, Copy, Check, X, Loader2 } from "lucide-react";
import { setup } from "@/lib/api";

interface Props {
  farmId: number;
  farmName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function GenerateSetupCodeDialog({
  farmId,
  farmName,
  isOpen,
  onClose,
}: Props): React.ReactElement | null {
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [expiryDays, setExpiryDays] = useState(7);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(): Promise<void> {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await setup.generateCode(farmId, expiryDays);
      if (result.code) {
        setCode(result.code);
        setExpiresAt(result.expiresAt);
      } else {
        setError("Failed to generate code");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsGenerating(false);
    }
  }

  function handleCopy(): void {
    if (code) {
      void navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleClose(): void {
    setCode(null);
    setExpiresAt(null);
    setError(null);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <QrCode className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Generate Setup Code</h2>
              <p className="text-sm text-gray-500">{farmName}</p>
            </div>
          </div>
          <button type="button" onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!code ? (
          <>
            <p className="text-gray-600 mb-4">
              Generate a setup code that farm workers can use to set up the app on their device.
              They&apos;ll be able to login with their farm credentials after entering this code.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Code Expiry</label>
              <select
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value={1}>1 day</option>
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
            )}

            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={isGenerating}
              className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <QrCode className="w-5 h-5" />
              )}
              Generate Setup Code
            </button>
          </>
        ) : (
          <>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">Setup Code (share with farm worker):</p>
              <div className="font-mono text-sm break-all bg-white p-3 rounded border">{code}</div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>Expires: {expiresAt ? new Date(expiresAt).toLocaleDateString() : "—"}</span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 py-2 border rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Code
                  </>
                )}
              </button>
              <button type="button" onClick={handleClose} className="flex-1 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                Done
              </button>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <strong>Instructions for farm worker:</strong>
              <ol className="list-decimal ml-4 mt-1 space-y-1">
                <li>Install the Poultry Farm app</li>
                <li>Click &quot;Setup with Code&quot; on the login screen</li>
                <li>Enter this setup code</li>
                <li>Log in with farm username and password</li>
              </ol>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
