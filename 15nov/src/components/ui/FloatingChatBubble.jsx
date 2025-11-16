// Pure presentational floating chat bubble (static content)
export default function FloatingChatBubble() {
	return (
		<div className="relative">
			<style>{`
				@keyframes wave {
					0% { transform: translateY(0px) }
					50% { transform: translateY(-4px) }
					100% { transform: translateY(0px) }
				}
				@keyframes pulseGlow {
					0% { box-shadow: 0 10px 30px rgba(0,0,0,0.06) }
					50% { box-shadow: 0 12px 34px rgba(0,0,0,0.12) }
					100% { box-shadow: 0 10px 30px rgba(0,0,0,0.06) }
				}
			`}</style>
			<div
				className="rounded-2xl shadow-xl border border-white/40 bg-white/80 backdrop-blur-md p-4 w-64"
				style={{ animation: 'wave 5.5s ease-in-out infinite, pulseGlow 3.6s ease-in-out infinite' }}
			>
				<div className="flex items-center gap-2 mb-2">
					<div className="w-2 h-2 rounded-full bg-emerald-500" />
					<div className="text-xs text-gray-600">New message</div>
				</div>
				<div className="rounded-xl bg-gray-900 text-white text-sm px-3 py-2 w-fit shadow">
					Hey! Studying for the midterm?
				</div>
				<div className="mt-2 text-[10px] text-gray-500">Just now</div>
			</div>
		</div>
	);
}


