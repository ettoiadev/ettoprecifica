
import React from 'react';
import { Card } from './ui/card';

interface ModernCalculatorWrapperProps {
  children: React.ReactNode;
  title?: string;
}

const ModernCalculatorWrapper: React.FC<ModernCalculatorWrapperProps> = ({
  children,
  title
}) => {
  return (
    <div className="space-y-6">
      {title && (
        <h2 className="text-2xl font-bold text-gray-900">
          {title}
        </h2>
      )}

      <Card className="p-6">
        <div className="space-y-6">
          {children}
        </div>
      </Card>
    </div>
  );
};

export default ModernCalculatorWrapper;
