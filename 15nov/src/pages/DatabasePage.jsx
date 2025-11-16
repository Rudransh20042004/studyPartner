import { useState, useEffect } from 'react';
import { Database } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import LoginPage from './LoginPage';

const DatabasePage = () => {
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [user, setUser] = useState(null);

  // auth listener
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshDatabase = async () => {
    setIsLoading(true);
    try {
      // Fetch profiles (users)
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, student_id, full_name, created_at')
        .order('created_at', { ascending: true });

      if (pErr) throw pErr;

      const userList = (profiles || []).map(row => ({
        studentId: row.student_id,
        name: row.full_name,
        registeredAt: new Date(row.created_at).toLocaleString(),
        id: row.id
      }));

      // Fetch sessions
      const { data: sess, error: sErr } = await supabase
        .from('sessions')
        .select('id, name, student_id, course_code, working_on, location, status, last_active')
        .order('last_active', { ascending: false });

      if (sErr) throw sErr;

      const now = Date.now();
      const sessionList = (sess || []).map(row => {
        const lastActiveTs = row.last_active ? new Date(row.last_active).getTime() : 0;
        const ageSec = Math.floor((now - lastActiveTs) / 1000);
        const isActive = (now - lastActiveTs) < 300000; // 5 minutes

        return {
          id: row.id,
          name: row.name,
          studentId: row.student_id,
          courseCode: row.course_code,
          workingOn: row.working_on,
          location: row.location,
          status: row.status,
          lastActive: row.last_active ? new Date(row.last_active).toLocaleString() : '—',
          age: `${Math.floor(ageSec/60)}m ${ageSec%60}s`,
          isActive,
        };
      });

      setUsers(userList);
      setSessions(sessionList);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('Error refreshing database:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshDatabase();
      const interval = setInterval(refreshDatabase, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // If not signed in, show login page
  if (!user) {
    return <LoginPage onSuccess={() => refreshDatabase()} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Database View</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={refreshDatabase}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
            {lastRefresh && (
              <span className="text-sm text-gray-500">Last refresh: {lastRefresh}</span>
            )}
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                setUser(null);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Sign out
            </button>
            <a
              href="/"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ← Back to App
            </a>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users Table */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Registered Users ({users.length})
            </h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Student ID</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                          No users registered
                        </td>
                      </tr>
                    ) : (
                      users.map((user, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-gray-900">{user.studentId}</td>
                          <td className="px-4 py-3 text-gray-900 font-semibold">{user.name}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{user.registeredAt}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sessions Table */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Active Sessions ({sessions.filter(s => s.isActive).length} / {sessions.length})
            </h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Course</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Age</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sessions.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                          No sessions
                        </td>
                      </tr>
                    ) : (
                      sessions.map((session, idx) => (
                        <tr 
                          key={idx} 
                          className={`hover:bg-gray-50 ${!session.isActive ? 'opacity-60' : ''}`}
                        >
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-semibold text-gray-900">{session.name}</div>
                              <div className="text-xs font-mono text-gray-500">{session.studentId}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono font-semibold text-blue-600">{session.courseCode}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${session.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                              <span className="text-xs capitalize">{session.status}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{session.age}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Storage Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Storage Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Users:</span>
              <span className="ml-2 font-semibold text-gray-900">{users.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Sessions:</span>
              <span className="ml-2 font-semibold text-gray-900">{sessions.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Active Sessions:</span>
              <span className="ml-2 font-semibold text-green-600">{sessions.filter(s => s.isActive).length}</span>
            </div>
            <div>
              <span className="text-gray-600">Expired Sessions:</span>
              <span className="ml-2 font-semibold text-gray-600">{sessions.filter(s => !s.isActive).length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabasePage;
