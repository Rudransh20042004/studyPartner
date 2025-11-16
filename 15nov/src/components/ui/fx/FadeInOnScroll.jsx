import { useEffect, useRef, useState } from 'react';

export default function FadeInOnScroll({ children, className = '', delay = 0 }) {
	const ref = useRef(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const prefersReduced =
			window.matchMedia &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (prefersReduced) {
			setVisible(true);
			return;
		}
		const obs = new IntersectionObserver(
			(entries) => {
				entries.forEach((e) => {
					if (e.isIntersecting) {
						setTimeout(() => setVisible(true), delay * 1000);
						obs.disconnect();
					}
				});
			},
			{ threshold: 0.12 }
		);
		if (ref.current) obs.observe(ref.current);
		return () => obs.disconnect();
	}, [delay]);

	return (
		<div
			ref={ref}
			className={`${className} transition-all duration-300 ${
				visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
			}`}
		>
			{children}
		</div>
	);
}


