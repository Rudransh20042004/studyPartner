import { useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';

const EMOJIS = ['👏','🔥','💡','✅'];

export default function ReactionsDock({ groupCode }) {
	const channelRef = useRef(null);

	useEffect(() => {
		// Clean up any prior channel
		if (channelRef.current) {
			try { supabase.removeChannel(channelRef.current); } catch {}
			channelRef.current = null;
		}
		if (!groupCode) return;
		// Subscribe to the group channel for reaction broadcasts
		const ch = supabase.channel(`group:${groupCode}-reactions`);
		ch.on('broadcast', { event: 'reaction' }, ({ payload }) => {
			try { window.dispatchEvent(new CustomEvent('reaction:burst', { detail: payload })); } catch {}
		});
		ch.subscribe();
		channelRef.current = ch;
		return () => {
			if (channelRef.current) {
				try { supabase.removeChannel(channelRef.current); } catch {}
				channelRef.current = null;
			}
		};
	}, [groupCode]);

	const send = (emoji) => {
		// Local burst for instant feedback
		try { window.dispatchEvent(new CustomEvent('reaction:burst', { detail: { emoji } })); } catch {}
		// Broadcast to peers
		if (channelRef.current) {
			try { channelRef.current.send({ type: 'broadcast', event: 'reaction', payload: { emoji } }); } catch {}
		}
	};

	return (
		<div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 backdrop-blur border border-white/40 shadow-sm">
			{EMOJIS.map(e => (
				<button
					key={e}
					title={`Send ${e}`}
					disabled={!groupCode}
					onClick={() => send(e)}
					className={`text-base leading-none px-2 py-1 rounded hover:bg-gray-100 transition ${groupCode ? '' : 'opacity-50 cursor-not-allowed'}`}
					aria-label={`Send reaction ${e}`}
				>
					{e}
				</button>
			))}
		</div>
	);
}


