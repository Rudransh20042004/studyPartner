import ParallaxBackground from './ParallaxBackground';
import FloatingSessionCard from './FloatingSessionCard';
import FloatingChatBubble from './FloatingChatBubble';

// Layout wrapper for the Landing page hero.
// Purely presentational; accepts children for the left column.
export default function LandingHero({ children }) {
	return (
		<div className="relative min-h-screen bg-gradient-to-br from-red-50 to-red-100">
			<ParallaxBackground />
			{/* Diagnostic grid overlay */}
			<div className="pointer-events-none absolute inset-0 opacity-[0.04] -z-0" aria-hidden="true" style={{
				backgroundImage: 'linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)',
				backgroundSize: '40px 40px',
			}} />
			{/* Floor shadow plane */}
			<div className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 w-[60vw] h-24 rounded-[50%] bg-black/10 blur-3xl -z-0" aria-hidden="true" />
			<div className="relative z-10 flex flex-col items-center justify-center px-4 py-20 md:flex-row md:justify-between max-w-6xl mx-auto camera-drift">
				<div className="max-w-lg space-y-6">
					{children}
				</div>
				<div className="hidden md:flex flex-col gap-4 relative">
					<div className="absolute -top-6 -left-6 blur-2xl opacity-30 w-40 h-40 rounded-full"
						style={{ background: 'radial-gradient(closest-side, rgba(214,0,28,0.25), rgba(214,0,28,0) 70%)' }}
					/>
					<FloatingSessionCard />
					<FloatingChatBubble />
					{/* Sparkles */}
					<div className="pointer-events-none absolute -z-10 inset-0">
						<div className="sparkle absolute top-4 left-12 w-2 h-2 bg-white rounded-full"></div>
						<div className="sparkle absolute top-24 right-8 w-1.5 h-1.5 bg-white/90 rounded-full"></div>
						<div className="sparkle absolute bottom-10 left-24 w-1.5 h-1.5 bg-white/80 rounded-full"></div>
						<div className="sparkle absolute bottom-16 right-20 w-2 h-2 bg-white/70 rounded-full"></div>
						<div className="sparkle absolute top-14 right-40 w-1.5 h-1.5 bg-white/80 rounded-full"></div>
					</div>
				</div>
			</div>
		</div>
	);
}


