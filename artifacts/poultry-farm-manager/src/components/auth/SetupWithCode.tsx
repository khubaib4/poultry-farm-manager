import React, { useState } from "react";
import { QrCode, ArrowLeft, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { setup } from "@/lib/api";

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

type Step = "enter" | "validating" | "applying" | "success" | "error";

export default function SetupWithCode({ onBack, onSuccess }: Props): React.ReactElement {
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("enter");
  const [farmName, setFarmName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();

    if (!code.trim()) {
      setError("Please enter a setup code");
      return;
    }

    setStep("validating");
    setError("");

    try {
      const validation = await setup.validateCode(code.trim());

      if (!validation.valid) {
        setError(validation.error || "Invalid setup code");
        setStep("error");
        return;
      }

      setFarmName(validation.farmName || "Farm");
      setStep("applying");

      const result = await setup.applyCode(code.trim());

      if (result.success) {
        setMessage(result.message);
        setStep("success");
      } else {
        setError("Failed to apply setup code");
        setStep("error");
      }
    } catch (err) {
      setError(String(err));
      setStep("error");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <QrCode className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Setup with Code</h1>
            <p className="text-gray-500 text-sm">Enter the code from your farm owner</p>
          </div>
        </div>

        {step === "enter" && (
          <form onSubmit={(e) => void handleSubmit(e)}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Setup Code</label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="PF-xxxxx..."
                className="w-full px-4 py-3 border rounded-lg font-mono text-sm resize-none h-24"
                autoFocus
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
              Setup Device
            </button>
          </form>
        )}

        {(step === "validating" || step === "applying") && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">
              {step === "validating" ? "Validating code..." : `Setting up ${farmName}...`}
            </p>
            <p className="text-gray-400 text-sm mt-2">This may take a moment</p>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-green-600 mb-2">Setup Complete!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              type="button"
              onClick={onSuccess}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Go to Login
            </button>
          </div>
        )}

        {step === "error" && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-red-600 mb-2">Setup Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              type="button"
              onClick={() => {
                setStep("enter");
                setError("");
              }}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
