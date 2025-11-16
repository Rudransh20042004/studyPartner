import { motion } from 'framer-motion';

export default function LoginGlassCard({ children }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 28 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.28, ease: 'easeOut' }}
			className="relative w-full max-w-lg rounded-3xl border border-white/20 bg-white/15 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.18)] hover:shadow-[0_28px_94px_rgba(0,0,0,0.22)] transition-shadow"
		>
			{/* Shine / reflection */}
			<div className="pointer-events-none absolute inset-0 rounded-3xl overflow-hidden">
				<div className="absolute -top-8 left-0 right-0 h-20 bg-gradient-to-b from-white/35 to-transparent opacity-80" />
			</div>
			{/* Hover glow ring */}
			<div className="pointer-events-none absolute -inset-px rounded-3xl ring-1 ring-white/20 hover:shadow-[0_0_0_6px_rgba(255,255,255,0.08)] transition-shadow" />
			<div className="relative p-8">
				{children}
			</div>
		</motion.div>
	);
}


