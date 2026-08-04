import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MinimalistLoader from './components/common/MinimalistLoader';
import JoyPreloader from './components/common/JoyPreloader';
import { NetworkErrorProvider } from './context/NetworkErrorContext';
import { AuthProvider } from './context/AuthContext';
import NetworkErrorNotification from './components/common/NetworkErrorNotification';
import FloatingSocialBar from './components/common/FloatingSocialBar';
import { silentTokenRefresh } from './lib/auth';

import ErrorBoundary from './components/common/ErrorBoundary';

// Lazy load route pages for hyper-optimized lazy loading on slower internet connections
const LandingPage = lazy(() => import('./pages/LandingPage'));
const ActivityPage = lazy(() => import('./pages/ActivityPage'));
const TicketPage = lazy(() => import('./pages/TicketPage'));
const DeclarationForm = lazy(() => import('./pages/DeclarationForm'));
const ThingsToDoVarkala = lazy(() => import('./pages/ThingsToDoVarkala'));
const VarkalaGuide = lazy(() => import('./pages/VarkalaGuide'));

// Lazy load Chatbot since it contains markdown renderers, chat bubbles and can be heavy
const Chatbot = lazy(() => import('./components/user/Chatbot').then(m => ({ default: m.Chatbot })));

export default function App() {
  const [showPreloader, setShowPreloader] = useState(true);

  useEffect(() => {
    // Perform silent token refresh on app startup
    silentTokenRefresh().catch(() => {});
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NetworkErrorProvider>
          {showPreloader && (
            <JoyPreloader
              brandName="JOYWATERSPORTS"
              subText="LOADING OCEAN EXPERIENCE..."
              durationMs={2800}
              onComplete={() => setShowPreloader(false)}
            />
          )}
          <BrowserRouter>
            <NetworkErrorNotification />
            <FloatingSocialBar />
            <Suspense fallback={<MinimalistLoader message="Loading" />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Navigate to="/" replace />} />
                <Route path="/admin" element={<Navigate to="/" replace />} />
                <Route path="/activity/:id" element={<ActivityPage />} />
                <Route path="/declaration" element={<DeclarationForm />} />
                <Route path="/ticket/:id" element={<TicketPage />} />
                <Route path="/ticket/manual/:id" element={<TicketPage />} />

                {/* SEO Cluster & Keyword Landing Pages */}
                <Route path="/things-to-do-in-varkala" element={<ThingsToDoVarkala />} />
                <Route path="/best-time-to-visit-varkala" element={<VarkalaGuide />} />

                {/* Keyword URL Aliases Redirecting to Activity Pages */}
                <Route path="/parasailing-varkala" element={<Navigate to="/activity/parasailing" replace />} />
                <Route path="/jet-ski-varkala" element={<Navigate to="/activity/jetski" replace />} />
                <Route path="/flying-fish-varkala" element={<Navigate to="/activity/flyingfish" replace />} />
                <Route path="/speed-boat-varkala" element={<Navigate to="/activity/speedboat" replace />} />
                <Route path="/banana-ride-varkala" element={<Navigate to="/activity/bananaboat" replace />} />
              </Routes>
            </Suspense>
            
            {/* Floating Chatbot Assistant wrapped separately without blocking page routes */}
            <Suspense fallback={null}>
              <Chatbot />
            </Suspense>
          </BrowserRouter>
        </NetworkErrorProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

