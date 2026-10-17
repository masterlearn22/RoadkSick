import React from 'react';

const TabSwitcher = ({
  tabs = [],
  activeTab,
  onTabChange,
  variant = 'underline', // 'underline' | 'pill'
  className = '',
}) => {
  if (variant === 'pill') {
    return (
      <div className={`p-1 bg-slate-100 rounded-xl flex items-center gap-1 overflow-x-auto max-w-full ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange && onTabChange(tab.key)}
              className={`flex-1 min-w-max py-2 px-3.5 inline-flex items-center justify-center gap-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-98 cursor-pointer select-none ${
                isActive
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {Icon && (
                typeof Icon === 'function' || typeof Icon === 'object' ? (
                  <Icon className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <span className="text-sm flex-shrink-0 leading-none">{Icon}</span>
                )
              )}
              <span className="truncate">{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`border-b border-slate-200/80 overflow-x-auto no-scrollbar ${className}`}>
      <nav className="flex space-x-2 sm:space-x-6 min-w-max px-1" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange && onTabChange(tab.key)}
              className={`py-2.5 sm:py-3 px-2 sm:px-3 inline-flex items-center gap-2 border-b-2 text-xs sm:text-sm whitespace-nowrap transition-all duration-150 active:scale-98 cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 font-medium'
              }`}
            >
              {Icon && (
                typeof Icon === 'function' || typeof Icon === 'object' ? (
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                ) : (
                  <span className="text-base flex-shrink-0 leading-none">{Icon}</span>
                )
              )}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default TabSwitcher;
