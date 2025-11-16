import { supabase } from '../lib/supabaseClient';

/**
 * Minimal collaborative Pomodoro via Supabase Realtime channel.
 * UI-only sync: start/pause/reset/broadcast remaining seconds and mode.
 *
 * @param {string} roomId
 * @param {(state: { mode: 'focus'|'break', seconds: number, running: boolean, updatedBy?: string })=>void} onState
 * @returns {{ send:(state:any)=>void, leave:()=>void }} controls
 */
export function initCollabPomodoro(roomId, onState) {
  const channel = supabase.channel(`pomodoro-room:${roomId}`);

  channel.on('broadcast', { event: 'state' }, ({ payload }) => {
    if (typeof onState === 'function') onState(payload);
  });

  channel.subscribe();

  function send(state) {
    try {
      channel.send({ type: 'broadcast', event: 'state', payload: state });
    } catch {}
  }
  function leave() {
    try { supabase.removeChannel(channel); } catch {}
  }
  return { send, leave };
}


