import React, { useState } from 'react';

export default function Logo({ className = 'h-8 w-8' }) {
  const base = process.env.PUBLIC_URL || '';
  const [lightLoaded, setLightLoaded] = useState(false);
  const [darkLoaded, setDarkLoaded] = useState(false);
  
  return (
    <span className="inline-flex items-center justify-center">
      {/* Logo mode clair */}
      <img
        src={`${base}/brand/logo-light.png`}
        alt="Logo"
        className={`${className} object-contain dark:hidden ${
          lightLoaded ? 'block' : 'hidden'
        }`}
        draggable="false"
        onLoad={() => setLightLoaded(true)}
        onError={() => setLightLoaded(false)}
      />
      
      {/* Fallback mode clair (affiché seulement si logo-light échoue) */}
      {!lightLoaded && (
        <img
          src={`${base}/brand/logo.jpg`}
          alt="Logo"
          className={`${className} object-contain dark:hidden`}
          draggable="false"
        />
      )}
      
      {/* Logo mode sombre */}
      <img
        src={`${base}/brand/logo-dark.png`}
        alt="Logo"
        className={`${className} object-contain hidden dark:block ${
          darkLoaded ? 'block' : 'hidden'
        }`}
        draggable="false"
        onLoad={() => setDarkLoaded(true)}
        onError={() => setDarkLoaded(false)}
      />
      
      {/* Fallback mode sombre (affiché seulement si logo-dark échoue) */}
      {!darkLoaded && (
        <img
          src={`${base}/brand/logo.jpg`}
          alt="Logo"
          className={`${className} object-contain hidden dark:block`}
          draggable="false"
        />
      )}
    </span>
  );
}
