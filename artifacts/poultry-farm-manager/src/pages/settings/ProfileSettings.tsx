import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { profile as profileApi, owners, isElectron } from "@/lib/api";
import type { OwnerProfile, FarmProfile } from "@/types/electron";
import SettingSection from "@/components/settings/SettingSection";
import ChangePasswordForm from "@/components/settings/ChangePasswordForm";
import { User, Mail, Phone, Building2, Shield, CheckCircle, AlertTriangle } from "lucide-react";

export default function ProfileSettings(): React.ReactElement {
  const { user } = useAuth();
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null);
  const [farmProfile, setFarmProfile] = useState<FarmProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!isElectron() || !user) { setIsLoading(false); return; }
    const load = async () => {
      try {
        if (user.type === "owner") {
          const p = await profileApi.getOwnerProfile();
          setOwnerProfile(p);
          setEditName(p.name);
          setEditPhone(p.phone || "");
        } else {
          const p = await profileApi.getFarmProfile();
          setFarmProfile(p);
        }
      } catch {} finally { setIsLoading(false); }
    };
    load();
  }, [user]);

  const handleSaveOwnerProfile = async () => {
    if (!ownerProfile) return;
    setIsSaving(true);
    try {
      await owners.update(ownerProfile.id, { name: editName, phone: editPhone });
      setOwnerProfile({ ...ownerProfile, name: editName, phone: editPhone });
      setMessage({ type: "success", text: "Profile updated successfully" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Update failed" });
    } finally { setIsSaving(false); }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>;
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
          message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {message.text}
        </div>
      )}

      {user?.type === "owner" && ownerProfile && (
        <SettingSection title="Owner Profile" description="Manage your personal information">
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <User className="h-4 w-4" /> Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Mail className="h-4 w-4" /> Email
              </label>
              <input
                type="email"
                value={ownerProfile.email || ""}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Phone className="h-4 w-4" /> Phone
              </label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Enter phone number"
              />
            </div>
            <button
              onClick={handleSaveOwnerProfile}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </SettingSection>
      )}

      {user?.type === "farm" && farmProfile && (
        <SettingSection title="Farm Profile" description="Your farm account information">
          <div className="px-6 py-4 space-y-3">
            <div className="flex items-center gap-3 py-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Farm Name</p>
                <p className="text-sm font-medium text-gray-900">{farmProfile.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-2">
              <Shield className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Username</p>
                <p className="text-sm font-medium text-gray-900">{farmProfile.loginUsername}</p>
              </div>
            </div>
            {farmProfile.location && (
              <div className="flex items-center gap-3 py-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-sm font-medium text-gray-900">{farmProfile.location}</p>
                </div>
              </div>
            )}
          </div>
        </SettingSection>
      )}

      <SettingSection title="Change Password" description="Update your account password">
        <div className="px-6 py-4">
          <ChangePasswordForm />
        </div>
      </SettingSection>
    </div>
  );
}
