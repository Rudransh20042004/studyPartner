import ParallaxGradientLayer from './ParallaxGradientLayer';
import DashboardParallax from './DashboardParallax';
import FloatingIconsLayer from './FloatingIconsLayer';
import FloatingIconOrbit from './FloatingIconOrbit';
import DashboardSparkles from './DashboardSparkles';
import SparkleLayer from './SparkleLayer';
import RippleAmbient from './RippleAmbient';
import BackgroundBlobs from './BackgroundBlobs';

export default function GlobalFX() {
	return (
		<div className="absolute inset-0 -z-10 pointer-events-none" aria-hidden="true">
			<ParallaxGradientLayer />
			<DashboardParallax />
			<FloatingIconsLayer />
			<FloatingIconOrbit />
			<DashboardSparkles />
			<SparkleLayer />
			<RippleAmbient />
			<BackgroundBlobs />
		</div>
	);
}


