import React, { useState } from 'react';
import type { TableRow } from '../types';

interface StoreManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    stores: string[];
    onUpdateStores: (stores: string[]) => void;
    tableData: TableRow[];
}

export const StoreManagerModal: React.FC<StoreManagerModalProps> = ({ isOpen, onClose, stores, onUpdateStores, tableData }) => {
  const [newStoreName, setNewStoreName] = useState('');
  const [editingStore, setEditingStore] = useState<{ oldName: string, newName: string } | null>(null);

  if (!isOpen) return null;

  const handleAddStore = () => {
    const trimmedName = newStoreName.trim().toUpperCase();
    if (!trimmedName) {
      alert('Store name cannot be empty.');
      return;
    }
    if (stores.includes(trimmedName)) {
      alert(`Store "${trimmedName}" already exists.`);
      return;
    }
    onUpdateStores([...stores, trimmedName]);
    setNewStoreName('');
  };

  const handleDeleteStore = (storeToDelete: string) => {
    const isStoreInUse = tableData.some(row => row.from === storeToDelete || row.to === storeToDelete);
    if (isStoreInUse) {
      alert(`Cannot delete store "${storeToDelete}" because it is currently being used in a transfer request.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete the store "${storeToDelete}"?`)) {
      onUpdateStores(stores.filter(s => s !== storeToDelete));
    }
  };

  const handleStartEdit = (storeName: string) => {
    setEditingStore({ oldName: storeName, newName: storeName });
  };

  const handleCancelEdit = () => {
    setEditingStore(null);
  };

  const handleSaveEdit = () => {
    if (!editingStore) return;

    const trimmedName = editingStore.newName.trim().toUpperCase();
    if (!trimmedName) {
      alert('Store name cannot be empty.');
      return;
    }
    if (trimmedName !== editingStore.oldName && stores.includes(trimmedName)) {
      alert(`Store "${trimmedName}" already exists.`);
      return;
    }

    const isStoreInUse = tableData.some(row => row.from === editingStore.oldName || row.to === editingStore.oldName);
    if(isStoreInUse) {
        alert(`Cannot edit store "${editingStore.oldName}" as it's currently in use. Please remove it from all requests before editing.`);
        return;
    }

    const updatedStores = stores.map(s => (s === editingStore.oldName ? trimmedName : s));
    onUpdateStores(updatedStores);
    setEditingStore(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Manage Stores</h2>
        
        <div className="mb-4">
          <label htmlFor="new-store" className="block text-sm font-medium text-gray-700">Add New Store</label>
          <div className="mt-1 flex gap-2">
            <input
              id="new-store"
              type="text"
              value={newStoreName}
              onChange={e => setNewStoreName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddStore()}
              className="p-2 border border-gray-300 rounded-md w-full"
              placeholder="e.g. SC"
            />
            <button onClick={handleAddStore} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold">Add</button>
          </div>
        </div>

        <div className="overflow-y-auto flex-grow border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">Existing Stores</h3>
          <ul className="space-y-2">
            {stores.map(store => (
              <li key={store} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                {editingStore?.oldName === store ? (
                  <input
                    type="text"
                    value={editingStore.newName}
                    onChange={e => setEditingStore({ ...editingStore, newName: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                    className="p-1 border border-gray-400 rounded-md flex-grow"
                    autoFocus
                  />
                ) : (
                  <span className="font-medium">{store}</span>
                )}
                <div className="flex gap-2 ml-4">
                  {editingStore?.oldName === store ? (
                    <>
                      <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-800 font-semibold">Save</button>
                      <button onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-700">Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleStartEdit(store)} className="text-blue-600 hover:text-blue-800 font-semibold">Edit</button>
                      <button onClick={() => handleDeleteStore(store)} className="text-red-600 hover:text-red-800 font-semibold">Delete</button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 text-right">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700">Done</button>
        </div>
      </div>
    </div>
  );
};

export default StoreManagerModal;
