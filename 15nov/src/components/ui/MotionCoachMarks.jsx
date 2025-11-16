import { useEffect, useState } from 'react';

export default function MotionCoachMarks() {
	const [open, setOpen] = useState(false);
	const [step, setStep] = useState(0);
	useEffect(() => {
		const id = setTimeout(() => setOpen(true), 800);
		return () => clearTimeout(id);
	}, []);
	if (!open) return null;
	const steps = [
		{ title: 'Create or edit your session', body: 'Set what you‘re working on and where. Others will find you faster.' },
		{ title: 'Explore active sessions', body: 'Filter by department or your course. Hover cards for quick details.' },
		{ title: 'Message and connect', body: 'Open chat to coordinate and share files. Good luck!' },
	];
	const current = steps[step];
	return (
		<div className="fixed inset-0 z-[60] pointer-events-none">
			<div className="absolute inset-0 bg-black/30" />
			<div className="absolute top-6 right-6 pointer-events-auto">
				<button className="px-3 py-1.5 text-xs bg-white/80 rounded shadow hover:bg-white" onClick={()=>setOpen(false)}>Skip</button>
			</div>
			<div className="absolute inset-x-0 top-1/4 flex justify-center pointer-events-auto">
				<div className="w-[90%] max-w-md rounded-2xl bg-white/90 backdrop-blur border border-white/60 shadow-xl p-4 animate-drop-in">
					<h3 className="font-semibold text-gray-900">{current.title}</h3>
					<p className="text-sm text-gray-600 mt-1">{current.body}</p>
					<div className="mt-3 flex justify-between items-center">
						<div className="flex gap-1">
							{steps.map((_, i) => (
								<span key={i} className={`w-2 h-2 rounded-full ${i === step ? 'bg-red-500' : 'bg-gray-300'}`} />
							))}
						</div>
						<div className="flex gap-2">
							<button onClick={()=> setStep(s => Math.max(0, s-1))} className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">Back</button>
							{step < steps.length - 1 ? (
								<button onClick={()=> setStep(s => Math.min(steps.length-1, s+1))} className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700">Next</button>
							) : (
								<button onClick={()=> setOpen(false)} className="text-xs px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700">Done</button>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}


