export default function GlowCardWrapper({ children, className = '' }) {
	return (
		<div
			className={`rounded-[22px] p-[1.5px] bg-[length:200%_200%] ${className}`}
			style={{
				backgroundImage:
					'linear-gradient(135deg, rgba(239,68,68,0.5), rgba(252,165,165,0.3), rgba(239,68,68,0.5))',
				animation: 'gradientMove 8s ease-in-out infinite',
			}}
		>
			<div className="rounded-[20px] bg-white/70 backdrop-blur-sm">
				{children}
			</div>
		</div>
	);
}


