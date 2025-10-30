import React, { useState } from 'react';

export const ImportModal = ({ isOpen, onClose, onFetchFromUrl, onFileUpload, isLoading }) => {
  const [csvUrl, setCsvUrl] = useState('');

  if (!isOpen) return null;

  const handleFetchClick = () => {
    if (onFetchFromUrl) {
      onFetchFromUrl(csvUrl);
    }
  };

  const handleFileChange = (event) => {
    if (onFileUpload) {
      onFileUpload(event);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Import Master Data</h2>
        <p className="text-sm text-gray-600 mb-4">Load a master CSV or TSV file with columns: BRAND, STYLE #, DESCRIPTION. This data will be used to auto-fill details for styles you enter in the main text area.</p>
        <div className="space-y-4">
          <div>
            <label htmlFor="modal-url-input" className="block text-sm font-medium text-gray-700 mb-1">
              Import from CSV URL:
            </label>
            <div className="flex gap-2">
              <input
                id="modal-url-input"
                type="url"
                value={csvUrl}
                onChange={e => setCsvUrl(e.target.value)}
                className="flex-grow p-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="https://hai.rf.gd/tmp/cons/"
              />
              <button onClick={handleFetchClick} disabled={isLoading || !csvUrl} className="bg-green-600 text-white px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 font-semibold">
                Fetch
              </button>
            </div>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-400">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Import from Local CSV File:
            </label>
            <input
              id="modal-file-upload"
              type="file"
              accept=".csv,text/csv,.tsv,text/tab-separated-values"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200"
              disabled={isLoading}
            />
          </div>
        </div>
        <div className="mt-6 text-right">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
