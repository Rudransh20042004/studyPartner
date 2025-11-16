// Visual-only session card wrapper with soft gradient border and hover lift
import ShimmerOverlay from './fx/ShimmerOverlay';

export default function SessionCard({ children }) {
	return (
		<div className="relative">
			<style>{`
				.session-gradient-border {
					background: linear-gradient(135deg, rgba(239,68,68,0.4), rgba(252,165,165,0.3));
				}
			`}</style>
			<div className="session-gradient-border rounded-2xl p-[1.5px] border border-transparent">
				<div
					className="rounded-2xl bg-white/70 backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.12)] transition-shadow duration-200 relative overflow-hidden"
				>
					<div className="pointer-events-none absolute inset-0 opacity-[0.08] bg-gradient-to-b from-white to-transparent" />
					<div className="pointer-events-none absolute -top-6 left-1/3 w-1/2 h-10 bg-white/50 blur-xl rounded-full" />
					<ShimmerOverlay>{children}</ShimmerOverlay>
				</div>
			</div>
		</div>
	);
}


