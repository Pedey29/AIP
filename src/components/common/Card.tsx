import React, { ReactNode } from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
  noPadding?: boolean;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  className = '',
  headerAction,
  noPadding = false
}) => {
  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {(title || headerAction) && (
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div>
            {title && <h2 className="text-lg font-semibold text-gray-800">{title}</h2>}
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-4'}>{children}</div>
    </div>
  );
};

export default Card;
