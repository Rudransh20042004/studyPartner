import useParallaxShift from './useParallaxShift';

export default function ParallaxGradientLayer() {
	const shift1 = useParallaxShift(8);
	const shift2 = useParallaxShift(12);
	const shift3 = useParallaxShift(6);
	return (
		<div className="absolute inset-0 -z-10 pointer-events-none" aria-hidden="true">
			<div className="absolute -top-24 -left-24 w-[26rem] h-[26rem] rounded-full blur-3xl opacity-35"
				style={{ background: 'radial-gradient(closest-side, rgba(214,0,28,0.18), rgba(214,0,28,0) 70%)', transform: `translate3d(${shift1.x}px, ${shift1.y}px, 0)` }} />
			<div className="absolute bottom-10 right-10 w-[22rem] h-[22rem] rounded-full blur-3xl opacity-25"
				style={{ background: 'radial-gradient(closest-side, rgba(0,0,0,0.08), rgba(0,0,0,0) 70%)', transform: `translate3d(${shift2.x}px, ${shift2.y}px, 0)` }} />
			<div className="absolute top-1/3 left-1/3 w-[18rem] h-[18rem] rounded-full blur-3xl opacity-25"
				style={{ background: 'radial-gradient(closest-side, rgba(214,0,28,0.14), rgba(214,0,28,0) 70%)', transform: `translate3d(${shift3.x}px, ${shift3.y}px, 0)` }} />
		</div>
	);
}


