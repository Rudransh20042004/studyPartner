export default function GradientBorderWrapper({ children, className = '' }) {
	return (
		<div className={`rounded-2xl p-[2px] bg-[length:200%_200%] ${className}`} style={{
			backgroundImage: 'linear-gradient(120deg, rgba(214,0,28,0.6), rgba(255,255,255,0.6), rgba(214,0,28,0.2))',
			animation: 'gradientMove 6s ease-in-out infinite',
		}}>
			<style>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
			<div className="rounded-2xl bg-white/90 backdrop-blur">
				{children}
			</div>
		</div>
	);
}


