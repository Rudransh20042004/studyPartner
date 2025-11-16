

import { useState, useEffect, useRef, useMemo } from 'react';
import { LogOut, Edit2, Check, X, MessageSquare, Database, Menu } from 'lucide-react';
import { initCrossTabSync } from '../utils/crossTabSync';
import { supabase } from '../lib/supabaseClient';
import { getRecentSessionsSupabase, getMyActiveSessionSupabase, updateHeartbeatSupabase, updateSessionSupabase, leaveSessionSupabase, sendMessageSupabase, listInboxSupabase, markMessageReadSupabase, listConversationSupabase, subscribeConversationSupabase, sendImageMessageSupabase, sendPdfMessageSupabase, deleteMessageFileSupabase, markConversationReadSupabase } from '../utils/sessionsSupabase';
import SessionCard from './SessionCard';
import DashboardShell from './ui/DashboardShell';
import UiSessionCard from './ui/SessionCard';
import TiltWrapper from './ui/fx/TiltWrapper';
import ShimmerOverlay from './ui/fx/ShimmerOverlay';
import ChatMessageBubble from './ui/ChatMessageBubble';
import ChatWindowShell from './ui/ChatWindowShell';
import MotionFadeSlide from './ui/MotionFadeSlide';
import MotionModal from './ui/MotionModal';
import AnimatedButton from './ui/AnimatedButton';
import TypingDots from './ui/TypingDots';
import ConnectModal from './ConnectModal';
import DatabaseView from './DatabaseView';
import BackgroundBlobs from './ui/fx/BackgroundBlobs';
import FloatingIconOrbit from './ui/fx/FloatingIconOrbit';
import RippleAmbient from './ui/fx/RippleAmbient';
import ConfettiBurst from './ui/ConfettiBurst';

