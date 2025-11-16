// Pure presentational floating session card (static content)
export default function FloatingSessionCard() {
	return (
		<div className="relative">
			<style>{`
				@keyframes gentleFloat {
					0% { transform: translateY(0px); }
					50% { transform: translateY(-6px); }
					100% { transform: translateY(0px); }
				}
			`}</style>
			<div
				className="rounded-2xl shadow-xl border border-white/40 bg-white/70 backdrop-blur-md p-4 w-64"
				style={{ animation: 'gentleFloat 6s ease-in-out infinite' }}
			>
				<div className="flex items-center justify-between mb-2">
					<span className="text-xs font-semibold tracking-wider text-gray-700">COMP 251</span>
					<span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-green-100 text-green-700">
						Active
					</span>
				</div>
				<div className="text-sm text-gray-900 font-semibold">Studying at McLennan</div>
				<div className="mt-1 text-xs text-gray-600">Hash tables • Midterm review</div>
				<div className="mt-3 flex items-center justify-between">
					<div className="flex -space-x-2">
						<div className="w-6 h-6 rounded-full bg-red-200 border border-white" />
						<div className="w-6 h-6 rounded-full bg-red-300 border border-white" />
						<div className="w-6 h-6 rounded-full bg-red-100 border border-white" />
					</div>
					<button
						className="text-[11px] px-2 py-1 rounded-md bg-black text-white shadow-sm hover:shadow transition"
						type="button"
					>
						View
					</button>
				</div>
			</div>
		</div>
	);
}


