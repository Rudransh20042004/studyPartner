export default function TypingDots() {
	return (
		<div className="inline-flex items-center gap-1 text-gray-500">
			<span className="sr-only">Typing</span>
			<div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.2s]" />
			<div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.1s]" />
			<div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
		</div>
	);
}


