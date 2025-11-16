export default function SectionHeading({ children, className = '' }) {
	return (
		<div className={`w-full ${className}`}>
			<h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
				{children}
			</h2>
			<div className="mt-2 h-1.5 w-14 rounded-full" style={{ background: 'linear-gradient(90deg, #D6001C, rgba(214,0,28,0.2))' }} />
		</div>
	);
}


