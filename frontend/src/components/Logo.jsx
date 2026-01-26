import React, { useState } from 'react';

export default function Logo({ className = 'h-8 w-8' }) {
  const base = process.env.PUBLIC_URL || '';
  const [lightLoaded, setLightLoaded] = useState(false);
  const [darkLoaded, setDarkLoaded] = useState(false);
  return (
    <span className="inline-flex items-center justify-center">
      <img
        src={`${base}/brand/logo-light.png`}
        alt="Logo"
        className={`${className} object-contain dark:hidden ${lightLoaded ? '' : 'hidden'}`}
        draggable="false"
        onLoad={() => setLightLoaded(true)}
        onError={() => setLightLoaded(false)}
      />
      <img
        src={`${base}/brand/logo-dark.png`}
        alt="Logo"
        className={`${className} object-contain hidden dark:block ${darkLoaded ? '' : 'hidden'}`}
        draggable="false"
        onLoad={() => setDarkLoaded(true)}
        onError={() => setDarkLoaded(false)}
      />

      <img
        src={`${base}/brand/logo.jpg`}
        alt="Logo"
        className={`${className} object-contain dark:hidden ${lightLoaded ? 'hidden' : ''}`}
        draggable="false"
      />
      <img
        src={`${base}/brand/logo.jpg`}
        alt="Logo"
        className={`${className} object-contain hidden dark:block ${darkLoaded ? 'hidden' : ''}`}
        draggable="false"
      />
    </span>
  );
}
