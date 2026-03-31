import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isElectron } from "@/lib/api";
import { generateUsername, generatePassword } from "@/lib/utils";
import FarmCredentialsModal from "@/components/farms/FarmCredentialsModal";
import { Loader2, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { z } from "zod";

const farmSchema = z.object({
  name: z.string().min(3, "Farm name must be at least 3 characters").max(50, "Farm name must be at most 50 characters"),
  location: z.string().min(5, "Location must be at least 5 characters").max(200, "Location must be at most 200 characters"),
  loginUsername: z.string().min(4, "Username must be at least 4 characters").max(20, "Username must be at most 20 characters").regex(/^[a-zA-Z0-9_]+$/, "Username must be alphanumeric with underscores only"),
  loginPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export default function AddFarmPage(): React.ReactElement {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    loginUsername: "",
    loginPassword: generatePassword(),
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [createdFarm, setCreatedFarm] = useState<{
    name: string;
    username: string;
    password: string;
  } | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const checkUsername = useCallback(async (username: string) => {
    if (!isElectron() || username.length < 4) {
      setUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    try {
      const result = await window.electronAPI.farms.checkUsername(username);
      if (result.success && result.data) {
        setUsernameAvailable(result.data.available);
      }
    } catch {
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.loginUsername.length >= 4) {
        checkUsername(formData.loginUsername);
      } else {
        setUsernameAvailable(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.loginUsername, checkUsername]);

  useEffect(() => {
    if (formData.name.length >= 3 && !formData.loginUsername) {
      setFormData((prev) => ({
        ...prev,
        loginUsername: generateUsername(prev.name),
      }));
    }
  }, [formData.name]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleRegenerateUsername = () => {
    setFormData((prev) => ({
      ...prev,
      loginUsername: generateUsername(prev.name || "farm"),
    }));
  };

  const handleRegeneratePassword = () => {
    setFormData((prev) => ({ ...prev, loginPassword: generatePassword() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = farmSchema.safeParse(formData);

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        errors[field] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    if (usernameAvailable === false) {
      setFieldErrors((prev) => ({
        ...prev,
        loginUsername: "This username is already taken",
      }));
      return;
    }

    if (!isElectron()) {
      setError("This feature is only available in the desktop app");
      return;
    }

    setIsLoading(true);

    try {
      const result = await window.electronAPI.farms.create({
        ownerId: user!.id,
        name: parsed.data.name,
        location: parsed.data.location,
        loginUsername: parsed.data.loginUsername,
        loginPassword: parsed.data.loginPassword,
      });

      if (result.success) {
        setCreatedFarm({
          name: parsed.data.name,
          username: parsed.data.loginUsername,
          password: parsed.data.loginPassword,
        });
      } else {
        setError(result.error || "Failed to create farm");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDone = () => {
    navigate("/owner/dashboard", { replace: true });
  };

  const handleAddAnother = () => {
    setCreatedFarm(null);
    setFormData({
      name: "",
      location: "",
      loginUsername: "",
      loginPassword: generatePassword(),
    });
    setFieldErrors({});
    setError(null);
  };

  const inputClass = (field: string) =>
    `flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
      fieldErrors[field]
        ? "border-destructive bg-destructive/5"
        : "border-input bg-background"
    }`;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Add New Farm</h2>
        <p className="text-slate-500 mt-1">
          Set up a new farm with login credentials for farm-level access.
        </p>
      </div>

      <div className="max-w-xl">
        <div className="bg-white rounded-xl border p-6">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-700">
                Farm Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Green Valley Poultry Farm"
                className={inputClass("name")}
                disabled={isLoading}
                autoFocus
              />
              {fieldErrors.name && (
                <p className="text-xs text-destructive">{fieldErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium text-slate-700">
                Location / Address <span className="text-red-500">*</span>
              </label>
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., 123 Farm Road, Springfield"
                className={inputClass("location")}
                disabled={isLoading}
              />
              {fieldErrors.location && (
                <p className="text-xs text-destructive">{fieldErrors.location}</p>
              )}
            </div>

            <div className="border-t pt-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Farm Login Credentials
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                These credentials allow logging into the app with farm-level access
                (no owner privileges).
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="loginUsername" className="text-sm font-medium text-slate-700">
                    Farm Username <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="loginUsername"
                      name="loginUsername"
                      type="text"
                      value={formData.loginUsername}
                      onChange={handleChange}
                      placeholder="farm_username"
                      className={inputClass("loginUsername") + " flex-1"}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={handleRegenerateUsername}
                      className="shrink-0 rounded-md border border-slate-200 px-3 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                      title="Generate new username"
                      disabled={isLoading}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                  {fieldErrors.loginUsername && (
                    <p className="text-xs text-destructive">{fieldErrors.loginUsername}</p>
                  )}
                  {!fieldErrors.loginUsername && formData.loginUsername.length >= 4 && (
                    <div className="flex items-center gap-1 text-xs">
                      {checkingUsername ? (
                        <span className="text-slate-400">Checking availability...</span>
                      ) : usernameAvailable === true ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Username available
                        </span>
                      ) : usernameAvailable === false ? (
                        <span className="text-red-600 flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> Username already taken
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="loginPassword" className="text-sm font-medium text-slate-700">
                    Farm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="loginPassword"
                      name="loginPassword"
                      type="text"
                      value={formData.loginPassword}
                      onChange={handleChange}
                      className={inputClass("loginPassword") + " flex-1 font-mono"}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={handleRegeneratePassword}
                      className="shrink-0 rounded-md border border-slate-200 px-3 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                      title="Generate new password"
                      disabled={isLoading}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                  {fieldErrors.loginPassword && (
                    <p className="text-xs text-destructive">{fieldErrors.loginPassword}</p>
                  )}
                  <p className="text-xs text-slate-400">
                    Auto-generated strong password. You can customize it or regenerate.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Farm"
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate("/owner/dashboard")}
                disabled={isLoading}
                className="rounded-lg border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {createdFarm && (
        <FarmCredentialsModal
          farmName={createdFarm.name}
          username={createdFarm.username}
          password={createdFarm.password}
          onDone={handleDone}
          onAddAnother={handleAddAnother}
        />
      )}
    </div>
  );
}
