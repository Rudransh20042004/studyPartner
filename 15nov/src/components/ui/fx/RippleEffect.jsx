import { useEffect, useState } from 'react';

export default function RippleEffect({ triggerKey }) {
	const [ripples, setRipples] = useState([]);
	useEffect(() => {
		// fire a gentle ripple on mount and on triggerKey change
		const now = Date.now();
		setRipples((prev) => [...prev, { id: now }].slice(-6));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [triggerKey]);

	return (
		<div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
			{ripples.map((r) => (
				<div key={r.id} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-white/40 ripple-ring" />
			))}
		</div>
	);
}


