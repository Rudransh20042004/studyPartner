import ParallaxLayer from './ParallaxLayer';

export default function DashboardParallax() {
	return (
		<div className="absolute inset-0 -z-10 pointer-events-none" aria-hidden="true">
			<ParallaxLayer depth={6} className="absolute inset-0">
				<div className="absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl opacity-30" style={{ background: 'radial-gradient(closest-side, rgba(214,0,28,0.18), rgba(214,0,28,0) 70%)' }} />
			</ParallaxLayer>
			<ParallaxLayer depth={8} className="absolute inset-0">
				<div className="absolute bottom-0 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-25" style={{ background: 'radial-gradient(closest-side, rgba(0,0,0,0.08), rgba(0,0,0,0) 70%)' }} />
			</ParallaxLayer>
		</div>
	);
}


