import { useState } from 'react';
import Whiteboard from './Whiteboard';

export default function WhiteboardDock({ groupCode }) {
  const [open, setOpen] = useState(false);
  const disabled = !groupCode;
  return (
    <>
      <button
        onClick={()=> !disabled && setOpen(true)}
        disabled={disabled}
        title={disabled ? 'Join a group to open the board' : 'Open whiteboard'}
        className={`text-xs px-2.5 py-1 rounded-full ${disabled ? 'opacity-50 cursor-not-allowed bg-white/60' : 'bg-white/70 hover:bg-white'} border border-white/40 shadow-sm`}
      >
        Board
      </button>
      {open && <Whiteboard groupCode={groupCode} open={open} onClose={()=>setOpen(false)} />}
    </>
  );
}


