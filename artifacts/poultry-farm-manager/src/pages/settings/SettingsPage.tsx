import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Settings, User, Sliders, Building2, Bell, Database, Info, RotateCcw } from "lucide-react";
import ProfileSettings from "./ProfileSettings";
import PreferencesSettings from "./PreferencesSettings";
import FarmSettings from "./FarmSettings";
import NotificationSettings from "./NotificationSettings";
import DataManagementSettings from "./DataManagementSettings";
import AboutPage from "./AboutPage";

type Tab = "profile" | "preferences" | "farm" | "notifications" | "data" | "about";

interface TabConfig {
  id: Tab;
  label: string;
  icon: React.ReactNode;
  ownerOnly?: boolean;
  farmOnly?: boolean;
}

const tabs: TabConfig[] = [
  { id: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
  { id: "preferences", label: "Preferences", icon: <Sliders className="h-4 w-4" /> },
  { id: "farm", label: "Farm Settings", icon: <Building2 className="h-4 w-4" />, farmOnly: true },
  { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { id: "data", label: "Data Management", icon: <Database className="h-4 w-4" /> },
  { id: "about", label: "About", icon: <Info className="h-4 w-4" /> },
];

export default function SettingsPage(): React.ReactElement {
  const { user } = useAuth();
  const { resetSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const visibleTabs = tabs.filter((tab) => {
    if (tab.ownerOnly && user?.type !== "owner") return false;
    if (tab.farmOnly && user?.type === "owner") return false;
    return true;
  });

  const handleResetDefaults = async () => {
    await resetSettings();
    setShowResetConfirm(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile": return <ProfileSettings />;
      case "preferences": return <PreferencesSettings />;
      case "farm": return <FarmSettings />;
      case "notifications": return <NotificationSettings />;
      case "data": return <DataManagementSettings />;
      case "about": return <AboutPage />;
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-7 w-7 text-emerald-600" />
            Settings
          </h1>
          <p className="text-gray-500 mt-1">Manage your account and application preferences</p>
        </div>
        {activeTab === "preferences" && (
          <div>
            {showResetConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Reset all preferences?</span>
                <button onClick={handleResetDefaults} className="px-3 py-1.5 text-xs font-medium text-red-700 border border-red-300 rounded-lg hover:bg-red-50">
                  Yes, Reset
                </button>
                <button onClick={() => setShowResetConfirm(false)} className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset to Defaults
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-6">
        <nav className="w-52 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left ${
                  activeTab === tab.id
                    ? "bg-emerald-50 text-emerald-700 border-l-2 border-emerald-600"
                    : "text-gray-600 hover:bg-gray-50 border-l-2 border-transparent"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="flex-1 min-w-0">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
