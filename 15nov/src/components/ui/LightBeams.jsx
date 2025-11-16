export default function LightBeams() {
	return (
		<div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
			<div
				className="absolute -top-32 -left-10 w-[120%] h-64 rotate-12 bg-gradient-to-r from-white/0 via-white/12 to-white/0 animate-beam-sweep"
				style={{ animationDelay: '0s' }}
			/>
			<div
				className="absolute top-10 -right-10 w-[120%] h-48 -rotate-12 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-beam-sweep"
				style={{ animationDelay: '1.2s' }}
			/>
		</div>
	);
}


