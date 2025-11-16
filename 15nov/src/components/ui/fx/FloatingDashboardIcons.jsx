import FloatingIcon from './FloatingIcon';

export default function FloatingDashboardIcons() {
	return (
		<div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
			<FloatingIcon icon="📚" size={22} delay={0.2} className="absolute top-28 left-24" />
			<FloatingIcon icon="📝" size={18} delay={0.6} className="absolute top-56 right-40" />
			<FloatingIcon icon="💬" size={20} delay={1.1} className="absolute bottom-28 left-1/3" />
			<FloatingIcon icon="🎓" size={20} delay={1.6} className="absolute bottom-16 right-1/4" />
			<FloatingIcon icon="✏️" size={18} delay={2.0} className="absolute top-20 right-1/3" />
			<FloatingIcon icon="💡" size={18} delay={2.4} className="absolute bottom-40 left-10" />
		</div>
	);
}


