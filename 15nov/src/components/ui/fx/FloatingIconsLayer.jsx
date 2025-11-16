export default function FloatingIconsLayer() {
	const icons = ['📚','💡','💬','🎓','✏️','📄','📚','💡','💬','✏️'];
	const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (prefersReduced) return null;
	return (
		<div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
			{icons.map((sym, i) => {
				const top = `${(i * 11) % 90 + 5}%`;
				const left = `${(i * 17) % 90 + 5}%`;
				const delay = (i * 0.4) % 3;
				const size = 18 + (i % 4) * 4;
				const opacity = 0.16 + (i % 5) * 0.02;
				return (
					<div
						key={i}
						className="absolute animate-float-slow animate-gentle-rotate"
						style={{ top, left, animationDelay: `${delay}s`, fontSize: size, opacity }}
					>
						{sym}
					</div>
				);
			})}
		</div>
	);
}


