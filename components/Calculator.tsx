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
          scale: 1
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