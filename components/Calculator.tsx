import React, { useEffect, useRef } from 'react';

interface GeoGebraProps {
  width?: number;
  height?: number;
  showToolBar?: boolean;
  showAlgebraInput?: boolean;
  showMenuBar?: boolean;
  appName?: 'graphing' | 'geometry' | '3d' | 'classic' | 'scientific';
  scale?: number;
}

// Declare the GGBApplet global for TypeScript
declare global {
  interface Window {
    GGBApplet: any;
    ggbApplet: any;
    ggbOnInit: () => void;
  }
}

const GeoGebraGrapher: React.FC<GeoGebraProps> = ({
  width = 800,
  height = 600,
  showToolBar = true,
  showAlgebraInput = true,
  showMenuBar = true,
  appName = 'graphing',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptId = 'geogebra-deploy-script';

  useEffect(() => {
    // Define the global callback for GeoGebra initialization
    // We use a unique name or strict 'ggbOnInit' as required by GGB
    // For simplicity, we'll use 'ggbOnInit' and manage it carefully
    window.ggbOnInit = () => {
      const applet = window.ggbApplet;
      if (!applet) return;

      // Restore state if exists
      const savedState = localStorage.getItem('ggb_state_base64');
      if (savedState) {
        applet.setBase64(savedState);
      }

      // Save functionality with debounce
      let timeoutId: NodeJS.Timeout;
      const saveState = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          applet.getBase64((base64: string) => {
            localStorage.setItem('ggb_state_base64', base64);
          });
        }, 1000);
      };

      // Register listeners to trigger save
      applet.registerAddListener(saveState);
      applet.registerRemoveListener(saveState);
      applet.registerUpdateListener(saveState);
      applet.registerStoreUndoListener(saveState);
    };

    const loadApplet = () => {
      if (window.GGBApplet && containerRef.current) {
        const params = {
          appName,
          width,
          height,
          showToolBar,
          showAlgebraInput,
          showMenuBar,
          playButton: false,
          scale: 0.75,
          appletOnLoad: window.ggbOnInit,
        };

        const ggbApplet = new window.GGBApplet(params, true);
        // We use the ID of the container for injection
        ggbApplet.inject(containerRef.current.id);
      }
    };

    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://www.geogebra.org/apps/deployggb.js';
      script.async = true;
      script.onload = loadApplet;
      document.head.appendChild(script);
    } else {
      // If script is already there, wait a bit or check if ready
      loadApplet();
    }

    return () => {
      // Cleanup global callback if needed, though GGB might keep running
      // Ideally we'd remove listeners but GGB API makes that hard from here without keeping the applet ref
      delete window.ggbOnInit;
    };
  }, [appName, width, height, showToolBar, showAlgebraInput, showMenuBar]);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <div
        id="ggb-element"
        ref={containerRef}
        style={{ width: '100%', maxWidth: width, height: height }}
      />
    </div>
  );
};

export default GeoGebraGrapher;