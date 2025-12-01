import React from 'react';
import { FileText, Package, Square, Layers, Building, Type, Shield, Lightbulb, Zap } from 'lucide-react';
interface ModernTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}
const ModernTabs: React.FC<ModernTabsProps> = ({
  activeTab,
  onTabChange
}) => {
  const tabs = [{
    id: 'adesivo',
    label: 'Adesivo',
    icon: FileText,
    color: 'from-red-500 to-pink-500'
  }, {
    id: 'lona',
    label: 'Lona',
    icon: Package,
    color: 'from-blue-500 to-cyan-500'
  }, {
    id: 'placa-ps',
    label: 'Placa PS',
    icon: Square,
    color: 'from-green-500 to-emerald-500'
  }, {
    id: 'placa-acm',
    label: 'Placa ACM',
    icon: Layers,
    color: 'from-purple-500 to-violet-500'
  }, {
    id: 'fachada',
    label: 'Fachada',
    icon: Building,
    color: 'from-orange-500 to-red-500'
  }, {
    id: 'letra-caixa',
    label: 'Letra PVC',
    icon: Type,
    color: 'from-teal-500 to-cyan-500'
  }, {
    id: 'vidro',
    label: 'Vidro',
    icon: Shield,
    color: 'from-indigo-500 to-purple-500'
  }, {
    id: 'luminoso',
    label: 'Luminoso',
    icon: Lightbulb,
    color: 'from-yellow-500 to-orange-500'
  }, {
    id: 'laser',
    label: 'Laser',
    icon: Zap,
    color: 'from-pink-500 to-rose-500'
  }];
  return <div className="bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center lg:justify-start space-x-1 overflow-x-auto py-4 pb-6 scrollbar-hide mx-0 px-[22px]">
          {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return <button key={tab.id} onClick={() => onTabChange(tab.id)} className={`group relative flex items-center space-x-2 px-4 py-3 text-sm font-medium whitespace-nowrap rounded-lg transition-all duration-300 ${isActive ? 'text-white shadow-lg transform scale-105' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}>
                {isActive && <div className={`absolute inset-0 bg-gradient-to-r ${tab.color} rounded-lg transition-all duration-300`} />}
                <div className="relative z-10 flex items-center space-x-2">
                  <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </div>
                {isActive && <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-full" />}
              </button>;
        })}
        </div>
      </div>
    </div>;
};
export default ModernTabs;