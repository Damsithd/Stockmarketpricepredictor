"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  // General Info
  const [name, setName] = useState(session?.user?.name || "");
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loadingPass, setLoadingPass] = useState(false);
  const [passMsg, setPassMsg] = useState("");

  if (isPending) return <div className="p-10 text-center animate-pulse text-gray-400">Loading...</div>;
  if (!session) {
    router.push("/sign-in");
    return null;
  }

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingInfo(true);
    setInfoMsg("");
    
    const { error } = await authClient.updateUser({ name });
    
    setLoadingInfo(false);
    if (error) setInfoMsg(`❌ ${error.message}`);
    else setInfoMsg("✅ Profile updated successfully!");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPass(true);
    setPassMsg("");
    
    const { error } = await authClient.changePassword({
      newPassword: newPassword,
      currentPassword: currentPassword,
      revokeOtherSessions: true,
    });
    
    setLoadingPass(false);
    if (error) setPassMsg(`❌ ${error.message}`);
    else {
      setPassMsg("✅ Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
        <p className="text-gray-400">Manage your profile and security preferences.</p>
      </div>

      {/* General Info */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
        <h2 className="text-xl font-semibold mb-4 text-white">General Information</h2>
        <form onSubmit={handleUpdateInfo} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email (Read Only)</label>
            <input 
              type="text" 
              value={session.user.email} 
              disabled 
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Display Name</label>
            <input 
              type="text" 
              value={name || session.user.name || ""} 
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-950 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          {infoMsg && <p className="text-sm font-medium">{infoMsg}</p>}
          <button 
            type="submit" 
            disabled={loadingInfo}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center min-w-[140px]"
          >
            {loadingInfo ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Security */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
        <h2 className="text-xl font-semibold mb-4 text-white">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Current Password</label>
            <input 
              type="password" 
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-gray-950 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
            <input 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2.5 bg-gray-950 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          {passMsg && <p className="text-sm font-medium">{passMsg}</p>}
          <button 
            type="submit" 
            disabled={loadingPass}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center min-w-[140px]"
          >
            {loadingPass ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
