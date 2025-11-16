export default function GlowBorderWrapper({ children, className = '' }) {
	return (
		<div
			className={`rounded-[22px] p-[1.5px] bg-[length:200%_200%] ${className}`}
			style={{
				backgroundImage:
					'linear-gradient(135deg, rgba(239,68,68,0.5), rgba(252,165,165,0.3), rgba(239,68,68,0.5))',
				animation: 'gradientMove 8s ease-in-out infinite',
			}}
		>
			<style>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; box-shadow: 0 8px 30px rgba(239,68,68,0.08); }
          50% { background-position: 100% 50%; box-shadow: 0 10px 36px rgba(239,68,68,0.12); }
          100% { background-position: 0% 50%; box-shadow: 0 8px 30px rgba(239,68,68,0.08); }
        }
      `}</style>
			<div className="rounded-[20px] bg-white/70 backdrop-blur-sm">
				{children}
			</div>
		</div>
	);
}


