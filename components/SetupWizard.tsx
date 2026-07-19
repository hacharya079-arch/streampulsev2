import React, { useState } from 'react';
import { 
  Shield, 
  Globe, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  ChevronLeft, 
  RefreshCcw,
  Check
} from 'lucide-react';

interface SetupWizardProps {
  onSetupComplete: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onSetupComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [deploymentMode, setDeploymentMode] = useState<'auto' | 'lan' | 'public' | 'domain'>('auto');
  const [customDomain, setCustomDomain] = useState('');
  const [sslOption, setSslOption] = useState<'letsencrypt' | 'skip'>('skip');

  const validateStep = () => {
    setError(null);
    if (step === 1) {
      if (!username || username.trim().length < 3) {
        setError('Username must be at least 3 characters long.');
        return false;
      }
      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return false;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return false;
      }
    }
    if (step === 3 && deploymentMode === 'domain') {
      if (!customDomain || !customDomain.includes('.')) {
        setError('Please enter a valid domain name (e.g. stream.example.com).');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    
    // Skip Step 3 if Domain is not selected
    if (step === 2 && deploymentMode !== 'domain') {
      setStep(4);
    } else {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setError(null);
    if (step === 4 && deploymentMode !== 'domain') {
      setStep(2);
    } else {
      setStep(prev => prev - 1);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/setup/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          deploymentMode,
          customDomain: deploymentMode === 'domain' ? customDomain : '',
          sslOption
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete configuration setup.');
      }
      
      onSetupComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-teal-500 to-purple-500"></div>
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 rounded-xl border border-blue-500/20">
              <Shield className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-zinc-100">StreamPulse Installation Wizard</h1>
              <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider mt-0.5">First-Time System Configuration</p>
            </div>
          </div>
          <div className="text-xs font-mono font-semibold text-zinc-400 bg-zinc-950 border border-zinc-850 px-2.5 py-1 rounded-lg">
            Step {step} of 5
          </div>
        </div>

        {/* Content Box */}
        <div className="p-6 sm:p-8 flex-grow space-y-6 min-h-[280px]">
          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2.5 animate-pulse">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Create Administrator Account */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-zinc-100">Create Administrator Account</h2>
                <p className="text-xs text-zinc-400">Establish the master supervisor security credentials. Standard passwords must be at least 6 characters long.</p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Username</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-zinc-100"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Password</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-zinc-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Confirm Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-zinc-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Deployment Mode */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-zinc-100">Select Deployment Mode</h2>
                <p className="text-xs text-zinc-400">Specify how StreamPulse resolves routing endpoints for your active streams.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { id: 'auto', label: 'Auto Detect', desc: 'Resolves dynamically in order: Domain → Public IP → LAN IP.' },
                  { id: 'lan', label: 'Local LAN', desc: 'Forces server endpoints to resolve to the local network IP.' },
                  { id: 'public', label: 'Public IP', desc: 'Forces server endpoints to resolve to the external IPv4 gateway.' },
                  { id: 'domain', label: 'Custom Domain', desc: 'Resolves all channels and players to a fully qualified domain.' }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setDeploymentMode(mode.id as any)}
                    className={`flex flex-col text-left p-3.5 rounded-xl border transition ${deploymentMode === mode.id ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-zinc-950 border-zinc-850 hover:border-zinc-700 text-zinc-300'}`}
                  >
                    <span className="text-xs font-bold">{mode.label}</span>
                    <span className="text-[10px] text-zinc-500 mt-1 leading-normal">{mode.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Domain Entry (Conditional) */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-zinc-100">Configure Domain Name</h2>
                <p className="text-xs text-zinc-400">Provide the FQDN that is currently set up to point to this server's public IP address via DNS A-record.</p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Domain Name</label>
                  <input 
                    type="text" 
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="e.g. stream.yourbrand.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-zinc-100 font-mono"
                  />
                  <span className="text-[9px] text-zinc-500 leading-normal block">Make sure your domain points directly to your VPS IP before proceeding.</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SSL Settings */}
          {step === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-zinc-100">Configure SSL Management</h2>
                <p className="text-xs text-zinc-400">Enable modern HTTPS secure connection protocols using Let's Encrypt standalone certificates.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  onClick={() => setSslOption('letsencrypt')}
                  className={`flex flex-col text-left p-4 rounded-xl border transition ${sslOption === 'letsencrypt' ? 'bg-emerald-600/10 border-emerald-500 text-emerald-400' : 'bg-zinc-950 border-zinc-850 hover:border-zinc-700 text-zinc-300'}`}
                >
                  <span className="text-xs font-bold flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Use Let's Encrypt
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-1 leading-normal">Automatically requests, registers, and provisions standard SSL certificates.</span>
                </button>

                <button
                  onClick={() => setSslOption('skip')}
                  className={`flex flex-col text-left p-4 rounded-xl border transition ${sslOption === 'skip' ? 'bg-zinc-800/20 border-zinc-700 text-zinc-400' : 'bg-zinc-950 border-zinc-850 hover:border-zinc-700 text-zinc-300'}`}
                >
                  <span className="text-xs font-bold">Skip SSL Setup</span>
                  <span className="text-[10px] text-zinc-500 mt-1 leading-normal">Bypasses Let's Encrypt. The platform will operate over standard HTTP.</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Final Review */}
          {step === 5 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-zinc-100">Finish System Setup</h2>
                <p className="text-xs text-zinc-400">Review your deployment parameters. Click finish to save configuration and initialize the panel.</p>
              </div>

              <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4.5 space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-zinc-900 pb-2">
                  <span className="text-zinc-500">Admin Account</span>
                  <span className="text-zinc-300 font-bold">{username}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-2">
                  <span className="text-zinc-500">Deployment Mode</span>
                  <span className="text-blue-400 font-bold uppercase">{deploymentMode}</span>
                </div>
                {deploymentMode === 'domain' && (
                  <div className="flex justify-between border-b border-zinc-900 pb-2">
                    <span className="text-zinc-500">Target Domain</span>
                    <span className="text-emerald-400 font-bold">{customDomain}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-500">SSL Certificate</span>
                  <span className={`font-bold ${sslOption === 'letsencrypt' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {sslOption === 'letsencrypt' ? "Let's Encrypt" : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-between gap-4">
          {step > 1 ? (
            <button
              onClick={handleBack}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 text-zinc-300 rounded-xl text-xs font-semibold transition disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div></div>
          )}

          {step < 5 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-blue-950/20"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={loading}
              className="flex items-center gap-1.5 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-950/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> Finalizing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Finish Setup
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
