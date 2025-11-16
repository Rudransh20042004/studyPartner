import { useEffect, useRef, useState } from 'react';
import { initGroupPresence } from '../../lib/groupPresence';
import { createGroup, joinGroupByCode, leaveGroup } from '../../lib/groups';
import Avatar from './Avatar';

export default function GroupDock({ userId, userName }) {
	const [room, setRoom] = useState('');
	const [joined, setJoined] = useState(false);
	const [members, setMembers] = useState([]);
	const cleanupRef = useRef(null);

	useEffect(() => {
		return () => {
			if (cleanupRef.current) cleanupRef.current();
		};
	}, []);

	const createCode = async () => {
		try {
			const grp = await createGroup('Study Group');
			setRoom(grp.code);
			// Best-effort: also auto-join persistently if possible
			if (grp?.id && userId) await joinGroupByCode(grp.code, userId);
		} catch {}
	};

	const join = async () => {
		const code = room.trim();
		if (!code) return;
		if (cleanupRef.current) cleanupRef.current();
		try { await joinGroupByCode(code, userId); } catch {}
		cleanupRef.current = initGroupPresence(code, { userId, name: userName }, setMembers);
		setJoined(true);
		try { window.dispatchEvent(new CustomEvent('group:joined', { detail: { code } })); } catch {}
	};

	const leave = async () => {
		if (cleanupRef.current) cleanupRef.current();
		cleanupRef.current = null;
		try {
			// Attempt to resolve group id via code (optional; not critical). If schema exists, this will clear membership.
			await leaveGroup(null, userId);
		} catch {}
		setMembers([]);
		setJoined(false);
		try { window.dispatchEvent(new CustomEvent('group:left', { detail: {} })); } catch {}
	};

	return (
		<div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur border border-white/40 shadow-sm">
			{!joined ? (
				<>
					<button onClick={createCode} className="text-xs px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200" title="Generate code">New</button>
					<input value={room} onChange={(e)=>setRoom(e.target.value)} placeholder="Group code" className="text-xs px-2 py-0.5 rounded bg-gray-100 w-24" />
					<button onClick={join} className="text-xs px-2 py-0.5 rounded bg-red-600 text-white hover:bg-red-700">Join</button>
				</>
			) : (
				<>
					<span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">Group {room}</span>
					<div className="flex -space-x-2 items-center">
						{members.slice(0,4).map((m)=>(
							<div key={m.userId} className="ring-2 ring-white rounded-full">
								<Avatar name={m.name || 'Peer'} size={20} />
							</div>
						))}
						{members.length > 4 && <span className="text-xs text-gray-500 ml-2">+{members.length - 4}</span>}
					</div>
					<button onClick={leave} className="text-xs px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200">Leave</button>
				</>
			)}
		</div>
	);
}


