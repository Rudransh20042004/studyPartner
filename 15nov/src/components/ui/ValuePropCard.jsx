export default function ValuePropCard({ icon = null, title, description }) {
	return (
		<div className="group w-full rounded-xl p-4 border border-white/40 bg-white/80 backdrop-blur-md shadow-sm flex items-start gap-3 relative overflow-hidden transition-shadow">
			<div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-100 to-white text-red-700 flex items-center justify-center shrink-0">
				{icon || <span className="text-base">✓</span>}
			</div>
			<div className="min-w-0">
				<div className="text-sm font-semibold text-gray-900">{title}</div>
				<div className="text-xs text-gray-600 mt-0.5">{description}</div>
			</div>
			<div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
				<div className="sparkle absolute top-2 left-8 w-1.5 h-1.5 bg-red-300 rounded-full"></div>
				<div className="sparkle absolute bottom-2 right-8 w-1.5 h-1.5 bg-red-200 rounded-full"></div>
			</div>
		</div>
	);
}


