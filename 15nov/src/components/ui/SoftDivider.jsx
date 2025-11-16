export default function SoftDivider({ className = '' }) {
	return (
		<div className={`relative my-10 ${className}`}>
			<div className="h-px w-full bg-gradient-to-r from-transparent via-red-200 to-transparent" />
			<div className="absolute inset-0 flex items-center justify-center">
				<div className="w-24 h-6 bg-red-100/40 blur-xl rounded-full" />
			</div>
		</div>
	);
}


