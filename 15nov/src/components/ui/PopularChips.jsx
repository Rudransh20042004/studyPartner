export default function PopularChips({ courseCounts = {}, onSelect }) {
	const entries = Object.entries(courseCounts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 8);
	if (!entries.length) return null;
	return (
		<div className="flex flex-wrap items-center gap-2 mt-3">
			{entries.map(([dept, count]) => (
				<button
					key={dept}
					onClick={() => onSelect?.(dept)}
					className="px-2.5 py-1 rounded-full bg-white/80 hover:bg-white border border-white/50 shadow-sm text-xs"
					title={`Show ${dept}`}
				>
					<span className="font-semibold">{dept}</span>
					<span className="ml-1 text-gray-500">{count}</span>
				</button>
			))}
		</div>
	);
}


