import React from 'react';

interface StoreSelectorProps {
    stores: string[];
    selected: string;
    onChange: (selection: string) => void;
    disabledStores?: string[];
}

export const StoreSelector: React.FC<StoreSelectorProps> = ({ stores, selected, onChange, disabledStores = [] }) => {
  const handleSelect = (store: string) => {
    if (disabledStores.includes(store)) return;
    const newSelection = selected === store ? '' : store;
    onChange(newSelection);
  };

  return (
    <div className="grid grid-cols-4 gap-1 max-w-[240px]">
      {stores.map(store => {
        const isSelected = selected === store;
        const isDisabled = disabledStores.includes(store);
        return (
          <button
            key={store}
            onClick={() => handleSelect(store)}
            disabled={isDisabled}
            className={`
              p-1 border rounded text-sm font-semibold transition-colors duration-150
              ${isSelected ? 'bg-blue-600 text-white border-blue-700' : 'bg-gray-200 text-gray-700 border-gray-300'}
              ${isDisabled ? 'cursor-not-allowed bg-gray-400 opacity-50' : 'hover:bg-blue-200'}
            `}
          >
            {store}
          </button>
        );
      })}
    </div>
  );
};

export default StoreSelector;
