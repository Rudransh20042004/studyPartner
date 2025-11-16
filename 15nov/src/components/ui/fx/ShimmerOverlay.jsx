export default function ShimmerOverlay({ children, once = true }) {
	return (
		<div className={`relative ${once ? 'shimmer-overlay' : ''}`}>
			{children}
		</div>
	);
}


