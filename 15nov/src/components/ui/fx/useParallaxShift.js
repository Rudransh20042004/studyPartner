import { useEffect, useState } from 'react';

export default function useParallaxShift(multiplier = 10) {
	const [offset, setOffset] = useState({ x: 0, y: 0 });

	useEffect(() => {
		const prefersReduced =
			window.matchMedia &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (prefersReduced) return;

		const onMove = (e) => {
			const { innerWidth, innerHeight } = window;
			const x = (e.clientX - innerWidth / 2) / innerWidth;
			const y = (e.clientY - innerHeight / 2) / innerHeight;
			setOffset({
				x: x * multiplier,
				y: y * multiplier,
			});
		};
		window.addEventListener('mousemove', onMove, { passive: true });
		return () => window.removeEventListener('mousemove', onMove);
	}, [multiplier]);

	return offset;
}


