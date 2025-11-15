import { useState, useEffect } from 'react';
import { LogOut, Edit2, Check, X, MessageSquare, Database } from 'lucide-react';
import { getAllSessions, getMySession, updateHeartbeat, updateSession, leaveSession } from '../utils/storage';
import { initCrossTabSync, onTabMessage, onStorageChange, broadcastToTabs } from '../utils/crossTabSync';
import SessionCard from './SessionCard';
import ConnectModal from './ConnectModal';
import DatabaseView from './DatabaseView';

const Dashboard = ({ onLeave, onLogout, user }) => {
  const [mySession, setMySession] = useState(null);
  const [allSessions, setAllSessions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedSession, setSelectedSession] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editWorkingOn, setEditWorkingOn] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [isLoading, setIsLoading] = useState(true);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showInbox, setShowInbox] = useState(false);
  const [inboxMessages, setInboxMessages] = useState([]);
  const [mySessionId, setMySessionId] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});
  const [showDebug, setShowDebug] = useState(false);
  const [showDatabase, setShowDatabase] = useState(false);

  // Fetch all sessions EXCEPT your own
  const fetchSessions = async () => {
    try {
      if (!window.storage) {
        alert('Storage API not available');
        return;
      }

      // Get your session ID
      const myIdData = await window.storage.get('my_session_id', false);
      const myId = myIdData?.value;
      setMySessionId(myId);

      // Get your session details
      const session = await getMySession();
      if (!session) {
        onLeave();
        return;
      }

      setMySession(session);
      setEditWorkingOn(session.workingOn || '');
      setEditLocation(session.location || '');
      setEditStatus(session.status);

      // Get ALL sessions with 'session:' prefix
      const result = await window.storage.list('session:', true);
      const allSessions = [];
      const now = Date.now();
      
      console.log(`[fetchSessions] Found ${result.keys.length} session keys, my ID: ${myId}`);
      console.log(`[fetchSessions] All session keys:`, result.keys);
      
      // Also manually check localStorage to see what's actually there
      if (typeof Storage !== 'undefined') {
        const manualKeys = [];
        const allLocalStorageKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          allLocalStorageKeys.push(key);
          if (key && key.startsWith('shared_session:')) {
            manualKeys.push(key);
            // Try to get the value directly
            try {
              const value = localStorage.getItem(key);
              if (value) {
                const session = JSON.parse(value);
                console.log(`[fetchSessions] Direct localStorage session: ${session.name} (${session.courseCode}) - ID: ${key}`);
              }
            } catch (e) {
              console.error(`[fetchSessions] Error parsing localStorage value for ${key}:`, e);
            }
          }
        }
        console.log(`[fetchSessions] Total localStorage keys: ${allLocalStorageKeys.length}`, allLocalStorageKeys);
        console.log(`[fetchSessions] Manual localStorage check found ${manualKeys.length} shared_session: keys:`, manualKeys);
        
        // Check if we can see other sessions
        if (manualKeys.length > 1) {
          console.log(`[fetchSessions] ✅ Found ${manualKeys.length} sessions in localStorage - should be visible!`);
        } else if (manualKeys.length === 1) {
          console.log(`[fetchSessions] ⚠️ Only found 1 session in localStorage - other users may be in different browser windows/incognito`);
        }
      }
      
      for (const key of result.keys) {
        // Skip your own session
        if (key === myId) {
          console.log(`[fetchSessions] Skipping own session: ${key}`);
          continue;
        }
        
        try {
          const data = await window.storage.get(key, true);
          console.log(`[fetchSessions] Getting key "${key}":`, data ? 'Found' : 'Not found', data);
          
          if (data && data.value) {
            const session = JSON.parse(data.value);
            console.log(`[fetchSessions] Parsed session:`, {
              id: session.id,
              name: session.name,
              studentId: session.studentId,
              courseCode: session.courseCode,
              lastActive: new Date(session.lastActive).toLocaleTimeString(),
              ageSeconds: Math.floor((now - session.lastActive) / 1000)
            });
            
            // Only include sessions active in last 5 minutes
            const ageSeconds = Math.floor((now - session.lastActive) / 1000);
            if (now - session.lastActive < 300000) {
              allSessions.push(session);
              console.log(`[fetchSessions] ✅ Added session: ${session.name} - ${session.courseCode} (ID: ${session.id}, Age: ${ageSeconds}s)`);
            } else {
              // Clean up stale sessions
              console.log(`[fetchSessions] 🧹 Removing stale session: ${session.id} (Age: ${ageSeconds}s)`);
              await window.storage.delete(key, true).catch(e => console.log('Cleanup failed:', e));
            }
          } else {
            console.warn(`[fetchSessions] ⚠️ No data for key: ${key}`);
          }
        } catch (e) {
          console.error(`[fetchSessions] ❌ Error parsing session ${key}:`, e);
        }
      }
      
      console.log(`[fetchSessions] ✅ Final result: ${allSessions.length} active sessions:`, 
        allSessions.map(s => `${s.name} (${s.courseCode})`));
      
      // Sort by most recent activity
      allSessions.sort((a, b) => b.lastActive - a.lastActive);
      setAllSessions(allSessions);
      setIsLoading(false);
    } catch (e) {
      console.error('Error fetching sessions:', e);
      setIsLoading(false);
    }
  };

  // Check for messages
  const checkMessages = async () => {
    if (!mySessionId) return;
    
    try {
      const result = await window.storage.list('message:', true);
      const allMyMessages = [];
      const unreadCount = [];
      
      console.log(`[checkMessages] Checking messages for session: ${mySessionId}`);
      console.log(`[checkMessages] Found ${result.keys.length} message keys`);
      
      for (const key of result.keys) {
        // Message format: message:FROM_ID:TO_ID:TIMESTAMP
        // Session IDs contain colons (session:timestamp:random), so we need to be careful
        // Split by ':' and reconstruct: parts[0] = 'message', parts[1] = FROM_ID, parts[2] = TO_ID, parts[3+] = TIMESTAMP
        const parts = key.split(':');
        console.log(`[checkMessages] Parsing key: ${key}, parts:`, parts);
        
        if (parts.length >= 4) {
          // Reconstruct session IDs (they contain colons)
          // FROM_ID starts at parts[1], TO_ID is the last part before timestamp
          // Actually, let's use a different approach - find the pattern
          const messagePrefix = 'message:';
          if (!key.startsWith(messagePrefix)) continue;
          
          const afterPrefix = key.substring(messagePrefix.length);
          // Find the second occurrence of a session ID pattern
          // Session IDs are like: session:123456789:abc
          // So we need: message:session:123:abc:session:456:def:timestamp
          // Better: use regex or find the pattern
          
          // Actually simpler: get the message data and check msg.to
          try {
            const data = await window.storage.get(key, true);
            console.log(`[checkMessages] Got data for ${key}:`, data);
            
            if (data && data.value) {
              const msg = JSON.parse(data.value);
              console.log(`[checkMessages] Parsed message:`, msg);
              
              // Check if message is TO us using the message data
              if (msg.to === mySessionId) {
                console.log(`[checkMessages] ✅ Message is for me! From: ${msg.fromName}, To: ${msg.toName}`);
                
                allMyMessages.push({
                  ...msg,
                  key: key,
                  id: key
                });
                
                if (!msg.read) {
                  unreadCount.push(msg);
                }
                
                console.log(`[checkMessages] ✅ Added message from ${msg.fromName} to ${msg.toName}`);
              } else {
                console.log(`[checkMessages] ⏭️ Message not for me: ${msg.to} !== ${mySessionId}`);
              }
            } else {
              console.log(`[checkMessages] ⚠️ No data for key: ${key}`);
            }
          } catch (e) {
            console.error('Error parsing message:', key, e);
          }
        } else {
          console.log(`[checkMessages] ⚠️ Invalid message key format (need at least 4 parts): ${key}`);
        }
      }
      
      // Sort by timestamp (newest first)
      allMyMessages.sort((a, b) => b.timestamp - a.timestamp);
      
      setInboxMessages(allMyMessages);
      setUnreadMessages(unreadCount.length);
      
      console.log(`[checkMessages] Total messages: ${allMyMessages.length}, Unread: ${unreadCount.length}`);
    } catch (e) {
      console.error('Error checking messages:', e);
    }
  };
  
  // Mark message as read
  const markMessageAsRead = async (messageKey) => {
    try {
      const data = await window.storage.get(messageKey, true);
      if (data && data.value) {
        const msg = JSON.parse(data.value);
        msg.read = true;
        await window.storage.set(messageKey, JSON.stringify(msg), true);
        console.log('✅ Message marked as read:', messageKey);
        // Refresh messages
        await checkMessages();
      }
    } catch (e) {
      console.error('Error marking message as read:', e);
    }
  };

  const debugStorage = async () => {
    try {
      const myIdData = await window.storage.get('my_session_id', false);
      const allKeys = await window.storage.list('session:', true);
      
      // Also check localStorage directly
      const localStorageKeys = [];
      if (typeof Storage !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('shared_session:') || key.startsWith('personal_'))) {
            localStorageKeys.push(key);
          }
        }
      }
      
      // Get all session data
      const sessionData = [];
      for (const key of allKeys.keys) {
        try {
          const data = await window.storage.get(key, true);
          if (data && data.value) {
            const session = JSON.parse(data.value);
            sessionData.push({
              id: session.id,
              name: session.name,
              studentId: session.studentId,
              courseCode: session.courseCode,
              lastActive: new Date(session.lastActive).toLocaleTimeString(),
              age: Math.floor((Date.now() - session.lastActive) / 1000) + 's',
              isActive: (Date.now() - session.lastActive) < 300000
            });
          }
        } catch (e) {
          console.error('Error getting session data:', e);
        }
      }
      
      const debug = {
        mySessionId: myIdData?.value,
        totalKeys: allKeys.keys.length,
        keys: allKeys.keys,
        localStorageKeys: localStorageKeys,
        localStorageCount: localStorageKeys.length,
        sessions: sessionData,
        activeSessions: sessionData.filter(s => s.isActive).length,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setDebugInfo(debug);
      console.log('🐛 DEBUG INFO:', debug);
    } catch (e) {
      console.error('Debug failed:', e);
    }
  };

  useEffect(() => {
    // Initialize cross-tab sync
    initCrossTabSync();
    
    fetchSessions();
    
    // Check if window.storage is available
    if (typeof window.storage === 'undefined') {
      console.error('❌ window.storage is NOT available!');
      alert('Storage API is not available. This app requires window.storage to work.');
    } else {
      console.log('✅ window.storage is available');
      
      // Test basic operations
      window.storage.set('test_key', 'test_value', true)
        .then(() => console.log('✅ Test write successful'))
        .then(() => window.storage.get('test_key', true))
        .then(result => {
          console.log('✅ Test read successful:', result);
          // Clean up test key
          window.storage.delete('test_key', true);
        })
        .catch(e => console.error('❌ Test failed:', e));
    }
    
    // Listen for messages from other tabs
    const unsubscribeTabMessage = onTabMessage((message) => {
      console.log('📨 Tab message received:', message);
      if (message.type === 'session_created' || message.type === 'session_updated') {
        // Refresh sessions when another tab creates/updates a session
        console.log('🔄 Refreshing sessions due to tab message');
        setTimeout(() => {
          fetchSessions();
          debugStorage(); // Also update debug info
        }, 200); // Small delay to ensure storage is written
      } else if (message.type === 'message_sent') {
        // Refresh messages when a new message is sent
        console.log('📬 New message sent, refreshing inbox');
        setTimeout(() => {
          checkMessages();
        }, 200);
      }
    });
    
    // Listen for storage changes (for cross-tab sync)
    // Note: storage events only fire in OTHER tabs, not the current tab
    const unsubscribeStorage = onStorageChange((change) => {
      console.log('💾 Storage change detected in another tab:', change);
      // Refresh sessions and messages when storage changes in another tab
      console.log('🔄 Refreshing sessions and messages due to storage change');
      setTimeout(() => {
        fetchSessions();
        checkMessages();
        debugStorage(); // Also update debug info
      }, 200); // Small delay to ensure storage is written
    });
    
    // Set up debug refresh
    debugStorage();
    const debugInterval = setInterval(debugStorage, 5000);
    
    return () => {
      clearInterval(debugInterval);
      unsubscribeTabMessage();
      unsubscribeStorage();
    };
  }, [onLeave]);

  // Set up heartbeat and refresh intervals after session is loaded
  useEffect(() => {
    if (!mySession) return;

    // Initial message check
    checkMessages();

    // Set up heartbeat interval (every 10 seconds)
    const heartbeatInterval = setInterval(async () => {
      try {
        await updateHeartbeat(mySession.id);
      } catch (e) {
        console.error('Heartbeat failed:', e);
      }
    }, 10000);

          // Refresh sessions and check messages every 5 seconds (more frequent)
          const refreshInterval = setInterval(async () => {
            try {
              console.log('[Dashboard] Auto-refreshing sessions...');
              await fetchSessions();
              await checkMessages();

              // Update my session if it still exists
              const session = await getMySession();
              if (session) {
                setMySession(session);
              } else {
                onLeave();
              }
            } catch (e) {
              console.error('Refresh failed:', e);
            }
          }, 5000); // Changed from 10s to 5s for faster updates

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(refreshInterval);
    };
  }, [mySession?.id, onLeave]);

  const handleLeave = async () => {
    try {
      await leaveSession();
      onLeave();
    } catch (e) {
      console.error('Error leaving session:', e);
      alert('Error leaving session. Please try again.');
    }
  };

  const handleSaveEdit = async () => {
    try {
      const updated = await updateSession(mySession.id, {
        workingOn: editWorkingOn,
        location: editLocation,
        status: editStatus
      });
      setMySession(updated);
      setIsEditing(false);
    } catch (e) {
      console.error('Error updating session:', e);
      alert('Failed to update session. Please try again.');
    }
  };

  const handleConnect = (session) => {
    setSelectedUser(session);
    setShowMessageModal(true);
  };

  const handleCloseModal = () => {
    setSelectedSession(null);
  };

  const sendMessage = async () => {
    if (!message.trim() || !selectedUser || !mySessionId) {
      console.log('[sendMessage] Missing data:', { message: message.trim(), selectedUser, mySessionId });
      return;
    }
    
    try {
      // Create a message key: "message:FROM_ID:TO_ID:TIMESTAMP"
      const messageId = `message:${mySessionId}:${selectedUser.id}:${Date.now()}`;
      const messageData = {
        from: mySessionId,
        fromName: mySession?.name || 'Unknown',
        to: selectedUser.id,
        toName: selectedUser.name,
        text: message.trim(),
        timestamp: Date.now(),
        read: false
      };
      
      console.log('📤 Sending message:', messageId);
      console.log('📤 Message data:', messageData);
      
      await window.storage.set(messageId, JSON.stringify(messageData), true);
      console.log('✅ Message saved to storage:', messageId);
      
      // Verify it was saved
      const verify = await window.storage.get(messageId, true);
      console.log('✅ Verification - message in storage:', verify ? 'YES' : 'NO');
      
      // Broadcast message to other tabs
      broadcastToTabs('message_sent', { messageId, messageData });
      console.log('📡 Broadcasted message to other tabs');
      
      // Success feedback
      alert(`Message sent to ${selectedUser.name}!`);
      setMessage('');
      setShowMessageModal(false);
      setSelectedUser(null);
      
      // Refresh messages in case we sent to ourselves (testing)
      setTimeout(() => {
        console.log('🔄 Refreshing messages after send');
        checkMessages();
      }, 500);
    } catch (e) {
      console.error('❌ Error sending message:', e);
      alert('Failed to send message. Please try again.');
    }
  };

  const filteredSessions = allSessions.filter(session => {
    // Always exclude own session from filtered list (it's shown separately)
    if (session.id === mySession?.id) return false;
    
    if (filter === 'all') return true;
    if (filter === 'myCourse') return session.courseCode === mySession?.courseCode;
    
    // Filter by department
    const dept = filter.toUpperCase();
    return session.courseCode.startsWith(dept);
  });
  
  // Debug: Log what we're seeing
  console.log('[Dashboard] State:', {
    allSessionsCount: allSessions.length,
    filteredSessionsCount: filteredSessions.length,
    mySessionId: mySession?.id,
    mySessionName: mySession?.name,
    allSessionIds: allSessions.map(s => ({ id: s.id, name: s.name, course: s.courseCode }))
  });

  // Debug logging
  useEffect(() => {
    console.log(`[Dashboard] Filter: ${filter}, All sessions: ${allSessions.length}, Filtered: ${filteredSessions.length}`);
    if (filter === 'myCourse' && mySession) {
      const courseSessions = allSessions.filter(s => s.courseCode === mySession.courseCode);
      console.log(`[Dashboard] Sessions for course ${mySession.courseCode}:`, courseSessions.map(s => ({ name: s.name, id: s.id })));
    }
  }, [filter, allSessions, filteredSessions, mySession]);

  const getPopularCourses = () => {
    const courseCounts = {};
    allSessions.forEach(session => {
      courseCounts[session.courseCode] = (courseCounts[session.courseCode] || 0) + 1;
    });
    
    return Object.entries(courseCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([course, count]) => ({ course, count }));
  };

  const getCourseCounts = () => {
    const courseCounts = {};
    allSessions.forEach(session => {
      courseCounts[session.courseCode] = (courseCounts[session.courseCode] || 0) + 1;
    });
    return courseCounts;
  };

  const courseCounts = getCourseCounts();
  const myCourseCount = mySession ? (courseCounts[mySession.courseCode] || 0) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your session...</p>
        </div>
      </div>
    );
  }

  if (!mySession) {
    return null;
  }

  const popularCourses = getPopularCourses();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Debug Panel */}
      {showDebug && (
        <div className="bg-yellow-50 border-2 border-yellow-300 p-4 rounded-lg m-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold">🐛 Debug Info</h3>
            <button
              onClick={() => setShowDebug(false)}
              className="text-yellow-700 hover:text-yellow-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-60">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
          <button 
            onClick={debugStorage}
            className="mt-2 bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
          >
            Refresh Debug
          </button>
        </div>
      )}
      
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">Study Session Matchmaker</h1>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold font-mono">
              {mySession.courseCode}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
              title="Toggle Debug Panel"
            >
              🐛 Debug
            </button>
            <button
              onClick={async () => {
                await checkMessages(); // Refresh messages before opening
                setShowInbox(true);
              }}
              className="relative flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200"
            >
              <MessageSquare className="w-5 h-5" />
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
              <span className="hidden md:inline">Messages</span>
            </button>
            <div className="flex items-center gap-2">
              {user && (
                <div className="text-sm text-gray-600 mr-2">
                  <span className="font-semibold">{user.name}</span>
                  <span className="text-gray-400 mx-1">•</span>
                  <span className="font-mono text-xs">{user.studentId}</span>
                </div>
              )}
              <button
                onClick={handleLeave}
                className="flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200 font-medium"
              >
                <LogOut className="w-4 h-4" />
                Leave Session
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Online Users Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Online Users ({allSessions.length + (mySession ? 1 : 0)})
                </h2>
                <button
                  onClick={fetchSessions}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  🔄 Refresh
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Show current user */}
                {mySession && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <h3 className="font-semibold text-gray-900">{mySession.name}</h3>
                      <span className="text-xs text-gray-500 font-mono">(You)</span>
                    </div>
                    {mySession.studentId && (
                      <p className="text-xs font-mono text-gray-600 mb-1">{mySession.studentId}</p>
                    )}
                    <p className="text-sm font-mono text-blue-600 font-semibold">{mySession.courseCode}</p>
                    {mySession.workingOn && (
                      <p className="text-xs text-gray-600 mt-1">{mySession.workingOn}</p>
                    )}
                  </div>
                )}
                
                {/* Show all other online users */}
                {allSessions.map((session) => (
                  <div key={session.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${
                        session.status === 'active' ? 'bg-green-500' : 'bg-orange-500'
                      }`}></div>
                      <h3 className="font-semibold text-gray-900">{session.name}</h3>
                    </div>
                    {session.studentId && (
                      <p className="text-xs font-mono text-gray-600 mb-1">{session.studentId}</p>
                    )}
                    <p className="text-sm font-mono text-blue-600 font-semibold">{session.courseCode}</p>
                    {session.workingOn && (
                      <p className="text-xs text-gray-600 mt-1">{session.workingOn}</p>
                    )}
                    {session.location && (
                      <p className="text-xs text-gray-500 mt-1">📍 {session.location}</p>
                    )}
                  </div>
                ))}
                
                {allSessions.length === 0 && !mySession && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No users online
                  </div>
                )}
              </div>
            </div>
            {/* Your Session Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Your Session</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What you're working on
                    </label>
                    <input
                      type="text"
                      value={editWorkingOn}
                      onChange={(e) => setEditWorkingOn(e.target.value)}
                      placeholder="e.g., Midterm review, Assignment 3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Where are you studying?
                    </label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      placeholder="e.g., McLennan Library, Redpath Library, Online"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setEditStatus('active')}
                        className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                          editStatus === 'active'
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-300 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          Studying Now
                        </div>
                      </button>
                      <button
                        onClick={() => setEditStatus('break')}
                        className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                          editStatus === 'break'
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-300 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          Taking a Break
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                    >
                      <Check className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditWorkingOn(mySession.workingOn || '');
                        setEditLocation(mySession.location || '');
                        setEditStatus(mySession.status);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="text-lg font-semibold text-gray-900">{mySession.name}</p>
                  </div>
                  {mySession.studentId && (
                    <div>
                      <p className="text-sm text-gray-500">Student ID</p>
                      <p className="font-mono text-sm text-gray-700">{mySession.studentId}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Course</p>
                    <p className="font-mono font-semibold text-blue-600">{mySession.courseCode}</p>
                  </div>
                  {mySession.workingOn && (
                    <div>
                      <p className="text-sm text-gray-500">Working on</p>
                      <p className="text-gray-900">{mySession.workingOn}</p>
                    </div>
                  )}
                  {mySession.location && (
                    <div>
                      <p className="text-sm text-gray-500">Where</p>
                      <p className="text-gray-900">{mySession.location}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        mySession.status === 'active' ? 'bg-green-500' : 'bg-orange-500'
                      }`}></div>
                      <span className="text-gray-900 capitalize">
                        {mySession.status === 'active' ? 'Studying Now' : 'Taking a Break'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Filter and Sessions Feed */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Active Sessions</h2>
                  {filter === 'myCourse' && mySession && (
                    <p className="text-sm text-gray-600 mt-1">
                      {myCourseCount} {myCourseCount === 1 ? 'student' : 'students'} studying {mySession.courseCode}
                    </p>
                  )}
                  {filter !== 'all' && filter !== 'myCourse' && (
                    <p className="text-sm text-gray-600 mt-1">
                      {filteredSessions.length} {filteredSessions.length === 1 ? 'student' : 'students'} in {filter} courses
                    </p>
                  )}
                </div>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Courses ({allSessions.length})</option>
                  <option value="myCourse">
                    My Course ({mySession?.courseCode}) {myCourseCount > 0 ? `- ${myCourseCount} students` : ''}
                  </option>
                  <option value="COMP">COMP ({Object.keys(courseCounts).filter(c => c.startsWith('COMP')).reduce((sum, c) => sum + courseCounts[c], 0)})</option>
                  <option value="MATH">MATH ({Object.keys(courseCounts).filter(c => c.startsWith('MATH')).reduce((sum, c) => sum + courseCounts[c], 0)})</option>
                  <option value="ECON">ECON ({Object.keys(courseCounts).filter(c => c.startsWith('ECON')).reduce((sum, c) => sum + courseCounts[c], 0)})</option>
                  <option value="PHYS">PHYS ({Object.keys(courseCounts).filter(c => c.startsWith('PHYS')).reduce((sum, c) => sum + courseCounts[c], 0)})</option>
                  <option value="BIOL">BIOL ({Object.keys(courseCounts).filter(c => c.startsWith('BIOL')).reduce((sum, c) => sum + courseCounts[c], 0)})</option>
                </select>
              </div>

              {filteredSessions.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <p className="text-gray-500 text-lg">
                    No one studying right now - be the first!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSessions.map(session => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onConnect={handleConnect}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6 sticky top-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Popular Courses Right Now</h3>
                {popularCourses.length === 0 ? (
                  <p className="text-sm text-gray-500">No active courses</p>
                ) : (
                  <div className="space-y-2">
                    {popularCourses.map(({ course, count }) => (
                      <div key={course} className="flex items-center justify-between text-sm">
                        <span className="font-mono font-semibold text-blue-600">{course}</span>
                        <span className="text-gray-500">{count} {count === 1 ? 'student' : 'students'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{allSessions.length}</p>
                  <p className="text-sm text-gray-500">Total students online</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedSession && (
        <ConnectModal
          session={selectedSession}
          onClose={handleCloseModal}
        />
      )}

      {/* Database View */}
      <DatabaseView 
        isOpen={showDatabase} 
        onClose={() => setShowDatabase(false)} 
      />

      {/* Message Modal */}
      {showMessageModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              Send Message to {selectedUser.name}
            </h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Course</p>
              <p className="font-mono font-bold text-blue-600">{selectedUser.courseCode}</p>
              
              <p className="text-sm text-gray-600 mt-2">Working on</p>
              <p>{selectedUser.workingOn || 'Not specified'}</p>
              
              {selectedUser.location && (
                <>
                  <p className="text-sm text-gray-600 mt-2">Location</p>
                  <p>{selectedUser.location}</p>
                </>
              )}
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hey! Want to study together?"
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 h-32 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={sendMessage}
                disabled={!message.trim()}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send Message
              </button>
              <button
                onClick={() => {
                  setShowMessageModal(false);
                  setSelectedUser(null);
                  setMessage('');
                }}
                className="px-6 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inbox Modal */}
      {showInbox && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">Your Messages</h3>
                {unreadMessages > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    {unreadMessages} unread {unreadMessages === 1 ? 'message' : 'messages'}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowInbox(false);
                  // Refresh messages when closing
                  checkMessages();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4">
              {inboxMessages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No messages yet</p>
                  <p className="text-sm mt-2">Connect with other students to start messaging!</p>
                </div>
              ) : (
                inboxMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      msg.read
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-blue-50 border-blue-300 shadow-sm'
                    }`}
                    onClick={() => {
                      if (!msg.read) {
                        markMessageAsRead(msg.key);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{msg.fromName}</h4>
                          {!msg.read && (
                            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(msg.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-gray-700 whitespace-pre-wrap">{msg.text}</p>
                    </div>
                    {msg.fromName && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Find the sender's session and open connect modal
                            const senderSession = allSessions.find(s => s.id === msg.from);
                            if (senderSession) {
                              setSelectedUser(senderSession);
                              setShowMessageModal(true);
                              setShowInbox(false);
                            } else {
                              alert('Sender is no longer online');
                            }
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Reply
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

