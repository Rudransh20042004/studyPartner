import { useState, useEffect } from 'react';
import { Database, X } from 'lucide-react';

const DatabaseView = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const refreshDatabase = async () => {
    setIsLoading(true);
    try {
      // Get all registered users
      const userKeys = await window.storage.list('user_registry:', true);
      const userList = [];
      
      for (const key of userKeys.keys) {
        try {
          const data = await window.storage.get(key, true);
          if (data && data.value) {
            const userInfo = JSON.parse(data.value);
            userList.push({
              studentId: userInfo.studentId,
              name: userInfo.name,
              registeredAt: new Date(userInfo.registeredAt).toLocaleString(),
              key: key
            });
          }
        } catch (e) {
          console.error('Error parsing user:', key, e);
        }
      }

      // Get all sessions
      const sessionKeys = await window.storage.list('session:', true);
      const sessionList = [];
      const now = Date.now();
      
      for (const key of sessionKeys.keys) {
        try {
          const data = await window.storage.get(key, true);
          if (data && data.value) {
            const session = JSON.parse(data.value);
            const age = Math.floor((now - session.lastActive) / 1000);
            const isActive = (now - session.lastActive) < 300000;
            
            sessionList.push({
              id: session.id,
              name: session.name,
              studentId: session.studentId,
              courseCode: session.courseCode,
              workingOn: session.workingOn,
              location: session.location,
              status: session.status,
              lastActive: new Date(session.lastActive).toLocaleString(),
              age: `${Math.floor(age / 60)}m ${age % 60}s`,
              isActive: isActive,
              key: key
            });
          }
        } catch (e) {
          console.error('Error parsing session:', key, e);
        }
      }

      // Sort users by registration date
      userList.sort((a, b) => new Date(a.registeredAt) - new Date(b.registeredAt));
      
      // Sort sessions by last active
      sessionList.sort((a, b) => b.lastActive.localeCompare(a.lastActive));

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
    if (isOpen) {
      refreshDatabase();
      const interval = setInterval(refreshDatabase, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Database View</h2>
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
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Users Table */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Registered Users ({users.length})
              </h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
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
                            <td className="px-4 py-3 text-gray-900">{user.name}</td>
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
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Active Sessions ({sessions.filter(s => s.isActive).length} / {sessions.length})
              </h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
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
            <div className="grid grid-cols-2 gap-4 text-sm">
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
    </div>
  );
};

export default DatabaseView;

