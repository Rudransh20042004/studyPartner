import { useEffect, useRef, useState } from 'react';

export default function AmbientSoundDock() {
	const [enabled, setEnabled] = useState(false);
	const [scene, setScene] = useState('rain'); // 'rain' | 'cafe' | 'white'
	const ctxRef = useRef(null);
	const gainRef = useRef(null);
	const srcRef = useRef(null);

	useEffect(() => {
		return () => {
			stopAudio();
		};
	}, []);

	const ensureAudio = () => {
		if (!ctxRef.current) {
			ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
			gainRef.current = ctxRef.current.createGain();
			// fixed comfortable volume; rely on system volume for overall loudness
			gainRef.current.gain.value = 0.12;
			gainRef.current.connect(ctxRef.current.destination);
		}
	};

	const startNoise = () => {
		ensureAudio();
		stopAudio();
		const ctx = ctxRef.current;
		const bufferSize = 2 * ctx.sampleRate;
		const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
		const output = noiseBuffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i++) {
			// White noise base
			let n = Math.random() * 2 - 1;
			// Scene shaping
			if (scene === 'rain') n = (n + (Math.random() * 2 - 1) * 0.4) * 0.7;
			if (scene === 'cafe') n = n * 0.4 + Math.sin(i / 4000) * 0.05;
			output[i] = n;
		}
		const noise = ctx.createBufferSource();
		noise.buffer = noiseBuffer;
		noise.loop = true;
		noise.connect(gainRef.current);
		noise.start(0);
		srcRef.current = noise;
	};

	const stopAudio = () => {
		if (srcRef.current) {
			try { srcRef.current.stop(); } catch {}
			srcRef.current.disconnect();
			srcRef.current = null;
		}
	};

	const toggle = () => {
		const next = !enabled;
		setEnabled(next);
		if (next) startNoise();
		else stopAudio();
	};

	const changeScene = (s) => {
		setScene(s);
		if (enabled) startNoise();
	};

	return (
		<div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur border border-white/40 shadow-sm">
			<button onClick={toggle} className="text-xs px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200">{enabled ? 'Stop' : 'Play'}</button>
			<select value={scene} onChange={(e)=>changeScene(e.target.value)} className="text-xs bg-transparent">
				<option value="rain">Rain</option>
				<option value="cafe">Cafe</option>
				<option value="white">White Noise</option>
			</select>
		</div>
	);
}


