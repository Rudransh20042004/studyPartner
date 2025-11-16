import ParallaxBackground from './ParallaxBackground';
import GlobalFX from './fx/GlobalFX';

// Purely presentational shell for the dashboard pages
export default function DashboardShell({ children }) {
	return (
		<div className="relative min-h-screen">
			{/* Soft premium vertical gradient background (no blur) */}
			<div
				className="absolute inset-0 -z-10"
				style={{ background: 'linear-gradient(180deg, #ffffff 0%, #ffecec 100%)' }}
				aria-hidden="true"
			/>
			{/* Faint radial glow behind main card area */}
			<div
				className="pointer-events-none absolute top-24 left-1/2 -translate-x-1/2 w-[80vw] max-w-[1200px] h-[60vh] rounded-full blur-3xl opacity-40 -z-10"
				style={{ background: 'radial-gradient(closest-side, rgba(255,255,255,0.9), rgba(255,255,255,0) 70%)' }}
				aria-hidden="true"
			/>
			<ParallaxBackground />
			{/* Ambient parallax layers and sparkles (behind content) */}
			<GlobalFX />
			<div className="relative z-10">
				{/* Removed global backdrop blur overlays to keep content crisp */}
				<div className="pointer-events-none fixed top-0 left-0 w-full h-24 opacity-[0.04] bg-gradient-to-b from-white to-transparent" aria-hidden="true" />
				{children}
			</div>
		</div>
	);
}


