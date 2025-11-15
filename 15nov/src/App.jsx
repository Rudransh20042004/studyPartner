import { useState, useEffect } from 'react';
import Login from './components/Login';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard';
import DatabasePage from './pages/DatabasePage';
import { createSession, getMySession, leaveSession, findSessionByStudentId } from './utils/storage';
import './App.css';

function App() {
  const [view, setView] = useState('login');
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  // Check if we're on the database page
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/database' || path === '/database.html') {
      setView('database');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        if (window.storage) {
          // Check for user info
          const userName = await window.storage.get('user_name', false);
          const userStudentId = await window.storage.get('user_student_id', false);
          
          if (userName?.value && userStudentId?.value) {
            const userData = { name: userName.value, studentId: userStudentId.value };
            setUser(userData);
            
            // Check if user has an active session by Student ID
            const session = await findSessionByStudentId(userStudentId.value);
            if (session) {
              // Restore session - set my_session_id to this session
              await window.storage.set('my_session_id', session.id, false);
              console.log('✅ Restored active session for student:', userStudentId.value);
              setView('dashboard');
            } else {
              // No active session, check if there's a stored session ID (legacy)
              const mySession = await getMySession();
              if (mySession && mySession.studentId === userStudentId.value) {
                const now = Date.now();
                if (now - mySession.lastActive < 300000) {
                  setView('dashboard');
                } else {
                  await leaveSession();
                  setView('landing');
                }
              } else {
                setView('landing');
              }
            }
          } else {
            setView('login');
          }
        }
      } catch (e) {
        console.error('Error checking auth:', e);
        setView('login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

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
        // Restore active session
        await window.storage.set('my_session_id', existingSession.id, false);
        console.log('✅ Restored active session on login');
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

  const handleStartStudying = async (courseCode, workingOn, location) => {
    if (!user || !user.studentId) {
      alert('Please login first');
      return;
    }
    
    // Get user name from storage (might have been set on landing page)
    let userName = user.name;
    if (!userName && window.storage) {
      const nameData = await window.storage.get('user_name', false);
      userName = nameData?.value;
    }
    
    if (!userName) {
      alert('Please enter your name');
      return;
    }
    
    try {
      await createSession(userName, user.studentId, courseCode, workingOn, location);
      // Update user state with name
      setUser({ ...user, name: userName });
      setView('dashboard');
    } catch (e) {
      console.error('Error starting session:', e);
      throw e;
    }
  };

  const handleLeave = () => {
    setView('landing');
  };

  const handleLogout = async () => {
    try {
      await leaveSession();
      if (window.storage) {
        await window.storage.delete('user_name', false);
        await window.storage.delete('user_student_id', false);
      }
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

  return (
    <div className="App">
      {view === 'login' ? (
        <Login onLogin={handleLogin} />
      ) : view === 'landing' ? (
        <Landing onStartStudying={handleStartStudying} user={user} />
      ) : (
        <Dashboard onLeave={handleLeave} onLogout={handleLogout} user={user} />
      )}
    </div>
  );
}

export default App;
