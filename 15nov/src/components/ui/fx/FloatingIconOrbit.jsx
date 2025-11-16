export default function FloatingIconOrbit() {
	return (
		<div className="absolute inset-0 pointer-events-none -z-10">
			{/* Top row */}
			<div className="absolute left-10 top-8 text-4xl animate-float-slow animate-gentle-rotate" style={{ animationDelay: '0s', opacity: 0.22 }}>
				📘
			</div>
			<div className="absolute left-1/2 -translate-x-1/2 top-4 text-3xl animate-float-slow animate-gentle-rotate" style={{ animationDelay: '0.6s', opacity: 0.2 }}>
				✏️
			</div>
			<div className="absolute right-10 top-10 text-4xl animate-float-slow animate-gentle-rotate" style={{ animationDelay: '1.2s', opacity: 0.2 }}>
				💡
			</div>

			{/* Middle sides */}
			<div className="absolute left-8 top-1/2 -translate-y-1/2 text-4xl animate-float-slow animate-gentle-rotate" style={{ animationDelay: '0.9s', opacity: 0.18 }}>
				📚
			</div>
			<div className="absolute right-8 top-1/2 -translate-y-1/2 text-4xl animate-float-slow animate-gentle-rotate" style={{ animationDelay: '1.5s', opacity: 0.18 }}>
				💬
			</div>

			{/* Bottom row */}
			<div className="absolute left-12 bottom-12 text-3xl animate-float-slow animate-gentle-rotate" style={{ animationDelay: '0.3s', opacity: 0.2 }}>
				🎓
			</div>
			<div className="absolute left-1/2 -translate-x-1/2 bottom-6 text-3xl animate-float-slow animate-gentle-rotate" style={{ animationDelay: '1.1s', opacity: 0.18 }}>
				⭐
			</div>
			<div className="absolute right-12 bottom-10 text-3xl animate-float-slow animate-gentle-rotate" style={{ animationDelay: '0.7s', opacity: 0.2 }}>
				☕
			</div>
		</div>
	);
}
