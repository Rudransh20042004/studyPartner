export default function LoginBackground() {
	return (
		<div className="absolute inset-0 -z-10 overflow-hidden">
			{/* Base gradient */}
			<div
				className="absolute inset-0"
				style={{
					background:
						'linear-gradient(180deg, #ffffff 0%, #fff5f6 55%, #ffe9ec 100%)',
				}}
			/>
			{/* Radial highlight behind card */}
			<div
				className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] max-w-[900px] max-h-[900px] rounded-full blur-3xl opacity-60 pointer-events-none"
				style={{
					background:
						'radial-gradient(closest-side, rgba(255,255,255,0.9), rgba(255,255,255,0) 70%)',
				}}
			/>
			{/* Decorative McGill-themed blobs/shapes */}
			<div className="pointer-events-none absolute -z-10 inset-0">
				<div className="animate-float-slow absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-40"
					style={{ background: 'radial-gradient(closest-side, rgba(214,0,28,0.22), rgba(214,0,28,0) 70%)' }} />
				<div className="animate-float-slow absolute top-32 -right-24 w-64 h-64 rounded-full blur-3xl opacity-30"
					style={{ background: 'radial-gradient(closest-side, rgba(0,0,0,0.1), rgba(0,0,0,0) 70%)', animationDelay: '0.6s' }} />
				<div className="animate-float-slow absolute bottom-0 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-30"
					style={{ background: 'radial-gradient(closest-side, rgba(214,0,28,0.18), rgba(214,0,28,0) 70%)', animationDelay: '1s' }} />
			</div>
			{/* Low-opacity diagnostic grid */}
			<div className="absolute inset-0 opacity-[0.04] pointer-events-none"
				style={{
					backgroundImage: 'linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)',
					backgroundSize: '40px 40px',
				}}
			/>
			{/* Floor shadow plane */}
			<div className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 w-[70vw] h-24 rounded-[50%] bg-black/10 blur-3xl" />
		</div>
	);
}


