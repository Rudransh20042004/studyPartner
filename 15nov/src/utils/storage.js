import { broadcastToTabs } from './crossTabSync';

// Generate unique ID
export const generateId = () => 'session:' + Date.now() + Math.random().toString(36).substr(2, 9);

// Find ALL active sessions for a student ID (not just one)
export const findAllSessionsByStudentId = async (studentId) => {
  console.log('🔍 Finding ALL sessions for student ID:', studentId);
  try {
    const result = await window.storage.list('session:', true);
    const now = Date.now();
    const sessions = [];
    
    for (const key of result.keys) {
      try {
        const data = await window.storage.get(key, true);
        if (data && data.value) {
          const session = JSON.parse(data.value);
          if (session.studentId === studentId) {
            // Check if session is still active
            if (now - session.lastActive < 300000) {
              sessions.push(session);
              console.log(`✅ Found active session: ${session.name} - ${session.courseCode} (ID: ${session.id})`);
            }
          }
        }
      } catch (e) {
        console.error('Error checking session:', key, e);
      }
    }
    
    console.log(`✅ Found ${sessions.length} active sessions for student ${studentId}`);
    return sessions;
  } catch (e) {
    console.error('Error finding sessions by student ID:', e);
    return [];
  }
};

// Create new session
export const createSession = async (name, studentId, courseCode, workingOn, location = '') => {
  // Check if user already has an active session for this course
  const existingSessions = await findAllSessionsByStudentId(studentId);
  const existingForCourse = existingSessions.find(s => s.courseCode === courseCode.toUpperCase());
  
  if (existingForCourse) {
    // Update existing session instead of creating new one
    console.log('🔄 Updating existing session for same course:', existingForCourse.id);
    const updated = await updateSession(existingForCourse.id, {
      workingOn,
      location: location || '',
      status: 'active',
      lastActive: Date.now()
    });
    
    await window.storage.set('my_session_id', existingForCourse.id, false);
    await window.storage.set(`student_session:${studentId}`, existingForCourse.id, false);
    
    broadcastToTabs('session_updated', { sessionId: existingForCourse.id, session: updated });
    return existingForCourse.id;
  }
  
  // Create new session for new course
  const sessionId = generateId();
  const session = {
    id: sessionId,
    name,
    studentId,
    courseCode: courseCode.toUpperCase(),
    workingOn,
    location: location || '',
    status: 'active',
    timestamp: Date.now(),
    lastActive: Date.now()
  };
  
  console.log('🟢 CREATING NEW SESSION:', sessionId, session);
  
  try {
    await window.storage.set(sessionId, JSON.stringify(session), true); // shared: true
    console.log('✅ Session saved to shared storage:', sessionId);
    
    // Register user in shared registry
    await registerUser(studentId, name);
    
    await window.storage.set('my_session_id', sessionId, false); // personal
    console.log('✅ My session ID saved locally:', sessionId);
    
    // Store mapping: studentId -> sessionId for quick lookup (most recent)
    await window.storage.set(`student_session:${studentId}`, sessionId, false); // personal
    console.log('✅ Student ID mapping saved:', studentId, '->', sessionId);
    
    // Broadcast to other tabs
    broadcastToTabs('session_created', { sessionId, session });
    
    return sessionId;
  } catch (e) {
    console.error('❌ ERROR creating session:', e);
    throw e;
  }
};

// Get all active sessions (filter out stale ones > 5 minutes old)
export const getAllSessions = async () => {
  console.log('🔍 FETCHING ALL SESSIONS...');
  
  try {
    // Get my session ID first
    const myIdData = await window.storage.get('my_session_id', false);
    const myId = myIdData?.value;
    console.log('👤 My session ID:', myId);
    
    // List all sessions
    const result = await window.storage.list('session:', true); // shared: true
    console.log('📋 Found session keys:', result.keys);
    
    const sessions = [];
    const now = Date.now();
    
    for (const key of result.keys) {
      console.log('🔑 Processing key:', key, 'My ID:', myId, 'Match:', key === myId);
      
      // Skip your own session
      if (key === myId) {
        console.log('⏭️ Skipping own session');
        continue;
      }
      
      try {
        const data = await window.storage.get(key, true); // shared: true
        console.log('📦 Raw data for', key, ':', data);
        
        if (data && data.value) {
          const session = JSON.parse(data.value);
          console.log('✅ Parsed session:', session);
          
          // Check if session is still active (last 5 minutes)
          const isActive = (now - session.lastActive) < 300000;
          const ageSeconds = Math.floor((now - session.lastActive) / 1000);
          console.log(`⏰ Session ${session.name}: Active=${isActive}, Age=${ageSeconds}s`);
          
          if (isActive) {
            sessions.push(session);
            console.log(`✅ Added session: ${session.name} - ${session.courseCode}`);
          } else {
            console.log('🧹 Cleaning up stale session:', key);
            await window.storage.delete(key, true).catch(e => console.log('Cleanup failed:', e));
          }
        } else {
          console.warn('⚠️ No data for key:', key);
        }
      } catch (e) {
        console.error('❌ Error processing session:', key, e);
      }
    }
    
    console.log('✅ FINAL SESSIONS LIST:', sessions.length, sessions.map(s => ({ name: s.name, course: s.courseCode, id: s.id })));
    return sessions;
  } catch (e) {
    console.error('❌ ERROR in getAllSessions:', e);
    return [];
  }
};

// Get my session by session ID
export const getMySession = async () => {
  try {
    const myIdData = await window.storage.get('my_session_id', false);
    if (!myIdData) return null;
    
    const sessionData = await window.storage.get(myIdData.value, true);
    if (!sessionData) return null;
    
    return JSON.parse(sessionData.value);
  } catch (e) {
    console.error('Error getting my session:', e);
    return null;
  }
};

