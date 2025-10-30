import React from 'react';
import { renderStatsTable } from './StatisticsTable.tsx';

interface StatisticsModalProps {
  statsData: any; 
  onClose: () => void;
}

export const StatisticsModal: React.FC<StatisticsModalProps> = ({ statsData, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="statistics-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="statistics-title" className="text-2xl font-bold text-gray-800 mb-4">Transfer Statistics</h2>
        <div className="space-y-4">
          {renderStatsTable(statsData, "Current Table Statistics")}
        </div>
        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
            aria-label="Close statistics"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};