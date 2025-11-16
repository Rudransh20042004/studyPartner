export default function SuggestedBuddies({ mySession, allSessions }) {
	if (!mySession || !allSessions?.length) return null;
	const sameCourse = allSessions.filter(s => s.courseCode === mySession.courseCode).slice(0, 3);
	if (!sameCourse.length) return null;
	return (
		<div className="mt-4 rounded-xl bg-white/70 backdrop-blur border border-white/50 p-3">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-semibold text-gray-800">Suggested study buddies</h3>
			</div>
			<ul className="mt-2 space-y-2">
				{sameCourse.map(s => (
					<li key={s.id} className="flex items-center justify-between text-sm">
						<div className="flex items-center gap-2">
							<span className="inline-block w-2 h-2 rounded-full bg-green-500" />
							<span className="font-medium text-gray-900">{s.name}</span>
							<span className="text-gray-500">({s.courseCode})</span>
						</div>
						<span className="text-xs text-gray-500">{s.location || '—'}</span>
					</li>
				))}
			</ul>
		</div>
	);
}


