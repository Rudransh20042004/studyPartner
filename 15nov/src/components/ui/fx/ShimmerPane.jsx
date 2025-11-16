export default function ShimmerPane() {
	return (
		<div
			className="pointer-events-none absolute inset-0"
			style={{
				maskImage:
					'linear-gradient(180deg, transparent 0%, black 20%, black 80%, transparent 100%)',
				WebkitMaskImage:
					'linear-gradient(180deg, transparent 0%, black 20%, black 80%, transparent 100%)',
				background:
					'linear-gradient(100deg, rgba(255,255,255,0.0) 40%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.0) 60%)',
				backgroundSize: '200% 100%',
				animation: 'shimmer-move 5s linear infinite',
			}}
		>
			<style>{`
        @keyframes shimmer-move {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
		</div>
	);
}


