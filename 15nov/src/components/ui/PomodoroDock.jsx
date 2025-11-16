import { useEffect, useRef, useState } from 'react';

export default function PomodoroDock() {
	const [mode, setMode] = useState('focus'); // 'focus' | 'break'
	const [seconds, setSeconds] = useState(25 * 60);
	const intervalRef = useRef(null);
	const runningRef = useRef(false);

	useEffect(() => {
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, []);

	const toggle = () => {
		if (runningRef.current) {
			clearInterval(intervalRef.current);
			runningRef.current = false;
			return;
		}
		runningRef.current = true;
		intervalRef.current = setInterval(() => {
			setSeconds((s) => {
				if (s <= 1) {
					clearInterval(intervalRef.current);
					runningRef.current = false;
					// Auto-switch mode
					if (mode === 'focus') {
						setMode('break');
						return 5 * 60;
					} else {
						setMode('focus');
						return 25 * 60;
					}
				}
				return s - 1;
			});
		}, 1000);
	};

	const reset = () => {
		if (intervalRef.current) clearInterval(intervalRef.current);
		runningRef.current = false;
		setSeconds(mode === 'focus' ? 25 * 60 : 5 * 60);
	};

	const pretty = () => {
		const m = Math.floor(seconds / 60).toString().padStart(2, '0');
		const s = (seconds % 60).toString().padStart(2, '0');
		return `${m}:${s}`;
	};

	return (
		<div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur border border-white/40 shadow-sm">
			<span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${mode === 'focus' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
				{mode === 'focus' ? 'Focus' : 'Break'}
			</span>
			<span className="font-mono text-sm tabular-nums">{pretty()}</span>
			<button onClick={toggle} className="text-xs px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200"> {runningRef.current ? 'Pause' : 'Start'} </button>
			<button onClick={reset} className="text-xs px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200">Reset</button>
		</div>
	);
}


