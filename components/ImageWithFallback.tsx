
import React, { useState } from 'react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackIcon?: string;
  containerClassName?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ 
  src, 
  alt, 
  className = '', 
  fallbackIcon = 'image',
  containerClassName = '',
  ...props 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-gray-50 ${containerClassName} w-full h-full`}>
      {/* Loading Skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse z-10 flex items-center justify-center">
           <span className="material-symbols-outlined text-gray-300 text-3xl opacity-50">{fallbackIcon}</span>
        </div>
      )}

      {/* Error State */}
      {hasError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gold-200 z-0">
          <span className="material-symbols-outlined text-5xl opacity-50">{fallbackIcon}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-700 ease-in-out`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          loading="lazy"
          {...props}
        />
      )}
    </div>
  );
};
