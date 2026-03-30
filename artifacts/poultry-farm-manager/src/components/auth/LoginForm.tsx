import React, { useState } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";

interface LoginFormProps {
  mode: "owner" | "farm";
  onSubmit: (credentials: { identifier: string; password: string }) => void;
  isLoading: boolean;
  error: string | null;
}

export default function LoginForm({
  mode,
  onSubmit,
  isLoading,
  error,
}: LoginFormProps): React.ReactElement {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (mode === "owner") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) {
        setValidationError("Please enter a valid email address");
        return;
      }
    } else {
      if (identifier.length < 4) {
        setValidationError("Username must be at least 4 characters");
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(identifier)) {
        setValidationError("Username must be alphanumeric (letters, numbers, underscores)");
        return;
      }
    }

    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters");
      return;
    }

    onSubmit({ identifier, password });
  };

  const displayError = validationError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {displayError && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {displayError}
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="identifier"
          className="text-sm font-medium text-foreground"
        >
          {mode === "owner" ? "Email Address" : "Farm Username"}
        </label>
        <input
          id="identifier"
          type={mode === "owner" ? "email" : "text"}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder={
            mode === "owner" ? "owner@example.com" : "farm_username"
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isLoading}
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-sm font-medium text-foreground"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
}
