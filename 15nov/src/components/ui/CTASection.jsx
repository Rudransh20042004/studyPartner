import AnimatedButton from './AnimatedButton';

export default function CTASection({ title, subtitle, ctaText = 'Start a session', onClick }) {
	return (
		<div className="relative rounded-3xl overflow-hidden">
			<div className="absolute inset-0 opacity-90" style={{ background: 'linear-gradient(120deg, #D6001C 0%, #ff6778 60%, #ffffff 100%)' }} />
			<div className="relative z-10 px-6 py-12 md:px-10 md:py-16 text-white">
				<h3 className="text-2xl md:text-3xl font-extrabold">{title}</h3>
				{subtitle && <p className="mt-2 text-white/90">{subtitle}</p>}
				<div className="mt-6">
					<AnimatedButton
						onClick={onClick}
						className="px-6 py-3 rounded-lg bg-black text-white shadow-md hover:shadow-lg"
					>
						{ctaText}
					</AnimatedButton>
				</div>
			</div>
		</div>
	);
}


