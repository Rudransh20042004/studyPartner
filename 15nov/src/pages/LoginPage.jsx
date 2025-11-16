import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LoginPage({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [fullName, setFullName] = useState('');
  const [showProfile, setShowProfile] = useState(false); // ask for ID+Name only when needed
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [resetSending, setResetSending] = useState(false);

  const isValidMcGillEmail = (value) =>
    /^[a-zA-Z0-9._%+-]+@mail\.mcgill\.ca$/.test(value.trim());

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      // Basic validations
      if (!isValidMcGillEmail(email)) {
        throw new Error('Please use your @mail.mcgill.ca email');
      }
      // Only require profile inputs when creating a new user
      if (showProfile) {
        if (!studentId || studentId.length !== 9) {
          throw new Error('Student ID must be 9 digits');
        }
        if (!fullName.trim()) {
          throw new Error('Please enter your full name');
        }
      }

      // If we are not in profile mode, try sign-in first
      if (!showProfile) {
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!signInErr && data?.user) {
          // Existing user successfully signed in → check profile completeness
          const { data: { user: authed } } = await supabase.auth.getUser();
          if (authed) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('student_id, full_name')
              .eq('user_id', authed.id)
              .maybeSingle();
            if (!profile || !profile.student_id || !profile.full_name) {
              // Ask for missing info right here
              setShowProfile(true);
              setMsg('Add your Student ID and Name to continue');
              setLoading(false);
              return;
            }
          }
          setMsg('Signed in');
          if (onSuccess) onSuccess();
          setLoading(false);
          return;
        }

        // Sign-in failed. Supabase returns the same message for wrong password and unknown user.
        // Probe by attempting sign-up: if "already registered" -> it's an existing user with wrong password.
        try {
          const { error: signupProbeErr } = await supabase.auth.signUp({ email, password });
          if (signupProbeErr) {
            const t = (signupProbeErr.message || '').toLowerCase();
            const already = t.includes('already registered') || signupProbeErr.status === 422;
            if (already) {
              setMsg('Incorrect password. Try again or use “Forgot password?”.');
            } else {
              setMsg(signupProbeErr.message || 'Sign-in failed');
            }
            setLoading(false);
            return;
          }
          // Sign-up created a new account → collect profile now
          setShowProfile(true);
          setMsg('Create your account by adding your Student ID and Name');
          setLoading(false);
          return;
        } catch (probeErr) {
          setMsg(probeErr?.message || 'Sign-in failed');
          setLoading(false);
          return;
        }
      }

      // Profile mode: create account, then upsert profile, then sign in
      const { error: upErr } = await supabase.auth.signUp({
        email,
        password,
      });
      if (upErr) {
        // If user already exists (race), ignore and proceed to sign-in
        const alreadyExists =
          (upErr.message || '').toLowerCase().includes('already registered') ||
          (upErr.status && upErr.status === 422);
        if (!alreadyExists) throw upErr;
      }

      const { data: signInData, error: signInAgainErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInAgainErr) throw signInAgainErr;

      // Upsert profile with studentId and fullName
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Enforce unique Student ID
        const { data: conflict } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('student_id', studentId)
          .neq('user_id', user.id)
          .maybeSingle();
        if (conflict) {
          throw new Error('This Student ID is already in use by another account.');
        }
        await supabase.from('profiles').upsert({
          user_id: user.id,
          student_id: studentId,
          full_name: fullName.trim(),
        });
      }

      setMsg('Signed in');
      if (onSuccess) onSuccess();
    } catch (err) {
      const text = (err?.message || '').toString();
      if (/security purposes/i.test(text) && /seconds/i.test(text)) {
        // suppress Supabase rate-limit message with a neutral hint
        setMsg('Please wait a few seconds and try again.');
      } else {
        setMsg(text || JSON.stringify(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      if (!isValidMcGillEmail(email)) {
        setMsg('Enter your @mail.mcgill.ca email above first.');
        return;
      }
      setResetSending(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin, // back to app to complete reset
      });
      if (error) throw error;
      setMsg('Password reset email sent. Check your inbox.');
    } catch (e) {
      setMsg(e?.message || 'Failed to send reset email');
    } finally {
      setResetSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:'linear-gradient(180deg, #fff6f7 0%, #ffffff 100%)'}}>
      <form onSubmit={handleAuth} className="w-full max-w-lg bg-white p-8 rounded-lg shadow-md">
        <div className="mb-4 text-center">
          <img src="/mcgill.png" alt="McGill crest" style={{height: 72, margin: '0 auto 10px'}} onError={(e)=>{ e.currentTarget.style.display='none'; }} />
          <img src="/myPeers.png" alt="myPeers" style={{height: 42, margin: '0 auto 6px'}} onError={(e)=>{ e.currentTarget.style.display='none'; }} />
          <p className="text-sm text-gray-500 mt-1">Sign in with your McGill email</p>
        </div>

        <label className="block mb-2 text-sm font-medium text-gray-700">McGill Email (@mail.mcgill.ca)</label>
        <input 
          type="email"
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          className="w-full p-2 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          required 
          placeholder="your.name@mail.mcgill.ca"
          onBlur={() => {
            if (email && !isValidMcGillEmail(email)) {
              setMsg('Please use your @mail.mcgill.ca email');
            }
          }}
        />

        {showProfile && (
          <>
            <label className="block mb-2 text-sm font-medium text-gray-700">Student ID (9 digits)</label>
            <input 
              inputMode="numeric"
              value={studentId}
              onChange={e => setStudentId(e.target.value.replace(/\D/g, '').slice(0, 9))}
              className="w-full p-2 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono" 
              required 
              placeholder="260123456"
              maxLength={9}
            />

            <label className="block mb-2 text-sm font-medium text-gray-700">Full Name</label>
            <input 
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full p-2 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              required 
              placeholder="Your full name"
            />
          </>
        )}

        <label className="block mb-2 text-sm font-medium text-gray-700">Password</label>
        <input 
          type="password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          className="w-full p-2 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          required 
          placeholder="••••••••"
        />
        <div className="mb-4 text-right">
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={resetSending}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            {resetSending ? 'Sending...' : 'Forgot password?'}
          </button>
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full py-2 bg-blue-600 text-white rounded-lg mb-3 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Working...' : (showProfile ? 'Create account' : 'Continue')}
        </button>

        {msg && (
          <div className={`mt-3 text-sm p-3 rounded-lg ${
            msg.includes('Signed in') 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {msg}
          </div>
        )}
      </form>
    </div>
  );
}

