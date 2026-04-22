import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ message, visible, onDismiss, duration = 4000 }: ToastProps) {
  const [show, setShow] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onDismiss, 300);
      }, duration);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible, duration, onDismiss]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-8 left-1/2 z-[100] -translate-x-1/2"
        >
          <div
            className="flex items-center gap-3 px-5 py-3.5"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              borderRadius: 14,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            }}
          >
            <CheckCircle size={18} style={{ color: '#34D399', flexShrink: 0 }} />
            <span className="text-[14px] text-text-primary whitespace-nowrap">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
