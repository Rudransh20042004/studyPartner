// Presentational shell for chat modal content
export default function ChatWindowShell({ title, subtitle, children, footer }) {
	return (
		<div className="relative bg-white/95 backdrop-blur-md rounded-2xl w-[min(92vw,640px)] p-6 flex flex-col h-[75vh] shadow-xl border border-white/40 animate-drop-in">
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="absolute top-3 left-6 opacity-20 animate-float-slow">💬</div>
				<div className="absolute bottom-6 right-8 opacity-15 animate-float-slow">💡</div>
			</div>
			<div className="mb-3">
				{title && <h3 className="text-lg font-bold">{title}</h3>}
				{subtitle && <p className="text-xs text-gray-500 font-mono">{subtitle}</p>}
			</div>
			<div className="flex-1 overflow-y-auto border rounded-xl p-4 bg-white/80 backdrop-blur-sm momentum-scroll">
				{children}
			</div>
			{footer && <div className="mt-3">{footer}</div>}
		</div>
	);
}


