import React from 'react';

interface IconProps {
  className?: string;
}

// Google Play Store Logo using exact requested image URL
export const GooglePlayLogo: React.FC<IconProps> = ({ className = 'w-7 h-7' }) => (
  <img
    src="https://i.ibb.co/ns82P174/google-play-store-logo-png-transparent-png-logos-10.png"
    alt="Google Play"
    className={`${className} object-contain shrink-0`}
    loading="eager"
  />
);

// Unified Category Logo Resolver Component (Google Play Only)
export const CategoryBrandLogo: React.FC<{ category?: string; className?: string }> = ({
  className = 'w-7 h-7'
}) => {
  return (
    <div className="w-8 h-8 p-1 bg-white rounded-lg shadow-2xs flex items-center justify-center shrink-0 border border-slate-200/80">
      <GooglePlayLogo className={className} />
    </div>
  );
};
