import { useEffect, useRef } from 'react';

export default function ConfettiBurst({ fire }) {
	const containerRef = useRef(null);

	useEffect(() => {
		if (!fire) return;
		const node = containerRef.current;
		if (!node) return;
		// Create lightweight confetti pieces
		const colors = ['#D6001C', '#111827', '#FDE68A', '#60A5FA', '#34D399'];
		const total = 36;
		const created = [];
		for (let i = 0; i < total; i++) {
			const span = document.createElement('span');
			span.className = 'confetti-piece';
			span.style.setProperty('--x', `${(Math.random() * 2 - 1) * 60}vw`);
			span.style.setProperty('--dur', `${2.2 + Math.random() * 1.6}s`);
			span.style.backgroundColor = colors[i % colors.length];
			span.style.transform = `translateX(-50%) translateY(0) rotate(${Math.random() * 360}deg)`;
			created.push(span);
			node.appendChild(span);
		}
		const t = setTimeout(() => {
			created.forEach(el => el.remove());
		}, 4000);
		return () => clearTimeout(t);
	}, [fire]);

	return <div ref={containerRef} className="pointer-events-none fixed inset-0 z-[9999]" aria-hidden="true" />;
}


