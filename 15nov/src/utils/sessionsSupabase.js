import { supabase } from '../lib/supabaseClient';
const CHAT_BUCKET = import.meta.env.VITE_CHAT_BUCKET || 'chat-images';

// Insert a session row in Supabase
export async function createSessionSupabase(name, studentId, courseCode, workingOn, location = '') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }
  const payload = {
    user_id: user.id,
    name,
    student_id: studentId,
    course_code: (courseCode || '').toUpperCase(),
    working_on: workingOn || 'Studying',
    location: location || '',
    status: 'active',
    last_active: new Date().toISOString(),
  };
  // Upsert to avoid duplicates if called concurrently or from multiple tabs
  const { data, error } = await supabase
    .from('sessions')
    .upsert(payload, { onConflict: 'user_id' })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

// Fetch recent sessions (last 5 minutes)
export async function getRecentSessionsSupabase() {
  // Keep sessions visible for 5 minutes of inactivity
  const threshold = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('sessions')
    .select('id, user_id, name, student_id, course_code, working_on, location, status, last_active')
    .eq('status', 'active')
    .gte('last_active', threshold)
    .order('last_active', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function leaveSessionSupabase() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  // First mark inactive so it disappears immediately from active views
  try {
    await supabase
      .from('sessions')
      .update({ status: 'inactive', last_active: new Date().toISOString() })
      .eq('user_id', user.id);
  } catch {}
  // Then hard delete user's sessions (requires delete policy)
  const { error } = await supabase.from('sessions').delete().eq('user_id', user.id);
  if (error) throw error;
}

export async function getMyActiveSessionSupabase() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  // Consider my session active for up to 5 minutes without heartbeat
  const threshold = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('sessions')
    .select('id, user_id, name, student_id, course_code, working_on, location, status, last_active')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .gte('last_active', threshold)
    .order('last_active', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  // Normalize nullable text fields so UI doesn't resurrect old values
  return {
    ...data,
    working_on: data.working_on ?? '',
    location: data.location ?? '',
  };
}

export async function updateHeartbeatSupabase(sessionId) {
  if (!sessionId) return;
  const { error } = await supabase
    .from('sessions')
    .update({ last_active: new Date().toISOString() })
    .eq('id', sessionId);
  if (error) throw error;
}

export async function updateSessionSupabase(sessionId, updates) {
  if (!sessionId) throw new Error('Missing sessionId');
  const payload = {};
  if (typeof updates.workingOn === 'string') {
    const trimmed = updates.workingOn.trim();
    payload.working_on = trimmed === '' ? null : trimmed;
  }
  if (typeof updates.location === 'string') {
    const trimmed = updates.location.trim();
    payload.location = trimmed === '' ? null : trimmed;
  }
  if (typeof updates.status === 'string') payload.status = updates.status;
  payload.last_active = new Date().toISOString();
  const { data, error } = await supabase
    .from('sessions')
    .update(payload)
    .eq('id', sessionId)
    .select('id, name, student_id, course_code, working_on, location, status, last_active')
    .single();
  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    studentId: data.student_id,
    courseCode: data.course_code,
    workingOn: data.working_on || '',
    location: data.location || '',
    status: data.status,
    lastActive: data.last_active,
  };
}

// -------- Messaging helpers --------
export async function sendMessageSupabase({ toUserId, text }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const safeText = (text ?? '').toString().trim();
  if (!safeText) throw new Error('Message cannot be empty');
  if (!toUserId) throw new Error('Missing recipient');
  // fetch names from profiles to store denormalized
  const { data: fromProf } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('user_id', user.id)
    .maybeSingle();
  const { data: toProf } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('user_id', toUserId)
    .maybeSingle();
  const payload = {
    from_user: user.id,
    to_user: toUserId,
    text: safeText,
    from_name: fromProf?.full_name || null,
    to_name: toProf?.full_name || null,
  };
  const { data, error } = await supabase.from('messages').insert(payload).select('id').single();
  if (error) throw error;
  return data.id;
}

