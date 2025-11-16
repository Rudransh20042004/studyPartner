import { useRef } from 'react';

export default function TiltWrapper({ children, className = '' }) {
	const ref = useRef(null);
	const onMove = (e) => {
		const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (prefersReduced) return;
		const el = ref.current;
		if (!el) return;
		const r = el.getBoundingClientRect();
		const x = e.clientX - r.left;
		const y = e.clientY - r.top;
		const midX = r.width / 2;
		const midY = r.height / 2;
		const rotateY = ((x - midX) / midX) * 3;
		const rotateX = ((midY - y) / midY) * 3;
		el.style.transform = `perspective(900px) translateZ(0) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
	};
	const onLeave = () => {
		if (ref.current) ref.current.style.transform = '';
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


