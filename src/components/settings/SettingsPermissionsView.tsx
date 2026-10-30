'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  LayoutDashboard, 
  ReceiptText, 
  Layers, 
  Boxes, 
  FileSpreadsheet, 
  PlaneTakeoff, 
  Send, 
  Receipt, 
  Building2, 
  Settings, 
  Trash2, 
  Lock, 
  Sparkles,
  Info,
  Shield,
  KeyRound
} from 'lucide-react';
import { 
  UserAccount, 
  NavPageId, 
  ALL_TAB_IDS,
  getUserEffectiveTabs
} from '@/types/iata';

interface SettingsPermissionsViewProps {
  currentUser: UserAccount;
  users: UserAccount[];
  onUpdateUserPermissions: (userId: string, newPermissions: NavPageId[]) => void;
  onUpdateUserRole: (userId: string, newRole: 'admin' | 'user') => void;
  onAddUser: (user: UserAccount) => void;
  onToggleUserStatus: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  onResetUserPermissions: (userId: string) => void;
  onSimulateUser?: (user: UserAccount) => void;
}

export const ALL_SIDEBAR_TABS: { id: NavPageId; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'AWB lifecycle overview & operational metrics' },
  { id: 'docket', label: 'Create Docket', icon: ReceiptText, description: 'Cargo counter intake & dimensional cubing' },
  { id: 'stock', label: 'AWB Stock', icon: Layers, description: 'Resolution 600b Mod-7 serial inventory' },
  { id: 'bookings', label: 'Bookings', icon: Boxes, description: 'Shipment booking & L×W×H÷6000 cubing' },
  { id: 'mawb', label: 'MAWB & HAWB', icon: FileSpreadsheet, description: 'Consolidation, parity check & multi-copy print' },
  { id: 'manifest', label: 'Flight Manifest', icon: PlaneTakeoff, description: 'Flight-wise consolidation & handover lock' },
  { id: 'eawb', label: 'e-AWB EDI', icon: Send, description: 'Cargo-IMP FWB/FHL teletype dispatch' },
  { id: 'billing', label: 'Rates & CASS', icon: Receipt, description: 'Tariff slabs, 18% GST & CASS clearing' },
  { id: 'invoice-generation', label: 'Invoice Generation', icon: ReceiptText, description: 'Invoice workflow, receivables & payment tracking' },
  { id: 'master', label: 'Master Data', icon: Building2, description: 'Airlines, airports, partners & issuing agent' },
  { id: 'settings', label: 'Settings', icon: Settings, description: 'User management & individual access control' },
];

