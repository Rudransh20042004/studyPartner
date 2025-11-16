import { motion } from "framer-motion";

export default function MotionFadeSlide({
  children,
  delay = 0,
  duration = 0.35,
  yOffset = 14,
  scale = 0.98,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset, scale }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -yOffset * 0.7, scale: 0.98 }}
      transition={{
        duration,
        ease: "easeOut",
        delay,
      }}
      style={{ willChange: "opacity, transform" }}
    >
      {children}
    </motion.div>
  );
}
