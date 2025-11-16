import { useEffect, useState } from "react";

export default function RippleAmbient() {
  const [ripples, setRipples] = useState([]);

  useEffect(() => {
    const makeRipple = () => {
      setRipples(prev => [...prev.slice(-3), { id: Date.now() }]);
    };
    const id = setInterval(makeRipple, 5000);
    makeRipple();
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
      {ripples.map(r => (
        <div
          key={r.id}
          className="absolute left-1/2 top-1/2 w-40 h-40 rounded-full ripple"
        />
      ))}
    </div>
  );
}
