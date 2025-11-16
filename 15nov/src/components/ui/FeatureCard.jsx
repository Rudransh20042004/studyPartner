export default function FeatureCard({ icon = null, title, description }) {
	return (
		<div className="group rounded-2xl border border-white/40 bg-white/70 backdrop-blur-md p-5 shadow-md animate-float-slow relative overflow-hidden transition-shadow">
			<div className="flex items-start gap-3">
				<div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
					{icon || <span className="text-lg">★</span>}
				</div>
				<div>
					<h3 className="text-base font-semibold text-gray-900">{title}</h3>
					<p className="text-sm text-gray-600 mt-1">{description}</p>
				</div>
			</div>
			<div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
				<div className="sparkle absolute top-3 right-6 w-1.5 h-1.5 bg-red-300 rounded-full"></div>
				<div className="sparkle absolute bottom-3 left-6 w-1.5 h-1.5 bg-red-200 rounded-full"></div>
			</div>
		</div>
	);
}