import GroupDock from './ui/GroupDock';
import Avatar from './ui/Avatar';
import MotionCoachMarks from './ui/MotionCoachMarks';
import PopularChips from './ui/PopularChips';
import SuggestedBuddies from './ui/SuggestedBuddies';
import ReactionsDock from './ui/ReactionsDock';
import ReactionRain from './ui/ReactionRain';
import WhiteboardDock from './ui/WhiteboardDock';

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
  const [celebrate, setCelebrate] = useState(false);
  const hasCelebratedRef = useRef(false);
  const [groupCode, setGroupCode] = useState(null);
  const [perfMode, setPerfMode] = useState(false);
  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileStudentId, setProfileStudentId] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [headerStudentId, setHeaderStudentId] = useState(user?.studentId || '');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setHeaderStudentId(user?.studentId || '');
  }, [user?.studentId]);

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

  // One-time celebration when ready
  useEffect(() => {
    if (!isLoading && mySession && !hasCelebratedRef.current) {
      setCelebrate(true);
      const t = setTimeout(() => setCelebrate(false), 1800);
      hasCelebratedRef.current = true;
      return () => clearTimeout(t);
    }
  }, [isLoading, mySession]);

  // Initialize performance mode from localStorage or prefers-reduced-motion
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mp_perf_mode');
      if (stored != null) {
        setPerfMode(stored === '1');
        return;
      }
      const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) setPerfMode(true);
    } catch {}
  }, []);

  const togglePerfMode = () => {
    setPerfMode((p) => {
      const next = !p;
      try { localStorage.setItem('mp_perf_mode', next ? '1' : '0'); } catch {}
      return next;
    });
  };

  // Listen for group join/leave events from GroupDock (UI-only)
  useEffect(() => {
    const onJoin = (e) => setGroupCode(e?.detail?.code || null);
    const onLeft = () => setGroupCode(null);
    window.addEventListener('group:joined', onJoin);
    window.addEventListener('group:left', onLeft);
    return () => {
      window.removeEventListener('group:joined', onJoin);
      window.removeEventListener('group:left', onLeft);
    };
  }, []);
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

  // Realtime updates for inbox/unread badge and open chats
  useEffect(() => {
    if (!mySession?.userId) return;
    const channel = supabase
      .channel('messages-inbox-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const m = payload.new;
          if (!m) return;
          const me = mySession.userId;
          // Only react if the message involves me
          if (m.to_user === me || m.from_user === me) {
            try {
              // Update unread badge
              await checkMessages();
              // If chat with this user is open, refresh thread
              const otherId = m.from_user === me ? m.to_user : m.from_user;
              if (showMessageModal && (selectedUser?.userId === otherId || selectedUser?.id === otherId)) {
                const latest = await listConversationSupabase(otherId);
                setConversation(latest);
                // Mark read if it was sent to me and this convo is open
                if (m.to_user === me) {
                  await markConversationReadSupabase(otherId);
                  await checkMessages();
                }
              }
    } catch (e) {
              console.error('Realtime inbox refresh failed:', e);
            }
          }
        }
      )
      .subscribe();
    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [mySession?.userId, showMessageModal, selectedUser?.userId, selectedUser?.id]);

  const filteredSessions = useMemo(() => {
    return allSessions.filter(session => {
    if (session.id === mySession?.id) return false;
    if (filter === 'all') return true;
    if (filter === 'myCourse') return session.courseCode === mySession?.courseCode;
    const dept = filter.toUpperCase();
    return session.courseCode.startsWith(dept);
  });
  }, [allSessions, mySession?.id, mySession?.courseCode, filter]);
  
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

  const courseCounts = useMemo(() => getDepartmentCounts(), [allSessions]);
  const myCourseCount = useMemo(() => mySession ? allSessions.filter(s => s.courseCode === mySession.courseCode).length : 0, [allSessions, mySession]);

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
    <DashboardShell>
      {!perfMode && <ConfettiBurst fire={celebrate} />}
      {!perfMode && <ReactionRain />}
      <MotionCoachMarks />
      <MotionFadeSlide>
      {!perfMode && <BackgroundBlobs />}
      {!perfMode && <FloatingIconOrbit />}
      {!perfMode && <RippleAmbient />}
      
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 shrink-0">
            <img src="/dashboard.png" alt="myPeers" className="h-8 shrink-0" onError={(e)=>{ e.currentTarget.style.display='none'; }} />
          </div>

          {/* Desktop actions - Group, Reactions, Board (hidden on mobile, shown in hamburger menu instead) */}
          <div className="hidden md:flex items-center gap-2 flex-1 ml-4 min-w-0 overflow-x-auto">
            <GroupDock userId={mySession.userId} userName={mySession.name} />
            <ReactionsDock groupCode={groupCode} />
            <WhiteboardDock groupCode={groupCode} />
            <button
              onClick={togglePerfMode}
              className={`text-xs px-2.5 py-1 rounded-full border shrink-0 ${perfMode ? 'bg-gray-100 border-gray-300' : 'bg-white/70 border-white/40 hover:bg-white'}`}
              title="Toggle Performance Mode"
            >
              {perfMode ? 'Performance: On' : 'Performance: Off'}
            </button>
          </div>
          
          {/* Messages, Profile, Actions (desktop only) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 shrink-0">
              <AnimatedButton
                onClick={async () => {
                  await checkMessages(); // Refresh messages before opening
                  setShowInbox(true);
                }}
                className="relative flex items-center gap-2 px-5 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 text-base font-medium"
              >
                <MessageSquare className="w-5 h-5" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center unread-glow">
                    {unreadMessages}
                  </span>
                )}
                <span className="hidden md:inline">Messages</span>
              </AnimatedButton>
              <div className="flex items-center gap-2">
                {user && (
                  <AnimatedButton
                    type="button"
                    onClick={() => {
                      setShowProfileModal(true);
                      setProfileStudentId(user.studentId || '');
                      setProfilePassword('');
                      setProfileMsg('');
                    }}
                    className="text-left text-base text-gray-600 mr-2 hover:underline"
                    title="Open profile"
                  >
                    <span className="font-semibold text-gray-800">{user.name}</span>
                    <span className="text-gray-400 mx-1">•</span>
                    <span className="font-mono text-sm">{headerStudentId || user.studentId}</span>
                  </AnimatedButton>
                )}
                <AnimatedButton
                  onClick={handleLeave}
                  className="flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Leave Session
                </AnimatedButton>
                {onLogout && (
                  <AnimatedButton
                    onClick={onLogout}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium"
                  >
                    Logout
                  </AnimatedButton>
                )}
              </div>
            </div>
          </div>

          {/* Mobile - Messages and Menu */}
          <div className="flex items-center gap-2 md:hidden shrink-0">
            <AnimatedButton
              onClick={async () => {
                await checkMessages();
                setShowInbox(true);
              }}
              className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gray-50"
            >
              <MessageSquare className="w-5 h-5 text-gray-700" />
              {unreadMessages > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </AnimatedButton>
            <AnimatedButton
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50"
            >
              <Menu className="w-5 h-5 text-gray-800" />
            </AnimatedButton>
          </div>
        </div>
      </div>

      {/* Mobile menu sheet */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-7xl mx-auto space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <GroupDock userId={mySession.userId} userName={mySession.name} />
              <ReactionsDock groupCode={groupCode} />
              <WhiteboardDock groupCode={groupCode} />
              <button
                onClick={togglePerfMode}
                className={`text-[11px] px-2 py-1 rounded-full border ${perfMode ? 'bg-gray-100 border-gray-300' : 'bg-white/70 border-white/40 hover:bg-white'}`}
                title="Toggle Performance Mode"
              >
                {perfMode ? 'Performance: On' : 'Performance: Off'}
              </button>
            </div>
            <div className="flex flex-col gap-2 pt-1 border-t border-gray-100 mt-2">
              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileModal(true);
                    setProfileStudentId(user.studentId || '');
                    setProfilePassword('');
                    setProfileMsg('');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-between text-xs text-gray-700"
                >
                  <span className="font-semibold">{user.name}</span>
                  <span className="font-mono">{headerStudentId || user.studentId}</span>
                </button>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLeave();
                }}
                className="text-xs text-orange-600 text-left"
              >
                Leave Session
              </button>
              {onLogout && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="text-xs text-red-600 text-left"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Removed Online Users Section as requested */}
            {/* Your Session Card */}
            <TiltWrapper className="rounded-[22px] p-[1.5px] bg-[length:200%_200%] border border-transparent animate-float-slow hover:animate-float-hover transition-transform"
              style={{ backgroundImage: 'linear-gradient(135deg, rgba(239,68,68,0.5), rgba(252,165,165,0.3), rgba(239,68,68,0.5))', animation: 'gradientMove 8s ease-in-out infinite', transformStyle: 'preserve-3d' }}>
              <div className="rounded-[20px] bg-white/70 backdrop-blur-sm shadow-[0_10px_36px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_44px_rgba(0,0,0,0.16)] transition-shadow p-8 lg:p-10 relative overflow-hidden will-change-transform shimmer-overlay">
                <div className="pointer-events-none absolute -top-8 left-0 right-0 h-12 bg-gradient-to-b from-white/40 to-transparent opacity-80" />
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-[1.4rem] tracking-tight text-gray-900">Your Session</h2>
                {!isEditing && (
                    <AnimatedButton
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </AnimatedButton>
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
                    <AnimatedButton
                      onClick={handleSaveEdit}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                    >
                      <Check className="w-4 h-4" />
                      Save
                    </AnimatedButton>
                    <AnimatedButton
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
                    </AnimatedButton>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupCode && (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">Group {groupCode}</span>
                      <span className="text-xs text-gray-500">Active</span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-700">Name</p>
                    <p className="text-gray-900 font-medium">{mySession.name}</p>
                  </div>
                  {mySession.studentId && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Student ID</p>
                      <p className="font-mono text-sm text-gray-900">{mySession.studentId}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-700">Course</p>
                    <p className="font-mono font-semibold text-blue-600">{mySession.courseCode}</p>
                  </div>
                  {mySession.workingOn && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Working on</p>
                      <p className="text-gray-900 font-medium">{mySession.workingOn}</p>
                    </div>
                  )}
                  {mySession.location && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Where</p>
                      <p className="text-gray-900 font-medium">{mySession.location}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-700">Status</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        mySession.status === 'active' ? 'bg-green-500' : 'bg-orange-500'
                      }`}></div>
                      <span className="text-gray-900 font-medium capitalize">
                        {mySession.status === 'active' ? 'Studying Now' : 'Taking a Break'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            </TiltWrapper>

            {/* Filter and Sessions Feed */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Active Sessions</h2>
                  <div className="mt-1 h-1 w-12 rounded-full bg-red-500/60" />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={()=> setFilter('myCourse')}
                      className={`px-2.5 py-1 rounded-full text-xs border ${filter==='myCourse' ? 'bg-red-600 text-white border-red-600' : 'bg-white/80 border-white/50 hover:bg-white'}`}
                      title="Show sessions in your course (Group-friendly)"
                    >
                      Groups
                    </button>
                  </div>
                  <PopularChips courseCounts={courseCounts} onSelect={(dept)=> setFilter(dept)} />
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
                <div className="relative rounded-2xl bg-white/60 backdrop-blur-sm shadow-sm p-12 text-center border border-white/40 overflow-hidden">
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
                    <span className="animate-float-slow text-6xl">📚</span>
                  </div>
                  <p className="text-gray-500 text-lg">
                    📚 No one studying right now — be the first!
                  </p>
                </div>
              ) : (
                <div className={`rounded-2xl bg-white/60 backdrop-blur-sm shadow-sm border border-white/40 overflow-hidden relative shimmer-overlay backdrop-blur-md ${celebrate ? 'sweep-highlight' : ''}`}>
                  <div className="divide-y">
                    {filteredSessions.map((session, idx) => (
                      <UiSessionCard key={session.id}>
                        <TiltWrapper>
                        <div className="relative transition-all duration-200 hover:shadow-[0_0_24px_rgba(255,0,0,0.12)] hover:-translate-y-[2px]">
                          <div className={`${idx % 2 === 0 ? 'bg-white/90' : 'bg-red-50/80'} flex items-center justify-between px-4 py-3 rounded-xl relative transition-transform duration-200 will-change-transform shimmer-overlay`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-2 h-2 rounded-full ${session.status === 'active' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Avatar name={session.name} size={26} />
                                <span className="font-semibold text-gray-900">{session.name}</span>
                              </div>
                              <div className="text-xs text-gray-500 font-mono">{session.studentId}</div>
                            </div>
                            <div className="font-mono font-semibold text-blue-600">{session.courseCode}</div>
                            {session.workingOn && <div className="text-sm text-gray-600">• {session.workingOn}</div>}
                            {session.location && <div className="text-xs text-gray-500">• 📍 {session.location}</div>}
                          </div>
                          <AnimatedButton
                            onClick={() => handleConnect(session)}
                            className="px-3 py-1 border rounded hover:bg-gray-50"
                          >
                            Connect
                          </AnimatedButton>
                          <div className="pointer-events-none absolute inset-0">
                            <div className="sparkle absolute top-2 left-6 w-1 h-1 bg-red-400 rounded-full opacity-60"></div>
                            <div className="sparkle absolute bottom-2 right-10 w-1.5 h-1.5 bg-red-300 rounded-full opacity-60"></div>
                          </div>
                          </div>
                        </div>
                        </TiltWrapper>
                      </UiSessionCard>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6 sticky top-4">
              <SuggestedBuddies mySession={mySession} allSessions={allSessions} />
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

      {/* Optional subtle sparkles near bottom */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="sparkle w-2 h-2 bg-red-300 rounded-full absolute top-1/3 left-1/4 animate-ping" />
        <div className="sparkle w-2 h-2 bg-pink-300 rounded-full absolute top-2/3 right-1/3 animate-ping delay-500" />
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
        <MotionModal isOpen={showMessageModal}>
          <ChatWindowShell
            title={`Chat with ${selectedUser.name}`}
            subtitle={selectedUser.courseCode}
          >
              {conversation.length === 0 ? (
                <p className="text-sm text-gray-500">No messages yet. Say hi!</p>
              ) : (
                conversation.map((msg) => (
                  <div key={msg.id} className={`mb-2 flex ${msg.from_user === mySession?.userId ? 'justify-end' : 'justify-start'}`}>
                    <ChatMessageBubble variant={msg.from_user === mySession?.userId ? 'outgoing' : 'incoming'}>
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
                    </ChatMessageBubble>
                  </div>
                ))
              )}
          </ChatWindowShell>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xl px-4">
            <div className="flex flex-wrap gap-2 items-center justify-between bg-gradient-to-br from-white/96 to-white/80 backdrop-blur-md rounded-xl p-3 shadow border border-white/40" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 10px 30px rgba(0,0,0,0.06)' }}>
              <TypingDots />
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (message.trim()) sendMessage();
                  }
                }}
                placeholder="Type a message"
                className="flex-1 min-w-[160px] border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <AnimatedButton
                onClick={sendMessage}
                disabled={!message.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap order-3 sm:order-none"
              >
                Send
              </AnimatedButton>
              <label className="px-3 py-2 border rounded cursor-pointer hover:bg-gray-50 order-2 sm:order-none">
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
                <AnimatedButton
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
                </AnimatedButton>
              )}
              <AnimatedButton
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
              </AnimatedButton>
            </div>
          </div>
        </MotionModal>
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
              <AnimatedButton
                onClick={() => {
                  setShowInbox(false);
                  // Refresh messages when closing
                  checkMessages();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </AnimatedButton>
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
                        <AnimatedButton
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
                        </AnimatedButton>
                    ))}
                        </div>
                );
              })()}
                      </div>
                    </div>
                    </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Your Profile</h3>
              <AnimatedButton onClick={() => setShowProfileModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </AnimatedButton>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID (unique, 9 digits)</label>
                <input
                  value={profileStudentId}
                  onChange={(e) => setProfileStudentId(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="260123456"
                  maxLength={9}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password (optional)</label>
                <input
                  type="password"
                  value={profilePassword}
                  onChange={(e) => setProfilePassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
              {profileMsg && (
                <div className="text-sm">{profileMsg}</div>
              )}
              <div className="flex items-center justify-end gap-2">
                        <AnimatedButton
                  onClick={() => setShowProfileModal(false)}
                  className="px-3 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Close
                </AnimatedButton>
                <AnimatedButton
                  disabled={profileSaving}
                  onClick={async () => {
                    setProfileSaving(true);
                    setProfileMsg('');
                    try {
                      const { data: { user: authUser } } = await supabase.auth.getUser();
                      if (!authUser) throw new Error('Please login again');
                      // Update student ID if changed
                      if (profileStudentId && profileStudentId !== (user?.studentId || '')) {
                        // Uniqueness check
                        const { data: conflict } = await supabase
                          .from('profiles')
                          .select('user_id')
                          .eq('student_id', profileStudentId)
                          .neq('user_id', authUser.id)
                          .maybeSingle();
                        if (conflict) throw new Error('This Student ID is already in use.');
                        await supabase.from('profiles').upsert({
                          user_id: authUser.id,
                          student_id: profileStudentId,
                        });
                      }
                      // Update password if provided
                      if (profilePassword.trim()) {
                        const { error } = await supabase.auth.updateUser({ password: profilePassword.trim() });
                        if (error) throw error;
                      }
                      setProfileMsg('Saved');
                      // Reflect in top bar locally
                      if (profileStudentId) setHeaderStudentId(profileStudentId);
                    } catch (e) {
                      setProfileMsg(e?.message || 'Failed to save');
                    } finally {
                      setProfileSaving(false);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {profileSaving ? 'Saving...' : 'Save'}
                </AnimatedButton>
                      </div>
            </div>
          </div>
        </div>
      )}
      </MotionFadeSlide>
    </DashboardShell>
  );
};

export default Dashboard;

