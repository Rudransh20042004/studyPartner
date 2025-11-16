export default function SparkleField({ count = 50 }) {
	const nodes = Array.from({ length: count });
	return (
		<div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
			{nodes.map((_, i) => {
				const size = Math.random() * 2 + 1;
				const top = Math.random() * 100;
				const left = Math.random() * 100;
				const delay = Math.random() * 4;
				const opacity = 0.05 + Math.random() * 0.07;
				return (
					<div
						key={i}
						className="particle absolute rounded-full bg-white"
						style={{
							width: size,
							height: size,
							top: `${top}%`,
							left: `${left}%`,
							opacity,
							animationDelay: `${delay}s`,
						}}
					/>
				);
			})}
		</div>
	);
}


