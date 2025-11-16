import { useState, useEffect } from 'react';
import { LogOut, Edit2, Check, X, MessageSquare, Database } from 'lucide-react';
import { initCrossTabSync } from '../utils/crossTabSync';
import { supabase } from '../lib/supabaseClient';
import { getRecentSessionsSupabase, getMyActiveSessionSupabase, updateHeartbeatSupabase, updateSessionSupabase, leaveSessionSupabase, sendMessageSupabase, listInboxSupabase, markMessageReadSupabase, listConversationSupabase, subscribeConversationSupabase, sendImageMessageSupabase, sendPdfMessageSupabase, deleteMessageFileSupabase, markConversationReadSupabase } from '../utils/sessionsSupabase';
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
  const [imageFile, setImageFile] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [conversationUnsub, setConversationUnsub] = useState(null);
  const [mySessionId, setMySessionId] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});
  const [showDebug, setShowDebug] = useState(false);
  const [showDatabase, setShowDatabase] = useState(false);

  // Fetch all sessions EXCEPT your own (Supabase)
  const fetchSessions = async () => {
    try {
      const my = await getMyActiveSessionSupabase();
      if (!my) {
        onLeave();
        return;
      }
      const mine = {
        id: my.id,
        userId: my.user_id,
        name: my.name,
        studentId: my.student_id,
        courseCode: my.course_code,
        workingOn: my.working_on,
        location: my.location,
        status: my.status,
        lastActive: my.last_active,
      };
      setMySession(mine);
      setMySessionId(mine.id);
      if (!isEditing) {
        setEditWorkingOn(mine.workingOn || '');
        setEditLocation(mine.location || '');
        setEditStatus(mine.status || 'active');
      }

      const rows = await getRecentSessionsSupabase();
      // Map to UI shape and exclude own
      const others = rows
        .filter(r => r.id !== mine.id)
        .map(r => ({
          id: r.id,
          userId: r.user_id,
          name: r.name,
          studentId: r.student_id,
          courseCode: r.course_code,
          workingOn: r.working_on,
          location: r.location,
          status: r.status,
          lastActive: r.last_active,
        }));
      setAllSessions(others);
      setIsLoading(false);
    } catch (e) {
      console.error('Error fetching sessions:', e);
      setIsLoading(false);
    }
  };

  // Check for messages (Supabase)
  const checkMessages = async () => {
    try {
      const inbox = await listInboxSupabase();
      setInboxMessages(inbox);
      setUnreadMessages(inbox.filter(m => !m.read).length);
          } catch (e) {
      console.error('Error loading inbox:', e);
    }
  };
  
  // Mark message as read
  const markMessageAsRead = async (id) => {
    try {
      await markMessageReadSupabase(id);
        await checkMessages();
    } catch (e) {
      console.error('mark read failed', e);
    }
  };

  const debugStorage = async () => {};

  useEffect(() => {
    fetchSessions();
    
    return () => {
      // no-op
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
        await updateHeartbeatSupabase(mySession.id);
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
            } catch (e) {
              console.error('Refresh failed:', e);
            }
          }, 5000); // Changed from 10s to 5s for faster updates

    // Do not auto-leave on tab close; keep session until user explicitly leaves
    const onBeforeUnload = () => {};
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(refreshInterval);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [mySession?.id, onLeave]);

  // Realtime: update online users immediately and redirect if my session is deleted elsewhere
  useEffect(() => {
    const channel = supabase
      .channel('sessions-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        async (payload) => {
          try {
            // If my session was deleted from another tab/device, leave immediately
            if (payload.eventType === 'DELETE') {
              if (mySession && payload.old && payload.old.id === mySession.id) {
                onLeave();
                return;
              }
            }
            // For inserts/updates/deletes from anyone, refresh the roster quickly
            await fetchSessions();
          } catch (e) {
            console.error('Realtime refresh failed:', e);
          }
        }
      )
      .subscribe();
    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [mySession?.id]);

  const handleLeave = async () => {
    try {
      await leaveSessionSupabase();
      onLeave();
    } catch (e) {
      console.error('Error leaving session:', e);
      alert('Error leaving session. Please try again.');
    }
  };

  const handleSaveEdit = async () => {
    try {
      const updated = await updateSessionSupabase(mySession.id, {
        workingOn: editWorkingOn,
        location: editLocation,
        status: editStatus
      });
      setMySession(updated);
      setIsEditing(false);
    } catch (e) {
      console.error('Error updating session:', e);
      alert(e?.message || 'Failed to update session. Please try again.');
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
    if (!message.trim() || !selectedUser) return;
    try {
      await sendMessageSupabase({
        toUserId: selectedUser.userId || selectedUser.user_id || selectedUser.id,
        text: message,
      });
      // Optimistically add to the local conversation; subscription will confirm
      setConversation((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          from_user: mySession?.userId,
          to_user: selectedUser.userId || selectedUser.user_id || selectedUser.id,
          text: message,
          created_at: new Date().toISOString(),
          read: false,
        },
      ]);
      setMessage('');
    } catch (e) {
      console.error('Send message failed:', e);
      // keep the modal open; optional toast could be added
    }
  };

  // Load conversation when opening the message modal and subscribe for realtime
  useEffect(() => {
    const load = async () => {
      if (!showMessageModal || !selectedUser) return;
      try {
        const conv = await listConversationSupabase(selectedUser.userId || selectedUser.user_id || selectedUser.id);
        setConversation(conv);
        // Mark unread from this user as read when opening the chat
        try {
          await markConversationReadSupabase(selectedUser.userId || selectedUser.user_id || selectedUser.id);
          await checkMessages(); // refresh unread counts in inbox
    } catch (e) {
          console.error('mark read failed', e);
        }
        if (conversationUnsub) conversationUnsub();
        const unsub = subscribeConversationSupabase(selectedUser.userId || selectedUser.user_id || selectedUser.id, async () => {
          const latest = await listConversationSupabase(selectedUser.userId || selectedUser.user_id || selectedUser.id);
          setConversation(latest);
        });
        setConversationUnsub(() => unsub);
      } catch (e) {
        console.error('Load conversation failed:', e);
      }
    };
    load();
    return () => {
      if (conversationUnsub) conversationUnsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMessageModal, selectedUser?.id, selectedUser?.userId]);

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

  const getDepartmentCounts = () => {
    const deptCounts = {};
    allSessions.forEach(session => {
      const dept = (session.courseCode || '').match(/^[A-Za-z]+/)?.[0] || '';
      if (!dept) return;
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });
    return deptCounts;
  };

  const courseCounts = getDepartmentCounts();
  const myCourseCount = mySession ? allSessions.filter(s => s.courseCode === mySession.courseCode).length : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background:'linear-gradient(180deg, #fff6f7 0%, #ffffff 100%)'}}>
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
    <div className="min-h-screen" style={{background:'linear-gradient(180deg, #fff6f7 0%, #ffffff 100%)'}}>
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/dashboard.png" alt="myPeers" className="h-8" onError={(e)=>{ e.currentTarget.style.display='none'; }} />
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold font-mono">
              {mySession.courseCode}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={async () => {
                await checkMessages(); // Refresh messages before opening
                setShowInbox(true);
              }}
              className="relative flex items-center gap-2 px-5 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 text-base font-medium"
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
                <div className="text-base text-gray-600 mr-2">
                  <span className="font-semibold text-gray-800">{user.name}</span>
                  <span className="text-gray-400 mx-1">•</span>
                  <span className="font-mono text-sm">{user.studentId}</span>
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
            {/* Removed Online Users Section as requested */}
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
                      {filteredSessions.length} {filteredSessions.length === 1 ? 'student' : 'students'} in {filter}
                    </p>
                  )}
                </div>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Departments ({allSessions.length})</option>
                  <option value="myCourse">
                    My Course ({mySession?.courseCode}) {myCourseCount > 0 ? `- ${myCourseCount} students` : ''}
                  </option>
                  {Object.keys(courseCounts).sort().map(dept => (
                    <option key={dept} value={dept}>
                      {dept} ({courseCounts[dept]})
                    </option>
                  ))}
                </select>
              </div>

              {filteredSessions.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <p className="text-gray-500 text-lg">
                    No one studying right now - be the first!
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="divide-y">
                    {filteredSessions.map((session, idx) => (
                      <div key={session.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-red-50'} flex items-center justify-between px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${session.status === 'active' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                          <div>
                            <div className="font-semibold text-gray-900">{session.name}</div>
                            <div className="text-xs text-gray-500 font-mono">{session.studentId}</div>
                          </div>
                          <div className="font-mono font-semibold text-blue-600">{session.courseCode}</div>
                          {session.workingOn && <div className="text-sm text-gray-600">• {session.workingOn}</div>}
                          {session.location && <div className="text-xs text-gray-500">• 📍 {session.location}</div>}
                        </div>
                        <button
                          onClick={() => handleConnect(session)}
                          className="px-3 py-1 border rounded hover:bg-gray-50"
                        >
                          Connect
                        </button>
                      </div>
                    ))}
                  </div>
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

      {/* Message Modal - Chat thread */}
      {showMessageModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 flex flex-col h-[70vh]">
            <div className="mb-3">
              <h3 className="text-lg font-bold">Chat with {selectedUser.name}</h3>
              <p className="text-xs text-gray-500 font-mono">{selectedUser.courseCode}</p>
            </div>
            <div className="flex-1 overflow-y-auto border rounded p-3 bg-gray-50">
              {conversation.length === 0 ? (
                <p className="text-sm text-gray-500">No messages yet. Say hi!</p>
              ) : (
                conversation.map((msg) => (
                  <div key={msg.id} className={`mb-2 flex ${msg.from_user === mySession?.userId ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-3 py-2 rounded-lg ${msg.from_user === mySession?.userId ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
                      {msg.image_url ? (
                        msg.image_url.toLowerCase().endsWith('.pdf') ? (
                          <a href={msg.image_url} target="_blank" rel="noreferrer" className={`${msg.from_user === mySession?.userId ? 'text-white' : 'text-blue-700'} underline`}>
                            {msg.text || 'Open PDF'}
                          </a>
                        ) : (
                          <a href={msg.image_url} target="_blank" rel="noreferrer">
                            <img src={msg.image_url} alt="attachment" className="rounded max-w-[220px] max-h-[220px] object-cover" />
                          </a>
                        )
                      ) : (
                        <div className="text-sm whitespace-pre-wrap">{msg.text}</div>
                      )}
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <div className="text-[10px] opacity-70">{new Date(msg.created_at).toLocaleTimeString()}</div>
                        {msg.image_url && msg.from_user === mySession?.userId && (
                          <button
                            onClick={async () => {
                              try {
                                await deleteMessageFileSupabase(msg);
                                // Optimistically hide the file from the current view
                                setConversation(prev => prev.map(m => m.id === msg.id ? { ...m, image_url: null, text: (m.text || 'File') + ' (deleted)' } : m));
                              } catch (e) {
                                alert(e?.message || 'Failed to delete file');
                              }
                            }}
                            className={`text-xs underline ${msg.from_user === mySession?.userId ? 'text-white' : 'text-red-600'}`}
                            title="Delete file"
                          >
                            Delete
                          </button>
                        )}
                      </div>
            </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 items-center justify-between">
              <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message"
                className="flex-1 min-w-[180px] border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
              <button
                onClick={sendMessage}
                disabled={!message.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
              >
                Send
              </button>
              <label className="px-3 py-2 border rounded cursor-pointer hover:bg-gray-50">
                Attach
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && (f.type.startsWith('image/') || f.type === 'application/pdf')) {
                      setImageFile(f);
                    } else {
                      alert('Only images or PDF files are allowed');
                    }
                  }}
                />
              </label>
              {imageFile && (
                <button
                  onClick={async () => {
                    try {
                      const toId = selectedUser.userId || selectedUser.user_id || selectedUser.id;
                      if (imageFile.type === 'application/pdf') {
                        await sendPdfMessageSupabase({ toUserId: toId, file: imageFile });
                      } else {
                        await sendImageMessageSupabase({ toUserId: toId, file: imageFile });
                      }
                      // Immediately refresh conversation so the new file appears without closing
                      const latest = await listConversationSupabase(toId);
                      setConversation(latest);
                      setImageFile(null);
                    } catch (e) {
                      console.error('Image send failed', e);
                      alert(e?.message || 'Failed to send file');
                    }
                  }}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 whitespace-nowrap"
                >
                  Send File
                </button>
              )}
              <button
                onClick={() => {
                  setShowMessageModal(false);
                  setSelectedUser(null);
                  setMessage('');
                  setConversation([]);
                  if (conversationUnsub) conversationUnsub();
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap"
              >
                Close
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
            
            <div className="flex-1 overflow-y-auto">
              {(() => {
                const me = mySession?.userId;
                const bySender = new Map();
                inboxMessages.forEach(m => {
                  const otherId = m.from_user === me ? m.to_user : m.from_user;
                  const otherName = m.from_user === me ? m.to_name : m.from_name;
                  // Fallback to current sessions list if name not present
                  const fallbackName = (allSessions.find(s => s.userId === otherId)?.name) || '';
                  const nameToUse = otherName || fallbackName;
                  if (!bySender.has(otherId)) bySender.set(otherId, { name: nameToUse, unread: 0 });
                  if (!m.read && m.to_user === me) bySender.get(otherId).unread++;
                });
                const entries = Array.from(bySender.entries());
                if (entries.length === 0) {
                  return (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No messages yet</p>
                </div>
                  );
                }
                return (
                  <div className="space-y-2">
                    {entries.map(([otherId, info]) => (
                        <button
                        key={otherId}
                        onClick={() => {
                          const otherSession = allSessions.find(s => s.userId === otherId);
                          setSelectedUser(otherSession || { userId: otherId, name: info.name });
                              setShowMessageModal(true);
                              setShowInbox(false);
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 bg-white border rounded hover:bg-gray-50"
                      >
                        <span className="font-medium">{info.name || 'Student'}</span>
                        {info.unread > 0 && (
                          <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                            {info.unread}
                          </span>
                        )}
                        </button>
                    ))}
                      </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