export async function listInboxSupabase() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('messages')
    .select('id, from_user, to_user, text, read, created_at, from_name, to_name')
    .eq('to_user', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function markMessageReadSupabase(id) {
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('id', id);
  if (error) throw error;
}

export async function markConversationReadSupabase(otherUserId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('to_user', user.id)
    .eq('from_user', otherUserId)
    .eq('read', false);
  if (error) throw error;
}
// Conversation helpers (two-party thread)
export async function listConversationSupabase(otherUserId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('messages')
    .select('id, from_user, to_user, text, image_url, read, created_at, from_name, to_name')
    .in('from_user', [user.id, otherUserId])
    .in('to_user', [user.id, otherUserId])
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function subscribeConversationSupabase(otherUserId, handler) {
  const { data: { user } } = await supabase.auth.getUser();
  const channel = supabase
    .channel(`messages-${otherUserId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'messages' },
      (payload) => {
        const m = payload.new || payload.old;
        if (!m) return;
        // Only react if the message is between me and otherUserId
        const involvesMeAndOther =
          (m.from_user === user.id && m.to_user === otherUserId) ||
          (m.from_user === otherUserId && m.to_user === user.id);
        if (involvesMeAndOther) handler(payload);
      }
    )
    .subscribe();
  return () => {
    try { supabase.removeChannel(channel); } catch {}
  };
}

// Upload an image to the 'chat-images' bucket and send image message
export async function sendImageMessageSupabase({ toUserId, file }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  if (!toUserId) throw new Error('Missing recipient');
  if (!file || !file.type?.startsWith('image/')) throw new Error('Only image files are allowed');
  // fetch names to store denormalized for inbox display
  const { data: fromProf } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('user_id', user.id)
    .maybeSingle();
  const { data: toProf } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('user_id', toUserId)
    .maybeSingle();
  const ext = file.name.split('.').pop() || 'png';
  const path = `${user.id}/${Date.now()}.${ext}`;
  const { error: uploadErr } = await supabase.storage.from(CHAT_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (uploadErr) throw uploadErr;
  const { data: publicUrl } = supabase.storage.from(CHAT_BUCKET).getPublicUrl(path);
  const payload = {
    from_user: user.id,
    to_user: toUserId,
    text: '',
    image_url: publicUrl?.publicUrl || null,
    from_name: fromProf?.full_name || null,
    to_name: toProf?.full_name || null,
  };
  const { error } = await supabase.from('messages').insert(payload);
  if (error) throw error;
}

// Upload a PDF to storage and send as a message (link)
export async function sendPdfMessageSupabase({ toUserId, file }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  if (!toUserId) throw new Error('Missing recipient');
  if (!file || file.type !== 'application/pdf') throw new Error('Only PDF files are allowed');
  // fetch names for denormalized display
  const { data: fromProf } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('user_id', user.id)
    .maybeSingle();
  const { data: toProf } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('user_id', toUserId)
    .maybeSingle();
  const path = `${user.id}/${Date.now()}.pdf`;
  const { error: uploadErr } = await supabase.storage.from(CHAT_BUCKET).upload(path, file, { contentType: 'application/pdf', upsert: false });
  if (uploadErr) throw uploadErr;
  const { data: publicUrl } = supabase.storage.from(CHAT_BUCKET).getPublicUrl(path);
  const payload = {
    from_user: user.id,
    to_user: toUserId,
    text: file.name || 'PDF',
    image_url: publicUrl?.publicUrl || null, // reuse field for link
    from_name: fromProf?.full_name || null,
    to_name: toProf?.full_name || null,
  };
  const { error } = await supabase.from('messages').insert(payload);
  if (error) throw error;
}

// Delete a file attached to a message from Supabase Storage.
// Note: This only deletes the storage object; the DB row remains unchanged.
export async function deleteMessageFileSupabase(message) {
  if (!message?.image_url) throw new Error('No file to delete');
  // Extract the storage path after /object/public/<bucket>/
  const marker = `/object/public/${CHAT_BUCKET}/`;
  const idx = message.image_url.indexOf(marker);
  if (idx === -1) throw new Error('Unrecognized storage URL');
  const path = message.image_url.substring(idx + marker.length);
  const { error: storageErr } = await supabase.storage.from(CHAT_BUCKET).remove([path]);
  if (storageErr) throw storageErr;
  // Also clear the reference in the DB so realtime listeners see the change
  const { error: dbErr } = await supabase
    .from('messages')
    .update({
      image_url: null,
      text: message.text && message.text.trim()
        ? `${message.text} (deleted)`
        : 'File (deleted)',
    })
    .eq('id', message.id);
  if (dbErr) throw dbErr;
}


