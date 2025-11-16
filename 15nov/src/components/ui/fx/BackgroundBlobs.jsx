export default function BackgroundBlobs() {
	return (
	  <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
		<div
		  className="absolute -top-32 -left-24 w-[30rem] h-[30rem] rounded-full blur-[120px] opacity-30 animate-pulse"
		  style={{
			background: "radial-gradient(circle, rgba(255,100,120,0.4), rgba(255,100,120,0))"
		  }}
		/>
  
		<div
		  className="absolute bottom-0 right-0 w-[26rem] h-[26rem] rounded-full blur-[150px] opacity-30 animate-pulse"
		  style={{
			background: "radial-gradient(circle, rgba(255,180,200,0.5), rgba(255,180,200,0))",
			animationDelay: "1.5s"
		  }}
		/>
	  </div>
	);
  }
  