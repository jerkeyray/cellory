"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

export default function VantaGlobe() {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);

  useEffect(() => {
    // Cleanup function
    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
      }
    };
  }, []);

  const initVanta = () => {
    if (vantaRef.current && (window as any).VANTA) {
      vantaEffect.current = (window as any).VANTA.GLOBE({
        el: vantaRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        color: 0xff773f,
        color2: 0x847272,
        size: 1.3,
        backgroundColor: 0xf2f2f2,
      });
    }
  };

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"
        strategy="lazyOnload"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.globe.min.js"
        strategy="lazyOnload"
        onLoad={initVanta}
      />
      <div ref={vantaRef} className="w-full h-full" />
    </>
  );
}
