import { useEffect, useRef, useState } from 'react';
import { initCollabPomodoro } from '../../lib/collabPomodoro';

export default function CollabPomodoroDock() {
	const [roomId, setRoomId] = useState('');
	const [joined, setJoined] = useState(false);
	const [mode, setMode] = useState('focus'); // 'focus' | 'break'
	const [seconds, setSeconds] = useState(25 * 60);
	const [running, setRunning] = useState(false);
	const timerRef = useRef(null);
	const collabRef = useRef(null);

	useEffect(() => {
		return () => {
			clearInterval(timerRef.current);
			if (collabRef.current) collabRef.current.leave();
		};
	}, []);

	const pretty = () => {
		const m = Math.floor(seconds / 60).toString().padStart(2, '0');
		const s = (seconds % 60).toString().padStart(2, '0');
		return `${m}:${s}`;
	};

	const broadcast = (next) => {
		if (collabRef.current) {
			collabRef.current.send({ ...next, updatedBy: 'client' });
		}
	};

	const handleTick = () => {
		setSeconds((s) => {
			if (s <= 1) {
				clearInterval(timerRef.current);
				setRunning(false);
				const nextMode = mode === 'focus' ? 'break' : 'focus';
				const nextSeconds = nextMode === 'focus' ? 25 * 60 : 5 * 60;
				setMode(nextMode);
				setSeconds(nextSeconds);
				broadcast({ mode: nextMode, seconds: nextSeconds, running: false });
				return 0;
			}
			const n = s - 1;
			broadcast({ mode, seconds: n, running: true });
			return n;
		});
	};

	const start = () => {
		if (running) return;
		setRunning(true);
		clearInterval(timerRef.current);
		timerRef.current = setInterval(handleTick, 1000);
		broadcast({ mode, seconds, running: true });
	};
	const pause = () => {
		if (!running) return;
		setRunning(false);
		clearInterval(timerRef.current);
		broadcast({ mode, seconds, running: false });
	};
	const reset = () => {
		clearInterval(timerRef.current);
		setRunning(false);
		const base = mode === 'focus' ? 25 * 60 : 5 * 60;
		setSeconds(base);
		broadcast({ mode, seconds: base, running: false });
	};

	const join = () => {
		if (!roomId.trim()) return;
		if (collabRef.current) collabRef.current.leave();
		collabRef.current = initCollabPomodoro(roomId.trim(), (state) => {
			if (typeof state?.seconds === 'number') setSeconds(state.seconds);
			if (state?.mode === 'focus' || state?.mode === 'break') setMode(state.mode);
			if (typeof state?.running === 'boolean') setRunning(state.running);
		});
		setJoined(true);
	};
	const leave = () => {
		if (collabRef.current) collabRef.current.leave();
		collabRef.current = null;
		setJoined(false);
	};

	return (
		<div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur border border-white/40 shadow-sm">
			{!joined ? (
				<>
					<input value={roomId} onChange={(e)=>setRoomId(e.target.value)} placeholder="Pomodoro room" className="text-xs px-2 py-0.5 rounded bg-gray-100" />
					<button onClick={join} className="text-xs px-2 py-0.5 rounded bg-red-600 text-white hover:bg-red-700">Join</button>
				</>
			) : (
				<>
					<span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${mode === 'focus' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{mode}</span>
					<span className="font-mono text-sm tabular-nums">{pretty()}</span>
					<button onClick={start} className="text-xs px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200">Start</button>
					<button onClick={pause} className="text-xs px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200">Pause</button>
					<button onClick={reset} className="text-xs px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200">Reset</button>
					<button onClick={leave} className="text-xs px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200">Leave</button>
				</>
			)}
		</div>
	);
}


