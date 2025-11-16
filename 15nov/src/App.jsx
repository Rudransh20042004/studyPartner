import { useState, useEffect } from 'react';
import Login from './components/Login';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard';
import DatabasePage from './pages/DatabasePage';
import LoginPage from './pages/LoginPage';
import { supabase } from './lib/supabaseClient';
import { createSession, getMySession, findSessionByStudentId, checkUserExists } from './utils/storage';
import { createSessionSupabase, getMyActiveSessionSupabase, leaveSessionSupabase } from './utils/sessionsSupabase';
import './App.css';

function App() {
  const [view, setView] = useState('login');
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Check if we're on the database page
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/database' || path === '/database.html') {
      setView('database');
      setIsLoading(false);
    }
  }, []);

  // Supabase auth: check if there's an authenticated user
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setAuthUser(session.user);
        }
      } catch (e) {
        console.error('Error initializing Supabase auth:', e);
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // After Supabase auth, load profile and set local user state
    const loadUserProfile = async () => {
      try {
        if (!authUser) {
          setUser(null);
          setIsLoading(false);
          return;
        }
        const { data: prof } = await supabase
          .from('profiles')
          .select('student_id, full_name')
          .eq('user_id', authUser.id)
          .maybeSingle();
        if (prof) {
          setUser({ name: prof.full_name || null, studentId: prof.student_id || null });
        } else {
          setUser({ name: null, studentId: null });
        }
        // Decide initial view: if user has active session, go to dashboard; else landing
        try {
          const active = await getMyActiveSessionSupabase();
          if (active) {
            setView('dashboard');
          } else {
            setView('landing');
          }
        } catch {
          setView('landing');
        }
      } catch (e) {
        console.error('Error loading profile:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserProfile();
  }, [authUser]);

  const handleLogin = async (userData) => {
    setUser(userData);
    
    // If user has active session, go to dashboard
    if (userData.hasActiveSession) {
      setView('dashboard');
      return;
    }
    
    // If new user, go to landing to collect name and course
    if (userData.isNewUser) {
      setView('landing');
      return;
    }
    
    // Existing user but no active session - check if they have one
    try {
      const existingSession = await findSessionByStudentId(userData.studentId);
      if (existingSession) {
        setView('dashboard');
      } else {
        // No active session, go to landing page
        setView('landing');
      }
    } catch (e) {
      console.error('Error checking session on login:', e);
      setView('landing');
    }
  };

  const handleStartStudying = async (courseCode, workingOn, location, profile) => {
    // Prefer explicit profile; otherwise fetch from Supabase
    let effectiveStudentId = profile?.studentId || user?.studentId;
    let effectiveName = profile?.name || user?.name;

    if (!effectiveStudentId || !effectiveName) {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('student_id, full_name')
            .eq('user_id', authUser.id)
            .maybeSingle();
          if (prof) {
            effectiveStudentId = effectiveStudentId || prof.student_id;
            effectiveName = effectiveName || prof.full_name;
          }
        }
      } catch (e) {
        console.error('Failed to fetch profile from Supabase', e);
      }
    }

    if (!effectiveStudentId || !effectiveName) {
      alert('Please complete your profile (name and student ID)');
      return;
    }
    
    try {
      // Use Supabase sessions (no localStorage)
      await createSessionSupabase(effectiveName, effectiveStudentId, courseCode, workingOn, location);
      // Update user state with profile info
      setUser({ name: effectiveName, studentId: effectiveStudentId });
      setView('dashboard');
    } catch (e) {
      console.error('Error starting session:', e);
      alert(e?.message || 'Failed to start session. Please try again.');
    }
  };

  const handleLeave = () => {
    setView('landing');
  };

  const handleLogout = async () => {
    try {
      // Hard-delete any session for this user before logging out
      await leaveSessionSupabase();
      await supabase.auth.signOut();
      setUser(null);
      setView('login');
    } catch (e) {
      console.error('Error logging out:', e);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show database page if on /database route
  if (window.location.pathname === '/database' || window.location.pathname === '/database.html') {
    return <DatabasePage />;
  }

  // While Supabase auth state is loading, show a simple loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated with Supabase, show the Supabase email/password login page
  if (!authUser) {
    return <LoginPage onSuccess={() => { /* auth listener will update authUser state */ }} />;
  }

  return (
    <div className="App">
      {view === 'landing' ? (
        <Landing onStartStudying={handleStartStudying} user={user} onLogout={handleLogout} />
      ) : (
        <Dashboard onLeave={handleLeave} onLogout={handleLogout} user={user} />
      )}
    </div>
  );
}

export default App;
