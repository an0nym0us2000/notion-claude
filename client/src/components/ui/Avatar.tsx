import React from 'react';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center bg-notion-blue text-white font-medium ${className}`}
    >
      {src ? (
        <img src={src} alt={name || 'Avatar'} className="w-full h-full rounded-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};
