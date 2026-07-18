import React from 'react';
import { 
  RefreshCcw, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Network, 
  Tv, 
  Check, 
  Copy, 
  Terminal, 
  PlayCircle, 
  User, 
  Shield, 
  Globe 
} from 'lucide-react';

interface SettingsPageProps {
  token: string | null;
  currentUser: any;
  deploymentMode: 'auto' | 'lan' | 'public' | 'domain';
  setDeploymentMode: (mode: 'auto' | 'lan' | 'public' | 'domain') => void;
  detectedLanIp: string;
  detectedPublicIp: string;
  customDomain: string;
  setCustomDomain: (domain: string) => void;
  networkDetails: any;
  networkLoading: boolean;
  networkSuccess: string;
  setNetworkSuccess: (msg: string) => void;
  networkError: string;
  setNetworkError: (msg: string) => void;
  fetchNetworkDetails: () => Promise<void>;
  fetchStreams: () => Promise<void>;
  handleApplyNetworkChanges: () => Promise<void>;
  
  securityLoading: boolean;
  securitySuccess: string;
  setSecuritySuccess: (msg: string) => void;
  securityError: string;
  setSecurityError: (msg: string) => void;
  newAdminUsername: string;
  setNewAdminUsername: (username: string) => void;
  newAdminPassword: string;
  setNewAdminPassword: (password: string) => void;
  confirmAdminPassword: string;
  setConfirmAdminPassword: (password: string) => void;
  handleUpdatePersonalSecurity: (e: React.FormEvent) => Promise<void>;

  testingRtmp: boolean;
  rtmpTestResult: { success: boolean; message: string } | null;
  handleTestRtmp: () => Promise<void>;
  testingPlayback: boolean;
  playbackTestResult: { success: boolean; message: string } | null;
  handleTestPlayback: () => Promise<void>;

  copiedUrlKey: string | null;
  setCopiedUrlKey: (key: string | null) => void;

