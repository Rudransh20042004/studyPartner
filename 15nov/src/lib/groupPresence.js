import { supabase } from '../lib/supabaseClient';

/**
 * Lightweight group presence using Supabase Realtime Presence.
 * Tracks { userId, name } and exposes a live member list.
 *
 * @param {string} roomId
 * @param {{userId:string,name:string}} me
 * @param {(members: Array<{userId:string,name?:string}>)=>void} onUpdate
 * @returns {() => void} cleanup
 */
export function initGroupPresence(roomId, me, onUpdate) {
	if (!roomId) return () => {};
	const channel = supabase.channel(`group:${roomId}`, {
		config: { presence: { key: me?.userId || Math.random().toString(36).slice(2) } },
	});

	channel.on('presence', { event: 'sync' }, () => {
		try {
			const state = channel.presenceState(); // { [key]: [{ userId, name }] }
			const list = Object.values(state || {}).flat().map((p) => ({ userId: p.userId, name: p.name }));
			onUpdate?.(list);
		} catch {}
	});

	channel.subscribe(async (status) => {
		if (status === 'SUBSCRIBED') {
			try {
				await channel.track({ userId: me?.userId, name: me?.name });
			} catch {}
		}
	});

	return () => {
		try { supabase.removeChannel(channel); } catch {}
	};
}


