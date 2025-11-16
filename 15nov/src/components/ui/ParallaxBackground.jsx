import { useEffect, useRef } from 'react';
import useParallaxShift from './fx/useParallaxShift';

// Purely visual, lightweight parallax gradient blobs
// No Supabase, no data fetching, no navigation
export default function ParallaxBackground() {
	const layer1Ref = useRef(null);
	const layer2Ref = useRef(null);
	const layer3Ref = useRef(null);
	const shift = useParallaxShift(10);

	useEffect(() => {
		const prefersReduced =
			window.matchMedia &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (prefersReduced) return;
		const apply = () => {
			const x = shift.x / 10;
			const y = shift.y / 10;
			if (layer1Ref.current) layer1Ref.current.style.transform = `translate3d(${x * 12}px, ${y * 12}px, 0)`;
			if (layer2Ref.current) layer2Ref.current.style.transform = `translate3d(${x * -18}px, ${y * -18}px, 0)`;
			if (layer3Ref.current) layer3Ref.current.style.transform = `translate3d(${x * 8}px, ${y * -8}px, 0)`;
		};
		apply();
	}, []);

	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden">
			<style>{`
				@keyframes floatSlow {
					0% { transform: translateY(0px) scale(1); }
					50% { transform: translateY(-8px) scale(1.01); }
					100% { transform: translateY(0px) scale(1); }
				}
			`}</style>
			<div
				ref={layer1Ref}
				aria-hidden="true"
				className="absolute -top-24 -left-24 w-[36rem] h-[36rem] rounded-full blur-3xl opacity-40"
				style={{
					background:
						'radial-gradient(closest-side, rgba(214,0,28,0.25), rgba(214,0,28,0) 70%)',
					animation: 'floatSlow 10s ease-in-out infinite',
				}}
			/>
			<div
				ref={layer2Ref}
				aria-hidden="true"
				className="absolute top-1/4 -right-24 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-40"
				style={{
					background:
						'radial-gradient(closest-side, rgba(0,0,0,0.12), rgba(0,0,0,0) 70%)',
					animation: 'floatSlow 12s ease-in-out infinite',
				}}
			/>
			<div
				ref={layer3Ref}
				aria-hidden="true"
				className="absolute bottom-0 left-1/3 w-[24rem] h-[24rem] rounded-full blur-3xl opacity-40"
				style={{
					background:
						'radial-gradient(closest-side, rgba(214,0,28,0.18), rgba(214,0,28,0) 70%)',
					animation: 'floatSlow 9s ease-in-out infinite',
				}}
			/>
		</div>
	);
}


