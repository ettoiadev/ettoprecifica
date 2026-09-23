import React from 'react';
import { FileText, Package, Layers, Building, Boxes, Type, Shield, Lightbulb, Zap, Shirt, PanelTop } from 'lucide-react';
interface ModernTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}
const ModernTabs: React.FC<ModernTabsProps> = ({
  activeTab,
  onTabChange
}) => {
  const tabs = [
    { id: 'adesivos', label: 'Adesivos', icon: FileText },
    { id: 'lona', label: 'Lona', icon: Package },
    { id: 'placas', label: 'Placas', icon: Layers },
    { id: 'fachada', label: 'Fachada', icon: Building },
    { id: 'acm3d', label: 'ACM3D', icon: Boxes },
    { id: 'letra-caixa', label: 'Letra Caixa', icon: Type },
    { id: 'vidro', label: 'Vidro', icon: Shield },
    { id: 'luminoso', label: 'Luminoso', icon: Lightbulb },
    { id: 'laser', label: 'Laser', icon: Zap },
    { id: 'dtf', label: 'DTF', icon: Shirt },
    { id: 'cavaletes', label: 'Cavaletes', icon: PanelTop },
  ];
  return <div className="bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center lg:justify-start space-x-1 overflow-x-auto py-4 pb-6 scrollbar-hide mx-0 px-[22px]">
          {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return <button key={tab.id} onClick={() => onTabChange(tab.id)} className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}>
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>;
        })}
        </div>
      </div>
    </div>;
};
export default ModernTabs;
