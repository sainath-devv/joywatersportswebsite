import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, RefreshCw, X, ServerOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNetworkError } from '../../context/NetworkErrorContext';

export const NetworkErrorNotification: React.FC = () => {
  const { error, isCheckingHealth, clearNetworkError, checkServerHealth } = useNetworkError();
  const [retrySuccess, setRetrySuccess] = useState(false);

  if (!error) return null;

  const handleRetry = async () => {
    setRetrySuccess(false);
    if (error.retryFn) {
      try {
        error.retryFn();
      } catch (err) {
        console.error('Retry function failed:', err);
      }
    }
    const isAlive = await checkServerHealth();
    if (isAlive) {
      setRetrySuccess(true);
      setTimeout(() => {
        setRetrySuccess(false);
      }, 3000);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] w-[92%] max-w-xl pointer-events-auto"
        id="network-error-toast"
      >
        <div className="bg-slate-900/95 backdrop-blur-md text-white border border-rose-500/40 rounded-2xl p-4 shadow-2xl shadow-rose-950/40 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded-xl shrink-0 mt-0.5">
                <WifiOff className="w-5 h-5 animate-pulse" />
              </div>

              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-rose-300 flex items-center gap-1.5">
                    <ServerOff className="w-4 h-4 text-rose-400" />
                    Network Connection Error
                  </h4>
                  {error.endpoint && (
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-md text-[10px] font-mono">
                      {error.endpoint}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-200 font-medium leading-relaxed">
                  {error.message}
                </p>

                <p className="text-[11px] text-slate-400">
                  Please verify your connection and try again.
                </p>
              </div>
            </div>

            <button
              onClick={clearNetworkError}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer shrink-0"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRetry}
                disabled={isCheckingHealth}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingHealth ? 'animate-spin' : ''}`} />
                {isCheckingHealth ? 'Checking Server...' : 'Retry Connection'}
              </button>

              <button
                type="button"
                onClick={() => checkServerHealth()}
                disabled={isCheckingHealth}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-700 cursor-pointer"
              >
                Ping Server
              </button>
            </div>

            {retrySuccess && (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" /> Server back online!
              </span>
            )}

            {!retrySuccess && (
              <span className="text-[10px] text-slate-400 italic">
                Auto-retries on reconnection
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NetworkErrorNotification;

