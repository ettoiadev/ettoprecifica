
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
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold gradient-text">
            {title}
          </h2>
          <div className="w-20 h-1 gradient-decorator rounded-full mx-auto" />
        </div>
      )}
      
      <Card className="p-6 card-backdrop transition-all duration-500">
        <div className="space-y-6">
          {children}
        </div>
      </Card>
    </div>
  );
};

export default ModernCalculatorWrapper;
