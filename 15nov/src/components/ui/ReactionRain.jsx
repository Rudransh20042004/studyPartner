import { useEffect, useRef } from 'react';

export default function ReactionRain() {
	const ref = useRef(null);
	useEffect(() => {
		const handler = (e) => {
			const emoji = e?.detail?.emoji || '👏';
			const node = ref.current;
			if (!node) return;
			// Create a small burst of floating emojis
			const total = 10;
			const els = [];
			for (let i = 0; i < total; i++) {
				const span = document.createElement('span');
				span.textContent = emoji;
				span.style.position = 'absolute';
				span.style.left = `${Math.random() * 100}%`;
				span.style.bottom = `-10px`;
				span.style.fontSize = `${18 + Math.random() * 10}px`;
				span.style.opacity = '0';
				span.style.animation = `reaction-float ${1600 + Math.random() * 900}ms ease-out forwards`;
				span.style.setProperty('--x', `${(Math.random() * 2 - 1) * 40}px`);
				els.push(span);
				node.appendChild(span);
			}
			setTimeout(() => els.forEach(el => el.remove()), 2500);
		};
		window.addEventListener('reaction:burst', handler);
		return () => window.removeEventListener('reaction:burst', handler);
	}, []);
	return <div ref={ref} className="pointer-events-none fixed inset-0 z-[70]" aria-hidden="true" />;
}