export const SettingsPermissionsView: React.FC<SettingsPermissionsViewProps> = ({
  currentUser,
  users,
  onUpdateUserPermissions,
  onUpdateUserRole,
  onAddUser,
  onToggleUserStatus,
  onDeleteUser,
  onResetUserPermissions,
  onSimulateUser,
}) => {
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // New User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserStation, setNewUserStation] = useState('DEL / T3');
  const [newUserSelectedTabs, setNewUserSelectedTabs] = useState<NavPageId[]>([
    'dashboard',
    'docket',
    'bookings',
  ]);

  const triggerNotice = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  // Toggle single tab permission for an individual user
  const handleToggleTab = (targetUser: UserAccount, tabId: NavPageId) => {
    if (targetUser.role === 'admin' || targetUser.username.toLowerCase() === 'admin') {
      triggerNotice('Admins strictly have full access to all modules and cannot be modified.');
      return;
    }

    const currentTabs = targetUser.permissions || [];
    const updatedTabs = currentTabs.includes(tabId)
      ? currentTabs.filter((id) => id !== tabId)
      : [...currentTabs, tabId];

    onUpdateUserPermissions(targetUser.id, updatedTabs);
    triggerNotice(`Updated ${targetUser.username}&apos;s access for ${ALL_SIDEBAR_TABS.find(t => t.id === tabId)?.label}`);
  };

  // Allow all tabs for a specific user
  const handleAllowAllForUser = (targetUser: UserAccount) => {
    if (targetUser.role === 'admin' || targetUser.username.toLowerCase() === 'admin') return;
    onUpdateUserPermissions(targetUser.id, ALL_TAB_IDS);
    triggerNotice(`Enabled all ${ALL_SIDEBAR_TABS.length} sidebar modules for ${targetUser.username}`);
  };

  // Clear all tabs for a specific user
  const handleClearAllForUser = (targetUser: UserAccount) => {
    if (targetUser.role === 'admin' || targetUser.username.toLowerCase() === 'admin') return;
    onUpdateUserPermissions(targetUser.id, []);
    triggerNotice(`Revoked all modules for ${targetUser.username}`);
  };

  // Submit new user
  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newFullName.trim() || !newPassword.trim()) return;

    if (users.some((u) => u.username.toLowerCase() === newUsername.trim().toLowerCase())) {
      triggerNotice('A user with this username already exists.');
      return;
    }

    const createdUser: UserAccount = {
      id: `usr-${Date.now()}`,
      username: newUsername.trim().toLowerCase(),
      password: newPassword,
      fullName: newFullName.trim(),
      role: newUserRole,
      email: newUserEmail.trim() || `${newUsername.trim()}@iata-cargo.org`,
      stationCode: newUserStation.trim() || 'DEL Hub',
      isActive: true,
      permissions: newUserRole === 'admin' ? ALL_TAB_IDS : newUserSelectedTabs,
    };

    onAddUser(createdUser);
    setShowAddUserModal(false);
    setNewUsername('');
    setNewPassword('');
    setNewFullName('');
    setNewUserEmail('');
    setNewUserSelectedTabs(['dashboard', 'docket', 'bookings']);
    triggerNotice(`User ${createdUser.fullName} (${createdUser.username}) created with role "${createdUser.role}"!`);
  };

  const filteredUsers = users.filter((u) => 
    u.username.toLowerCase().includes(searchFilter.toLowerCase()) ||
    u.fullName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    u.stationCode.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-heading">
              User Permissions &amp; Access Control
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold font-mono">
              Individual RBAC
            </span>
          </div>
          <p className="text-sm sm:text-base text-slate-500 mt-1 font-sans">
            Every user login has its own independent tab permissions. Admins have strict full access; users have selective access configured below.
          </p>
        </div>

        <button
          onClick={() => setShowAddUserModal(true)}
          className="px-5 py-2.5 bg-[#2C5EAD] hover:bg-[#204580] text-white rounded-xl text-sm font-bold font-heading flex items-center gap-2 transition-all shadow-md shadow-[#2C5EAD]/20 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Role Explainer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-purple-50/80 to-indigo-50/50 rounded-2xl border border-purple-200 p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-purple-600 text-white font-mono shadow-xs">
              👑 ROLE: ADMIN
            </span>
            <span className="text-xs font-bold text-purple-700 font-mono">10 / 10 Modules Locked</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 font-heading pt-1">
            Complete &amp; Unrestricted Access
          </h3>
          <p className="text-xs text-slate-600 font-sans leading-relaxed">
            Admins strictly have full access to all sidebar modules (including Settings &amp; Permissions). Permissions for admins cannot be revoked to safeguard administrative control.
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50/80 to-sky-50/50 rounded-2xl border border-blue-200 p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#2C5EAD] text-white font-mono shadow-xs">
              👤 ROLE: USER
            </span>
            <span className="text-xs font-bold text-[#2C5EAD] font-mono">Selective Individual Access</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 font-heading pt-1">
            Separate Permissions Per Login
          </h3>
          <p className="text-xs text-slate-600 font-sans leading-relaxed">
            Permissions are <strong>not grouped</strong>: each user account has its own independent checklist. Different users can have completely different tabs enabled based on their station duties.
          </p>
        </div>
      </div>

      {/* Live Feedback Notice */}
      {feedbackNotice && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm font-medium flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#2C5EAD] shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
          <span className="text-xs font-mono text-blue-600 font-bold">Instant Sidebar Update</span>
        </div>
      )}

      {/* USER PERMISSIONS MATRIX & INTERFACE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-xl font-bold font-heading text-slate-900 flex items-center gap-2.5">
              <Users className="w-5 h-5 text-[#2C5EAD]" />
              <span>User-Level Tab Permissions Matrix</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-sans mt-0.5">
              Click checkboxes in each user&apos;s row to customize which sidebar tabs they can view and access.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search user by name or station..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD] w-60"
            />
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse font-sans text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold font-heading text-slate-600 uppercase tracking-wider">
                <th className="py-4 px-5 min-w-[240px]">User Account</th>
                <th className="py-4 px-4 min-w-[120px]">Role</th>
                {ALL_SIDEBAR_TABS.map((tab) => {
                  const TabIcon = tab.icon;
                  return (
                    <th key={tab.id} className="py-4 px-2.5 text-center min-w-[95px]" title={tab.description}>
                      <div className="flex flex-col items-center justify-center gap-1">
                        <div className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs text-[#2C5EAD]">
                          <TabIcon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-800 normal-case leading-tight text-center">
                          {tab.label}
                        </span>
                      </div>
                    </th>
                  );
                })}
                <th className="py-4 px-4 text-center min-w-[110px]">Access Count</th>
                <th className="py-4 px-5 text-right min-w-[160px]">User Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((userItem) => {
                const isAdmin = userItem.role === 'admin' || userItem.username.toLowerCase() === 'admin';
                const effectiveTabs = getUserEffectiveTabs(userItem);
                const count = effectiveTabs.length;
                const total = ALL_SIDEBAR_TABS.length;

                return (
                  <tr key={userItem.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* User profile */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs ${
                          isAdmin 
                            ? 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                            : 'bg-gradient-to-tr from-[#2C5EAD] to-[#1591DC]'
                        }`}>
                          {userItem.username.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5 font-heading text-sm">
                            <span>{userItem.fullName}</span>
                            {userItem.id === currentUser.id && (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-blue-50 text-[#2C5EAD] border border-blue-200">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            @{userItem.username} • {userItem.stationCode}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role Dropdown */}
                    <td className="py-4 px-4">
                      {userItem.username === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-purple-50 text-purple-700 border border-purple-200">
                          👑 Admin
                        </span>
                      ) : (
                        <select
                          value={userItem.role}
                          onChange={(e) => {
                            const newRole = e.target.value as 'admin' | 'user';
                            onUpdateUserRole(userItem.id, newRole);
                            triggerNotice(`Changed ${userItem.username}&apos;s role to "${newRole}".`);
                          }}
                          className={`px-2 py-1 rounded-lg border text-xs font-bold font-mono focus:outline-none ${
                            isAdmin 
                              ? 'bg-purple-50 border-purple-200 text-purple-700'
                              : 'bg-blue-50 border-blue-200 text-[#2C5EAD]'
                          }`}
                        >
                          <option value="user">👤 User</option>
                          <option value="admin">👑 Admin</option>
                        </select>
                      )}
                    </td>

                    {/* Interactive Tab Checkboxes for each sidebar module */}
                    {ALL_SIDEBAR_TABS.map((tab) => {
                      const isAllowed = effectiveTabs.includes(tab.id);

                      return (
                        <td key={tab.id} className="py-3 px-2 text-center">
                          {isAdmin ? (
                            <div className="inline-flex items-center justify-center p-1.5 text-purple-500" title="Admin strictly has access to all modules">
                              <Lock className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <label className="inline-flex items-center justify-center cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                              <input
                                type="checkbox"
                                checked={isAllowed}
                                onChange={() => handleToggleTab(userItem, tab.id)}
                                className="w-4 h-4 rounded text-[#2C5EAD] focus:ring-[#2C5EAD] border-slate-300 cursor-pointer"
                              />
                            </label>
                          )}
                        </td>
                      );
                    })}

                    {/* Access Count Badge */}
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                        isAdmin
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : count === total
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : count === 0
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-blue-50 text-[#2C5EAD] border border-blue-200'
                      }`}>
                        {count} / {total} Tabs
                      </span>
                    </td>

                    {/* Actions per user */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAllowAllForUser(userItem)}
                              className="text-[11px] font-bold text-[#2C5EAD] hover:underline"
                              title="Allow all tabs for this user"
                            >
                              All
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              onClick={() => handleClearAllForUser(userItem)}
                              className="text-[11px] font-bold text-slate-500 hover:text-slate-800"
                              title="Clear all tabs for this user"
                            >
                              None
                            </button>
                          </>
                        )}

                        {onSimulateUser && (
                          <button
                            type="button"
                            onClick={() => {
                              onSimulateUser(userItem);
                              triggerNotice(`Previewing application exactly as user "${userItem.username}" sees it!`);
                            }}
                            className="p-1.5 rounded-lg text-[#1591DC] hover:bg-sky-50 transition-colors"
                            title={`Preview sidebar as @${userItem.username}`}
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                        )}

                        {userItem.username !== 'admin' && userItem.id !== currentUser.id && (
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteUser(userItem.id);
                              triggerNotice(`User ${userItem.username} removed.`);
                            }}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                            title="Delete user account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Security Rule Explanation */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
          <Info className="w-4 h-4 text-[#2C5EAD] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Individual Access Rule:</strong> When an individual user logs in, the platform checks their specific <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-[#2C5EAD]">permissions</code> array. If role is <span className="font-bold text-purple-700">admin</span>, all modules are automatically unlocked. If role is <span className="font-bold text-[#2C5EAD]">user</span>, only the checked modules appear in their sidebar navigation.
          </p>
        </div>
      </div>

      {/* MODAL: ADD USER */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-7 space-y-6 my-8">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold font-heading text-slate-900">Add New Station User</h3>
              <p className="text-xs text-slate-500 mt-1">Create user credentials and configure their individual sidebar access.</p>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Deepak Verma"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. deepak_v"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Station Code
                  </label>
                  <input
                    type="text"
                    placeholder="DEL / Airside"
                    value={newUserStation}
                    onChange={(e) => setNewUserStation(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              {/* Role Selection (admin vs user) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                  Role Assignment *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                    newUserRole === 'user' 
                      ? 'border-[#2C5EAD] bg-blue-50/50 shadow-xs' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="user"
                      checked={newUserRole === 'user'}
                      onChange={() => setNewUserRole('user')}
                      className="text-[#2C5EAD] focus:ring-[#2C5EAD]"
                    />
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">👤 User</span>
                      <span className="text-[11px] text-slate-500">Selective custom tabs</span>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                    newUserRole === 'admin' 
                      ? 'border-purple-600 bg-purple-50/50 shadow-xs' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={newUserRole === 'admin'}
                      onChange={() => setNewUserRole('admin')}
                      className="text-purple-600 focus:ring-purple-600"
                    />
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">👑 Admin</span>
                      <span className="text-[11px] text-slate-500">Strictly all {ALL_SIDEBAR_TABS.length} modules</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Individual Tab Checklist (Only for User role) */}
              {newUserRole === 'user' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Initial Permitted Modules for this User:
                    </label>
                    <div className="space-x-2 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setNewUserSelectedTabs(ALL_TAB_IDS)}
                        className="text-[#2C5EAD] hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setNewUserSelectedTabs([])}
                        className="text-slate-500 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {ALL_SIDEBAR_TABS.map((tab) => {
                      const isChecked = newUserSelectedTabs.includes(tab.id);
                      return (
                        <label key={tab.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setNewUserSelectedTabs(newUserSelectedTabs.filter(id => id !== tab.id));
                              } else {
                                setNewUserSelectedTabs([...newUserSelectedTabs, tab.id]);
                              }
                            }}
                            className="rounded text-[#2C5EAD] focus:ring-[#2C5EAD] w-3.5 h-3.5"
                          />
                          <span className="font-medium text-slate-800">{tab.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#2C5EAD] hover:bg-[#204580] text-white text-xs font-bold font-heading rounded-xl shadow-md shadow-[#2C5EAD]/20"
                >
                  Save User &amp; Permissions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
