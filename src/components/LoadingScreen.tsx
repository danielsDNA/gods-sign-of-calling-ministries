import { AnimatePresence, motion } from 'motion/react';
import { churchConfig } from '@/config/church';

interface LoadingScreenProps {
  isLoading: boolean;
  logoUrl?: string;
  churchName?: string;
  tagline?: string;
}

export default function LoadingScreen({
  isLoading,
  logoUrl,
  churchName,
  tagline,
}: LoadingScreenProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="loading"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-4"
          style={{ background: 'hsl(var(--background))' }}
          role="status"
          aria-label="Loading website"
        >
          <div className="absolute left-0 right-0 top-0 h-0.5" style={{ background: 'hsl(var(--muted))' }}>
            <motion.div
              className="h-full"
              style={{ background: 'hsl(var(--primary))' }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.6, ease: 'easeInOut' }}
            />
          </div>

          <div className="relative mb-6 flex h-36 w-36 items-center justify-center">
            <motion.div
              className="absolute rounded-full"
              style={{ background: 'hsl(var(--primary) / 0.15)', width: 100, height: 100 }}
              animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.2, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{ background: 'hsl(var(--primary) / 0.08)', width: 140, height: 140 }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            />
            <motion.img
              src={logoUrl || '/favicon.svg'}
              alt=""
              className="relative max-h-24 max-w-[min(70vw,18rem)] object-contain"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          <motion.p
            className="max-w-[min(90vw,24rem)] text-center text-base font-semibold tracking-wide sm:text-lg"
            style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {churchName || churchConfig.name}
          </motion.p>
          <motion.p
            className="mt-1 max-w-[min(90vw,24rem)] text-center text-sm"
            style={{ color: 'hsl(var(--muted-foreground))' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {tagline || churchConfig.tagline}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
