/* === SECTION: Loading Screen === */
/*
 * Full-page loading overlay shown on first visit.
 * - Centered cross animation with amber glow pulse
 * - Thin amber progress bar at top
 * - Smooth fade-out after duration completes
 */

import { motion, AnimatePresence } from 'motion/react';

interface LoadingScreenProps {
  isLoading: boolean;
}

export default function LoadingScreen({ isLoading }: LoadingScreenProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="loading"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' as const }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: 'hsl(var(--background))' }}
        >
          <motion.div
            className="loading-wordmark"
            role="status"
            aria-label="Loading God's Sign of Calling Revival Ministries"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {"GOD'S CALLING".split('').map((letter, index) => (
              <span key={`${letter}-${index}`} style={{ animationDelay: `${index * 0.075}s` }}>
                {letter === ' ' ? '\u00a0' : letter}
              </span>
            ))}
          </motion.div>
          <div className="loading-sweep" aria-hidden="true" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
