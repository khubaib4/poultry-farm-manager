import React, { useState } from "react";
import { Copy, Check, AlertTriangle, X } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";

interface FarmCredentialsModalProps {
  farmName: string;
  username: string;
  password: string;
  onDone: () => void;
  onAddAnother?: () => void;
}

export default function FarmCredentialsModal({
  farmName,
  username,
  password,
  onDone,
  onAddAnother,
}: FarmCredentialsModalProps): React.ReactElement {
  const [saved, setSaved] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, field: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleCopyAll = async () => {
    const text = `Farm: ${farmName}\nUsername: ${username}\nPassword: ${password}`;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedField("all");
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Farm Created Successfully
          </h2>
          {saved && (
            <button
              onClick={onDone}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-slate-600">
            <strong>{farmName}</strong> has been created. Here are the login
            credentials for this farm:
          </p>

          <div className="space-y-3">
            <div className="rounded-lg border bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Username</p>
                  <p className="font-mono text-sm font-medium text-slate-900">
                    {username}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(username, "username")}
                  className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-600 transition-colors"
                  title="Copy username"
                >
                  {copiedField === "username" ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-lg border bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Password</p>
                  <p className="font-mono text-sm font-medium text-slate-900">
                    {password}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(password, "password")}
                  className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-600 transition-colors"
                  title="Copy password"
                >
                  {copiedField === "password" ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleCopyAll}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-1.5"
          >
            {copiedField === "all" ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy All Credentials
              </>
            )}
          </button>

          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">
              Save these credentials now. The password cannot be recovered once
              this dialog is closed. You can reset it later, but the current
              password will be lost.
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={saved}
              onChange={(e) => setSaved(e.target.checked)}
              className="rounded border-slate-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-slate-700">
              I have saved these credentials
            </span>
          </label>
        </div>

        <div className="flex items-center gap-3 px-6 pb-6">
          {onAddAnother && (
            <button
              onClick={onAddAnother}
              disabled={!saved}
              className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              Add Another Farm
            </button>
          )}
          <button
            onClick={onDone}
            disabled={!saved}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
