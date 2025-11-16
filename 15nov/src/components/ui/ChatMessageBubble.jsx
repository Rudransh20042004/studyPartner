// Presentational message bubble: incoming/outgoing variants
export default function ChatMessageBubble({ variant = 'incoming', children }) {
	const isOutgoing = variant === 'outgoing';
	return (
		<div
			className={`max-w-xs px-3 py-2 rounded-2xl shadow-sm animate-drop-in ${
				isOutgoing
					? 'bg-blue-600 text-white'
					: 'bg-white/90 backdrop-blur-sm border glow-bloom'
			}`}
		>
			{children}
		</div>
	);
}


