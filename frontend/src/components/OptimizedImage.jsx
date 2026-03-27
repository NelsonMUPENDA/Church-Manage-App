import React, { useState, useEffect, useRef } from 'react';

/**
 * Optimized Image component with lazy loading, blur-up effect, and error handling
 */
export function OptimizedImage({ 
  src, 
  alt, 
  className = '', 
  width, 
  height,
  placeholder = 'blur',
  loading = 'lazy',
  sizes = '100vw',
  srcSet,
  onLoad,
  onError,
  ...props 
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInViewport, setIsInViewport] = useState(loading !== 'lazy');
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading !== 'lazy' || isInViewport) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInViewport(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px 0px', // Start loading 50px before entering viewport
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [loading]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Generate blur placeholder
  const blurPlaceholder = `data:image/svg+xml;base64,${btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width || 100} ${height || 100}">
      <rect width="100%" height="100%" fill="#e2e8f0"/>
    </svg>`
  )}`;

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Blur placeholder */}
      {placeholder === 'blur' && !isLoaded && (
        <img
          src={blurPlaceholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-md scale-110 transition-opacity duration-500"
          aria-hidden="true"
        />
      )}
      
      {/* Main image */}
      {isInViewport && !hasError && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          srcSet={srcSet}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
          className={`
            absolute inset-0 w-full h-full object-cover
            transition-opacity duration-500
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
          `}
          {...props}
        />
      )}
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
          <span className="text-slate-400 text-sm">Image non disponible</span>
        </div>
      )}
    </div>
  );
}

/**
 * Avatar component with optimized loading
 */
export function Avatar({ 
  src, 
  alt = '', 
  size = 'md', 
  fallback,
  className = '' 
}) {
  const [hasError, setHasError] = useState(false);
  
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
  };

  const initials = fallback || alt?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className={`
      relative rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-900/30
      flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-medium
      ${sizeClasses[size] || sizeClasses.md}
      ${className}
    `}>
      {src && !hasError ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
          loading="lazy"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

/**
 * Skeleton loader component for loading states
 */
export function Skeleton({ 
  className = '', 
  width, 
  height, 
  circle = false,
  count = 1 
}) {
  const baseClasses = `
    animate-pulse bg-slate-200 dark:bg-slate-700
    ${circle ? 'rounded-full' : 'rounded-lg'}
  `;

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${baseClasses} ${className}`}
          style={{ width, height }}
        />
      ))}
    </>
  );
}

/**
 * Data loading placeholder component
 */
export function DataLoadingPlaceholder({ rows = 5 }) {
  return (
    <div className="space-y-4 p-4">
      <Skeleton width="60%" height={24} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <Skeleton circle width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton width="40%" height={16} />
            <Skeleton width="70%" height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}
