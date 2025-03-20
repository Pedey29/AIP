import React, { ReactNode } from 'react';
import Card from './Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon?: ReactNode;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon,
  className = ''
}) => {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="flex items-center">
        {icon && (
          <div className="flex-shrink-0 p-3 bg-primary-100 rounded-lg mr-4">
            {icon}
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          
          {change && (
            <p className={`mt-1 text-sm flex items-center ${
              change.isPositive ? 'text-success-600' : 'text-danger-600'
            }`}>
              <span>
                {change.isPositive ? '↑' : '↓'} {Math.abs(change.value).toFixed(2)}%
              </span>
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default StatsCard;
