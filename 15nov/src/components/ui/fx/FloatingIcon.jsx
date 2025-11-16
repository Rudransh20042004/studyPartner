export default function FloatingIcon({ icon = '📚', size = 20, floatIntensity = 6, delay = 0, className = '' }) {
	const style = {
		fontSize: size,
		animationDelay: `${delay}s`,
		opacity: 0.1,
	};
	return (
		<div
			className={`pointer-events-none select-none animate-float-slow ${className}`}
			style={style}
			aria-hidden="true"
			role="presentation"
		>
			{icon}
		</div>
	);
}


