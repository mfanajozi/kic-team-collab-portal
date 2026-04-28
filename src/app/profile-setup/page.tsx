'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { applyUserTheme, DEFAULT_COLOR, COLOUR_OPTIONS, AVATAR_OPTIONS } from '@/lib/theme';

export default function ProfileSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [screenName, setScreenName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (typeof window !== 'undefined') applyUserTheme(color);

  async function handleFinish() {
    if (!screenName.trim()) { setError('Screen name is required'); return; }
    if (!avatar) { setError('Please select an avatar'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screen_name: screenName.trim(), avatar, color }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to save profile'); return; }
      router.push('/companies');
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden user-glow">
            <img src="images/kic-logo.png" alt="KIC Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-white">Set Up Your Profile</h1>
          <p className="text-white/40 text-sm mt-1">Step {step} of 3</p>
          <div className="flex gap-2 justify-center mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 w-12 rounded-full transition-colors ${
                  s <= step 
                    ? 'user-glow' 
                    : 'bg-white/10'
                }`}
                style={{ background: s <= step ? 'rgba(var(--ur),var(--ug),var(--ub),0.9)' : undefined }}
              />
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-8">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Choose a screen name</h2>
                <p className="text-sm text-white/50 mb-4">This is how you appear to the team.</p>
                <input
                  type="text"
                  maxLength={20}
                  value={screenName}
                  onChange={(e) => setScreenName(e.target.value)}
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                  placeholder="Your name"
                />
                <p className="text-xs text-white/30 mt-1 text-right">{screenName.length}/20</p>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                onClick={() => {
                  if (!screenName.trim()) { setError('Screen name is required'); return; }
                  setError(''); setStep(2);
                }}
                className="user-btn w-full py-3 rounded-xl font-semibold text-sm"
              >
                Next →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Pick your avatar</h2>
                <p className="text-sm text-white/50 mb-4">Tap an emoji to select it.</p>
                <div className="grid grid-cols-4 gap-3">
                  {AVATAR_OPTIONS.map(({ emoji, label }) => (
                    <button
                      key={emoji}
                      title={label}
                      onClick={() => setAvatar(emoji)}
                      className={`text-2xl py-3 rounded-xl border-2 transition-all ${
                        avatar === emoji
                          ? 'border-white/40 bg-white/10 scale-110'
                          : 'border-white/10 hover:border-white/25'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => { setError(''); setStep(1); }}
                  className="flex-1 py-3 rounded-xl glass-card text-white/60 font-semibold text-sm hover:text-white transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={() => {
                    if (!avatar) { setError('Please select an avatar'); return; }
                    setError(''); setStep(3);
                  }}
                  className="flex-1 py-3 rounded-xl user-btn font-semibold text-sm"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Choose your colour</h2>
                <p className="text-sm text-white/50 mb-4">Your accent colour throughout the portal.</p>
                <div className="grid grid-cols-4 gap-3">
                  {COLOUR_OPTIONS.map(({ hex, name }) => (
                    <button
                      key={hex}
                      title={name}
                      onClick={() => { setColor(hex); if (typeof window !== 'undefined') applyUserTheme(hex); }}
                      className={`h-12 rounded-xl border-4 transition-all ${
                        color === hex ? 'border-white scale-110' : 'border-transparent hover:scale-102'
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-8 h-8 rounded-lg user-glow" style={{ backgroundColor: color }} />
                  <span className="text-sm text-white/60">
                    {COLOUR_OPTIONS.find((c) => c.hex === color)?.name}
                  </span>
                </div>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => { setError(''); setStep(2); }}
                  className="flex-1 py-3 rounded-xl glass-card text-white/60 font-semibold text-sm hover:text-white transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl user-btn font-semibold text-sm disabled:opacity-50"
                >
                  {loading ? 'Saving…' : 'Finish ✓'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}