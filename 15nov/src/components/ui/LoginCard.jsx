import { motion } from 'framer-motion';

export default function LoginCard({ children }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 24 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.28, ease: 'easeOut' }}
			className="relative w-full max-w-lg rounded-2xl border border-white/20 bg-white/30 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] hover:shadow-[0_24px_70px_rgba(0,0,0,0.16)] transition-shadow"
		>
			{/* Reflection overlay */}
			<div className="pointer-events-none absolute inset-0 rounded-2xl before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/40 before:to-transparent before:opacity-70 before:rounded-2xl" />
			<div className="relative p-8">
				{children}
			</div>
		</motion.div>
	);
}