  // Admin section:
  adminTargetUser: string;
  setAdminTargetUser: (id: string) => void;
  adminUserPassword: string;
  setAdminUserPassword: (password: string) => void;
  adminForceReset: boolean;
  setAdminForceReset: (val: boolean) => void;
  usersList: any[];
  handleUpdateUserSecurity: (e: React.FormEvent) => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  token,
  currentUser,
  deploymentMode,
  setDeploymentMode,
  detectedLanIp,
  detectedPublicIp,
  customDomain,
  setCustomDomain,
  networkDetails,
  networkLoading,
  networkSuccess,
  setNetworkSuccess,
  networkError,
  setNetworkError,
  fetchNetworkDetails,
  fetchStreams,
  handleApplyNetworkChanges,
  securityLoading,
  securitySuccess,
  setSecuritySuccess,
  securityError,
  setSecurityError,
  newAdminUsername,
  setNewAdminUsername,
  newAdminPassword,
  setNewAdminPassword,
  confirmAdminPassword,
  setConfirmAdminPassword,
  handleUpdatePersonalSecurity,
  testingRtmp,
  rtmpTestResult,
  handleTestRtmp,
  testingPlayback,
  playbackTestResult,
  handleTestPlayback,
  copiedUrlKey,
  setCopiedUrlKey,
  adminTargetUser,
  setAdminTargetUser,
  adminUserPassword,
  setAdminUserPassword,
  adminForceReset,
  setAdminForceReset,
  usersList,
  handleUpdateUserSecurity
}) => {
  const [localNetworkLoading, setLocalNetworkLoading] = React.useState(false);

  const onRefreshNetworkInfo = async () => {
    setLocalNetworkLoading(true);
    try {
      await fetchNetworkDetails();
      await fetchStreams();
    } finally {
      setLocalNetworkLoading(false);
    }
  };

  return (
    <div className="space-y-8" id="settings-page-container">
      {/* Settings Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4" id="settings-header">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-1 text-zinc-100">Settings & Network Management</h2>
          <p className="text-zinc-400 text-sm">Configure VPS deployment modes, inspect dynamically resolved streaming endpoints, and update security credentials.</p>
        </div>
        <div className="flex gap-2">
          <button
            id="refresh-network-btn"
            onClick={onRefreshNetworkInfo}
            disabled={networkLoading || localNetworkLoading}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-100 rounded-xl text-xs font-semibold border border-zinc-700 transition disabled:opacity-50"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${networkLoading || localNetworkLoading ? 'animate-spin' : ''}`} />
            Refresh Network Information
          </button>
          <button
            id="save-network-changes-btn"
            onClick={handleApplyNetworkChanges}
            disabled={networkLoading || localNetworkLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            Apply Changes
          </button>
        </div>
      </div>

      {/* Success / Error Banners */}
      {networkSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-xs text-emerald-400 flex items-center gap-2" id="settings-network-success">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{networkSuccess}</span>
        </div>
      )}
      {networkError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-xs text-red-400 flex items-center gap-2" id="settings-network-error">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{networkError}</span>
        </div>
      )}

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="settings-bento-grid">
        {/* COLUMN 1: NETWORK CONFIGURATION */}
        <div className="space-y-6" id="settings-col-1">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
            <h3 className="font-bold text-zinc-100 flex items-center gap-2 text-base">
              <Network className="w-4 h-4 text-blue-500" /> Network Configuration
            </h3>

            {/* Deployment Mode */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Deployment Mode</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([
                  { key: 'auto', label: 'Auto Detect', desc: 'Prioritizes domain, then public, then LAN' },
                  { key: 'lan', label: 'Local LAN', desc: 'Forces local LAN IP address' },
                  { key: 'public', label: 'Public IP', desc: 'Forces public VPS IPv4 address' },
                  { key: 'domain', label: 'Domain', desc: 'Forces configured domain name' }
                ] as const).map(item => (
                  <button
                    key={item.key}
                    id={`mode-select-${item.key}`}
                    onClick={() => setDeploymentMode(item.key)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                      deploymentMode === item.key
                        ? 'bg-blue-600/15 border-blue-500 text-blue-400'
                        : 'bg-zinc-950 border-zinc-850 hover:border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <span className="text-xs font-bold mb-1">{item.label}</span>
                    <span className="text-[8px] leading-tight text-zinc-500">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Status Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Current LAN IP (Auto Detect)</label>
                <div className="bg-zinc-950 border border-zinc-855 rounded-lg px-3 py-2 text-xs font-mono text-zinc-300">
                  {detectedLanIp === 'Detecting...' || !detectedLanIp ? 'Endpoint unavailable' : detectedLanIp}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Current Public IP (Auto Detect)</label>
                <div className="bg-zinc-950 border border-zinc-855 rounded-lg px-3 py-2 text-xs font-mono text-zinc-300">
                  {detectedPublicIp === 'Detecting...' || !detectedPublicIp ? 'Endpoint unavailable' : detectedPublicIp}
                </div>
              </div>
            </div>

            {/* Configured Domain Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Configured Domain</label>
              <input
                id="settings-domain-input"
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="e.g. broadcast.streampulse.tv"
                className="w-full bg-zinc-950 border border-zinc-855 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
              />
              <span className="text-[9px] text-zinc-500 font-medium block">Custom DNS mapping. Domain mode requires setting this field correctly.</span>
            </div>

            {/* Active Endpoint */}
            <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 font-medium">Active Endpoint Target:</span>
                <span className="text-blue-400 font-mono font-semibold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  {networkDetails?.activeEndpoint || 'Endpoint unavailable'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 font-medium">Resolution Route Source:</span>
                <span className="text-amber-400 font-medium text-[10px] uppercase tracking-wider">
                  {networkDetails?.source || 'Endpoint unavailable'}
                </span>
              </div>
            </div>
          </div>

          {/* ACTIVE BACKEND PLAYBACK & INGEST ENDPOINTS */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h4 className="font-bold text-zinc-200 text-sm flex items-center gap-2">
              <Tv className="w-4 h-4 text-purple-400" /> Active VPS Ingest & Playback Endpoints
            </h4>
            
            <div className="space-y-3 bg-zinc-950 border border-zinc-850 p-4 rounded-xl">
              {/* Dashboard URL */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase">
                  <span>Dashboard URL</span>
                  <a id="dashboard-url-link" href={networkDetails?.dashboardUrl || '#'} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Open tab</a>
                </div>
                <div className="bg-zinc-900 border border-zinc-855 rounded px-2 py-1.5 text-xs font-mono text-zinc-300 truncate">
                  {networkDetails?.dashboardUrl || 'http://localhost'}
                </div>
              </div>

              {/* API Endpoint */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-zinc-500 uppercase">API Endpoints URL</div>
                <div className="bg-zinc-900 border border-zinc-855 rounded px-2 py-1.5 text-xs font-mono text-zinc-300 truncate">
                  {networkDetails?.apiUrl || 'http://localhost/api'}
                </div>
              </div>

              {/* RTMP Url */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-zinc-500 uppercase">RTMP Ingest URL</div>
                <div className="bg-zinc-900 border border-zinc-855 rounded px-2 py-1.5 text-xs font-mono text-blue-400 truncate flex justify-between items-center">
                  <span>{networkDetails?.rtmpUrl || 'rtmp://localhost/live'}</span>
                  <button
                    id="copy-rtmp-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(networkDetails?.rtmpUrl || 'rtmp://localhost/live');
                      setCopiedUrlKey('rtmp');
                      setTimeout(() => setCopiedUrlKey(null), 2000);
                    }}
                    className="text-zinc-500 hover:text-white transition"
                  >
                    {copiedUrlKey === 'rtmp' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* HLS Master */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-zinc-500 uppercase">HLS Playback Playlist (Master)</div>
                <div className="bg-zinc-900 border border-zinc-855 rounded px-2 py-1.5 text-xs font-mono text-purple-400 truncate">
                  {networkDetails?.hlsUrl ? networkDetails.hlsUrl.replace('{stream_key}', '••••••••') : 'http://localhost/hls/••••••••/master.m3u8'}
                </div>
              </div>
            </div>

            {/* Network Diagnostics buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                id="test-rtmp-btn"
                onClick={handleTestRtmp}
                disabled={testingRtmp}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-855 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
              >
                {testingRtmp ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Terminal className="w-3.5 h-3.5 text-blue-500" />}
                Test RTMP Ingest
              </button>
              <button
                id="test-playback-btn"
                onClick={handleTestPlayback}
                disabled={testingPlayback}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-855 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
              >
                {testingPlayback ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5 text-purple-500" />}
                Test Playback URL
              </button>
            </div>

            {/* Diagnostic results */}
            {rtmpTestResult && (
              <div className={`p-3 rounded-lg text-xs ${rtmpTestResult.success ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {rtmpTestResult.message}
              </div>
            )}
            {playbackTestResult && (
              <div className={`p-3 rounded-lg text-xs ${playbackTestResult.success ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {playbackTestResult.message}
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2: SECURITY & CREDENTIALS */}
        <div className="space-y-6" id="settings-col-2">
          {/* General / Personal Security Settings */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
            <h3 className="font-bold text-zinc-100 flex items-center gap-2 text-base">
              <User className="w-4 h-4 text-emerald-500" /> Personal Account Security
            </h3>

            {securitySuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-400">
                {securitySuccess}
              </div>
            )}
            {securityError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400">
                {securityError}
              </div>
            )}

            <form onSubmit={handleUpdatePersonalSecurity} className="space-y-4" id="personal-security-form">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Change Admin Username</label>
                <input
                  id="settings-username-input"
                  type="text"
                  placeholder={currentUser?.username || 'Current Username'}
                  value={newAdminUsername}
                  onChange={(e) => setNewAdminUsername(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none focus:ring-1 focus:ring-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">New Password</label>
                  <input
                    id="settings-password-input"
                    type="password"
                    placeholder="••••••••"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-855 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Confirm New Password</label>
                  <input
                    id="settings-confirm-password-input"
                    type="password"
                    placeholder="••••••••"
                    value={confirmAdminPassword}
                    onChange={(e) => setConfirmAdminPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-855 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <button
                id="update-credentials-btn"
                type="submit"
                disabled={securityLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-950/20"
              >
                {securityLoading ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                Update Account Credentials
              </button>
            </form>
          </div>

          {/* ADMIN SECURITY PANEL: USER POLICIES */}
          {currentUser?.role === 'admin' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
              <h3 className="font-bold text-zinc-100 flex items-center gap-2 text-base">
                <Shield className="w-4 h-4 text-red-500" /> Admin Security Console
              </h3>

              <form onSubmit={handleUpdateUserSecurity} className="space-y-4" id="admin-user-security-form">
                {/* Target User dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Target User</label>
                  <select
                    id="admin-target-user-select"
                    value={adminTargetUser}
                    onChange={(e) => setAdminTargetUser(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none focus:ring-1 focus:ring-red-500/50"
                  >
                    <option value="">-- Select User to Configure --</option>
                    {usersList
                      .filter(u => u.id !== currentUser?.id)
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.username} ({u.role})
                        </option>
                      ))}
                  </select>
                </div>

                {/* User custom password */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Override User Password</label>
                  <input
                    id="admin-override-password-input"
                    type="password"
                    placeholder="Enter new master override password"
                    value={adminUserPassword}
                    onChange={(e) => setAdminUserPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none focus:ring-1 focus:ring-red-500/50"
                  />
                </div>

                <div className="flex items-center gap-2 py-1">
                  <input
                    id="admin-force-reset-checkbox"
                    type="checkbox"
                    checked={adminForceReset}
                    onChange={(e) => setAdminForceReset(e.target.checked)}
                    className="rounded bg-zinc-950 border-zinc-800 text-red-600 focus:ring-0"
                  />
                  <label htmlFor="admin-force-reset-checkbox" className="text-xs text-zinc-400 font-medium select-none">
                    Force password change on next user session
                  </label>
                </div>

                <button
                  id="admin-apply-user-policy-btn"
                  type="submit"
                  disabled={securityLoading}
                  className="w-full bg-red-950/20 hover:bg-red-900/20 border border-red-900/30 text-red-400 text-xs font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <LockIcon className="w-3.5 h-3.5" />
                  Apply Forced Security Policy
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LockIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
