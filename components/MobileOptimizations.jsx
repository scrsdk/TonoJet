import React, { useEffect, useState, useCallback } from 'react';

// Mobile-specific optimizations and features
const MobileOptimizations = ({ children, onInstallPrompt }) => {
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [orientation, setOrientation] = useState('portrait');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Check if app is running in standalone mode (PWA)
  useEffect(() => {
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone ||
                        document.referrer.includes('android-app://');
      setIsStandalone(standalone);
    };

    checkStandalone();
    window.addEventListener('resize', checkStandalone);
    return () => window.removeEventListener('resize', checkStandalone);
  }, []);

  // Handle orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      const newOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      setOrientation(newOrientation);
      
      // Vibrate on orientation change for better UX
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle install prompt
  useEffect(() => {
    const handleInstallPrompt = (e) => {
      if (!isStandalone) {
        setShowInstallBanner(true);
        if (onInstallPrompt) {
          onInstallPrompt(e.detail);
        }
      }
    };

    window.addEventListener('showInstallPrompt', handleInstallPrompt);
    return () => window.removeEventListener('showInstallPrompt', handleInstallPrompt);
  }, [isStandalone, onInstallPrompt]);

  // Prevent zoom on double tap
  useEffect(() => {
    let lastTouchEnd = 0;
    const preventZoom = (e) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('touchend', preventZoom, { passive: false });
    return () => document.removeEventListener('touchend', preventZoom);
  }, []);

  // Handle safe area insets for devices with notches
  useEffect(() => {
    const updateSafeArea = () => {
      const safeAreaTop = getComputedStyle(document.documentElement)
        .getPropertyValue('--sat') || '0px';
      const safeAreaBottom = getComputedStyle(document.documentElement)
        .getPropertyValue('--sab') || '0px';
      
      document.documentElement.style.setProperty('--safe-area-top', safeAreaTop);
      document.documentElement.style.setProperty('--safe-area-bottom', safeAreaBottom);
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    return () => window.removeEventListener('resize', updateSafeArea);
  }, []);

  return (
    <div className="mobile-optimized-container">
      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 text-sm z-50">
          📶 You're offline. Some features may not work.
        </div>
      )}

      {/* Install banner for PWA */}
      {showInstallBanner && !isStandalone && (
        <InstallBanner onDismiss={() => setShowInstallBanner(false)} />
      )}

      {/* Orientation warning for landscape */}
      {orientation === 'landscape' && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-40 lg:hidden">
          <div className="text-center text-white p-6">
            <div className="text-6xl mb-4">📱</div>
            <h3 className="text-xl font-bold mb-2">Please rotate your device</h3>
            <p className="text-gray-300">This game is optimized for portrait mode</p>
          </div>
        </div>
      )}

      {/* Main content with mobile optimizations */}
      <div 
        className={`
          ${isStandalone ? 'standalone-app' : ''}
          ${orientation === 'portrait' ? 'portrait-mode' : 'landscape-mode'}
        `}
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Install banner component
const InstallBanner = ({ onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleInstall = async () => {
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      const { outcome } = await window.deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      window.deferredPrompt = null;
    }
    setIsVisible(false);
    onDismiss();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white rounded-lg p-4 shadow-lg z-50 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-sm">Install Aviator</h4>
          <p className="text-xs text-blue-100 mt-1">
            Add to home screen for the best experience
          </p>
        </div>
        <div className="flex space-x-2 ml-4">
          <button
            onClick={handleInstall}
            className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="text-blue-100 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

// Touch feedback component for better mobile interaction
export const TouchFeedback = ({ children, onTouch, className = '', ...props }) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = useCallback((e) => {
    setIsPressed(true);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    if (onTouch) {
      onTouch(e);
    }
  }, [onTouch]);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
  }, []);

  return (
    <div
      className={`
        ${className}
        ${isPressed ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}
        transition-all duration-100 ease-out
        touch-manipulation
      `}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      {...props}
    >
      {children}
    </div>
  );
};

// Swipe gesture handler
export const SwipeHandler = ({ children, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold = 50 }) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const handleTouchMove = (e) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > threshold;
    const isRightSwipe = distanceX < -threshold;
    const isUpSwipe = distanceY > threshold;
    const isDownSwipe = distanceY < -threshold;

    if (isLeftSwipe && onSwipeLeft) onSwipeLeft();
    if (isRightSwipe && onSwipeRight) onSwipeRight();
    if (isUpSwipe && onSwipeUp) onSwipeUp();
    if (isDownSwipe && onSwipeDown) onSwipeDown();
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="touch-manipulation"
    >
      {children}
    </div>
  );
};

export default MobileOptimizations;
