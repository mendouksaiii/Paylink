'use client';

import { motion } from 'framer-motion';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ 
        type: 'spring',
        stiffness: 260,
        damping: 20,
      }}
      className="page-transition-wrapper"
    >
      {children}
    </motion.main>
  );
}
