export default function Avatar({ name, size = 28 }) {
	const initials = (name || '')
		.split(' ')
		.map(part => part[0])
		.slice(0, 2)
		.join('')
		.toUpperCase();
	return (
		<div
			className="rounded-full bg-red-50 text-red-700 flex items-center justify-center ring-2 ring-red-200"
			style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }}
			title={name}
		>
			{initials || 'MP'}
		</div>
	);
}