// Check if a user exists (checks user registry and sessions)
export const checkUserExists = async (studentId) => {
  console.log('🔍 Checking if user exists:', studentId);
  try {
    // First check user registry (shared storage)
    const registryKey = `user_registry:${studentId}`;
    const registryData = await window.storage.get(registryKey, true);
    
    if (registryData && registryData.value) {
      const userInfo = JSON.parse(registryData.value);
      console.log('✅ User exists in registry:', studentId, 'Name:', userInfo.name);
      return { exists: true, name: userInfo.name };
    }
    
    // Fallback: Check all sessions for this student ID (including expired)
    const result = await window.storage.list('session:', true);
    
    for (const key of result.keys) {
      try {
        const data = await window.storage.get(key, true);
        if (data && data.value) {
          const session = JSON.parse(data.value);
          if (session.studentId === studentId) {
            // Found user in session - register them
            await registerUser(studentId, session.name);
            console.log('✅ User exists (found in session):', studentId, 'Name:', session.name);
            return { exists: true, name: session.name, session };
          }
        }
      } catch (e) {
        console.error('Error checking session:', key, e);
      }
    }
    
    console.log('❌ User does not exist:', studentId);
    return { exists: false };
  } catch (e) {
    console.error('Error checking if user exists:', e);
    return { exists: false };
  }
};

// Register a user in the shared registry
export const registerUser = async (studentId, name) => {
  try {
    const registryKey = `user_registry:${studentId}`;
    const userInfo = {
      studentId,
      name,
      registeredAt: Date.now()
    };
    await window.storage.set(registryKey, JSON.stringify(userInfo), true);
    console.log('✅ User registered:', studentId, name);
  } catch (e) {
    console.error('Error registering user:', e);
  }
};

// Find active session by student ID (returns most recent one)
export const findSessionByStudentId = async (studentId) => {
  console.log('🔍 Finding session for student ID:', studentId);
  try {
    // First check if we have a stored mapping
    const mappingKey = `student_session:${studentId}`;
    const mappingData = await window.storage.get(mappingKey, false);
    
    if (mappingData?.value) {
      // Try to get the session
      const sessionData = await window.storage.get(mappingData.value, true);
      if (sessionData && sessionData.value) {
        const session = JSON.parse(sessionData.value);
        // Check if session is still active (last 5 minutes)
        const now = Date.now();
        if (now - session.lastActive < 300000 && session.studentId === studentId) {
          console.log('✅ Found active session for student ID:', studentId, 'Course:', session.courseCode);
          return session;
        } else {
          // Session expired or doesn't match, clean up
          console.log('🧹 Cleaning up expired session mapping');
          await window.storage.delete(mappingKey, false);
          await window.storage.delete(mappingData.value, true);
        }
      }
    }
    
    // If no mapping found, search all sessions and return most recent
    console.log('🔍 Searching all sessions for student ID:', studentId);
    const allSessions = await findAllSessionsByStudentId(studentId);
    
    if (allSessions.length > 0) {
      // Return most recent session
      const mostRecent = allSessions.sort((a, b) => b.lastActive - a.lastActive)[0];
      console.log('✅ Found most recent session:', mostRecent.courseCode);
      // Update mapping to most recent
      await window.storage.set(`student_session:${studentId}`, mostRecent.id, false);
      return mostRecent;
    }
    
    console.log('❌ No active session found for student ID:', studentId);
    return null;
  } catch (e) {
    console.error('Error finding session by student ID:', e);
    return null;
  }
};

// Update session heartbeat
export const updateHeartbeat = async (sessionId) => {
  console.log('💓 Updating heartbeat for:', sessionId);
  try {
    const data = await window.storage.get(sessionId, true); // shared: true
    if (data && data.value) {
      const session = JSON.parse(data.value);
      session.lastActive = Date.now();
      await window.storage.set(sessionId, JSON.stringify(session), true); // shared: true
      console.log('✅ Heartbeat updated:', sessionId);
      
      // Broadcast heartbeat update to other tabs
      broadcastToTabs('session_updated', { sessionId, session });
    } else {
      console.warn('⚠️ No session data found for heartbeat:', sessionId);
    }
  } catch (e) {
    console.error('❌ Heartbeat update failed:', e);
  }
};

// Update session details
export const updateSession = async (sessionId, updates) => {
  try {
    const data = await window.storage.get(sessionId, true);
    if (!data) return;
    
    const session = JSON.parse(data.value);
    const updated = { ...session, ...updates };
    await window.storage.set(sessionId, JSON.stringify(updated), true);
    
    // Update user registry if name changed
    if (updates.name && session.studentId) {
      await registerUser(session.studentId, updates.name);
    }
    
    // Broadcast update to other tabs
    broadcastToTabs('session_updated', { sessionId, session: updated });
    
    return updated;
  } catch (e) {
    console.error('Session update failed:', e);
    throw e;
  }
};

// Leave session
export const leaveSession = async () => {
  try {
    const myIdData = await window.storage.get('my_session_id', false);
    if (myIdData) {
      // Get session to find student ID
      const sessionData = await window.storage.get(myIdData.value, true);
      if (sessionData && sessionData.value) {
        const session = JSON.parse(sessionData.value);
        // Delete student ID mapping
        if (session.studentId) {
          await window.storage.delete(`student_session:${session.studentId}`, false);
        }
      }
      
      // Delete session and mapping
      await window.storage.delete(myIdData.value, true);
      await window.storage.delete('my_session_id', false);
      console.log('✅ Session and mappings cleaned up');
    }
  } catch (e) {
    console.error('Leave session failed:', e);
  }
};

