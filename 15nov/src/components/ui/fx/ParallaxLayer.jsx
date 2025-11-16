import useParallaxShift from './useParallaxShift';

export default function ParallaxLayer({ depth = 10, className = '', children }) {
	const shift = useParallaxShift(depth);
	const style = { transform: `translate3d(${shift.x}px, ${shift.y}px, 0)` };
	return (
		<div className={`pointer-events-none ${className}`} style={style} aria-hidden="true">
			{children}
		</div>
	);
}


