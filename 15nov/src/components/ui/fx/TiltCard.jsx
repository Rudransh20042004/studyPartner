import { useRef } from 'react';

export default function TiltCard({ children, className = '' }) {
	const ref = useRef(null);

	const onMove = (e) => {
		const prefersReduced =
			window.matchMedia &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (prefersReduced) return;
		const el = ref.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		const midX = rect.width / 2;
		const midY = rect.height / 2;
		const rotateY = ((x - midX) / midX) * 4; // 3–5deg
		const rotateX = ((midY - y) / midY) * 4;
		el.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
	};

	const onLeave = () => {
		const el = ref.current;
		if (!el) return;
		el.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg) translateZ(0)';
	};

	return (
		<div
			ref={ref}
			className={`transition-transform duration-200 will-change-transform ${className}`}
			onMouseMove={onMove}
			onMouseLeave={onLeave}
		>
			{children}
		</div>
	);
}


