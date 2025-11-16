import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import MotionModal from './MotionModal';

export default function Whiteboard({ groupCode, open, onClose }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const channelRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const lastSentRef = useRef(0);

  const [tool, setTool] = useState('pen'); // 'pen' | 'erase'
  const [color, setColor] = useState('#111827');
  const [size, setSize] = useState(3);
  const downloadingRef = useRef(false);

  // Setup canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctxRef.current = ctx;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    // Run a second resize shortly after open so the canvas matches the final modal size
    const timer = setTimeout(resize, 80);
    window.addEventListener('resize', resize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', resize);
    };
  }, [open]);

  // Realtime channel
  useEffect(() => {
    if (!open || !groupCode) return;
    if (channelRef.current) {
      try { supabase.removeChannel(channelRef.current); } catch {}
      channelRef.current = null;
    }
    const ch = supabase.channel(`group:${groupCode}-whiteboard`);
    ch.on('broadcast', { event: 'stroke' }, ({ payload }) => {
      drawStroke(payload, false);
    });
    ch.on('broadcast', { event: 'clear' }, () => {
      clearBoard(false);
    });
    ch.subscribe();
    channelRef.current = ch;
    return () => {
      if (channelRef.current) {
        try { supabase.removeChannel(channelRef.current); } catch {}
        channelRef.current = null;
      }
    };
  }, [groupCode, open]);

  const emit = (event, payload) => {
    if (!channelRef.current) return;
    try { channelRef.current.send({ type: 'broadcast', event, payload }); } catch {}
  };

  const drawStroke = (s, isLocal = true) => {
    const ctx = ctxRef.current;
    if (!ctx || !s?.points?.length) return;
    ctx.save();
    ctx.globalCompositeOperation = s.tool === 'erase' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = s.color || '#111827';
    ctx.lineWidth = s.size || 3;
    const pts = s.points;
    if (pts.length === 1) {
      const p = pts[0];
      ctx.beginPath();
      ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const midX = (pts[i].x + pts[i + 1].x) / 2;
        const midY = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
      }
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.stroke();
    }
    ctx.restore();
    if (isLocal) {
      const now = performance.now();
      if (now - lastSentRef.current > 60) { // throttle ~16fps
        emit('stroke', s);
        lastSentRef.current = now;
      }
    }
  };

  const clearBoard = (broadcast = true) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (broadcast) emit('clear', {});
  };

  const exportPng = () => {
    if (downloadingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      downloadingRef.current = true;
      const dpr = window.devicePixelRatio || 1;
      // Create a clean export without CSS scaling artifacts
      const rect = canvas.getBoundingClientRect();
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = rect.width * dpr;
      exportCanvas.height = rect.height * dpr;
      const ex = exportCanvas.getContext('2d');
      ex.scale(dpr, dpr);
      ex.fillStyle = 'white';
      ex.fillRect(0, 0, rect.width, rect.height);
      ex.drawImage(canvas, 0, 0, rect.width, rect.height);
      const url = exportCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `whiteboard-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setTimeout(()=>{ downloadingRef.current = false; }, 500);
    }
  };

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
    return { x, y };
  };

  const strokePointsRef = useRef([]);
  const onPointerDown = (e) => {
    const canvas = canvasRef.current;
    canvas.setPointerCapture?.(e.pointerId);
    drawingRef.current = true;
    const p = getPos(e);
    strokePointsRef.current = [p];
    lastPointRef.current = p;
    drawStroke({ tool, color, size, points: [p] });
    e.preventDefault();
  };
  const onPointerMove = (e) => {
    if (!drawingRef.current) return;
    const p = getPos(e);
    const lp = lastPointRef.current || p;
    drawStroke({ tool, color, size, points: [lp, p] });
    strokePointsRef.current.push(p);
    lastPointRef.current = p;
    e.preventDefault();
  };
  const onPointerUp = (e) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    const pts = strokePointsRef.current.slice();
    if (pts.length) emit('stroke', { tool, color, size, points: pts });
    strokePointsRef.current = [];
  };

  return (
    <MotionModal isOpen={open} onClose={onClose}>
      <div className="w-[min(92vw,1000px)] h-[70vh] bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-white/60 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-3 border-b bg-white/60">
          <div className="flex items-center gap-2">
            <button onClick={()=>setTool('pen')} className={`text-xs px-2 py-1 rounded ${tool==='pen'?'bg-red-600 text-white':'bg-gray-100 hover:bg-gray-200'}`}>Pen</button>
            <button onClick={()=>setTool('erase')} className={`text-xs px-2 py-1 rounded ${tool==='erase'?'bg-red-600 text-white':'bg-gray-100 hover:bg-gray-200'}`}>Eraser</button>
            <input type="color" value={color} onChange={(e)=>setColor(e.target.value)} className="w-8 h-6 p-0 border rounded" />
            <input type="range" min="2" max="12" step="1" value={size} onChange={(e)=>setSize(parseInt(e.target.value))} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportPng} className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">Export PNG</button>
            <button onClick={()=>clearBoard(true)} className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">Clear</button>
            <button onClick={onClose} className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">Close</button>
          </div>
        </div>
        <div className="flex-1 relative bg-[linear-gradient(0deg,rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:20px_20px]">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
        </div>
      </div>
    </MotionModal>
  );
}


