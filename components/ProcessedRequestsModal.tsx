import React from 'react';
import type { ProcessedRequest } from '../types';

interface ProcessedRequestsModalProps {
    processedData: ProcessedRequest[];
    onClose: () => void;
}

export const ProcessedRequestsModal: React.FC<ProcessedRequestsModalProps> = ({ processedData, onClose }) => {
    
  const exportToCsv = () => {
    let csvContent = "ID,Brand,Style #,Description,Sender,Receiver,Note\n";
    let lastSender = '';
    let lastReceiver = '';

    processedData.forEach(row => {
        const showSenderSpacer = lastSender && row.sender !== lastSender;
        const showReceiverSpacer = lastSender === row.sender && lastReceiver && row.receiver !== lastReceiver;

        if (showSenderSpacer || showReceiverSpacer) {
             csvContent += ",,,,,,\n";
        }
        
        const rowArray = [
            row.displayId,
            `"${row.brand.replace(/"/g, '""')}"`,
            `"${row.style.replace(/"/g, '""')}"`,
            `"${row.description.replace(/"/g, '""')}"`,
            row.sender,
            row.receiver,
            `"${row.note.replace(/"/g, '""')}"`
        ];
        csvContent += rowArray.join(",") + "\n";
        lastSender = row.sender;
        lastReceiver = row.receiver;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "processed_transfers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Fix: Use React.ReactElement to avoid "Cannot find namespace 'JSX'" error.
  const renderedRows: React.ReactElement[] = [];
  let lastSender = '';
  let lastReceiver = '';

  processedData.forEach((row, index) => {
    const showSenderSpacer = lastSender && row.sender !== lastSender;
    const showReceiverSpacer = lastSender === row.sender && lastReceiver && row.receiver !== lastReceiver;


    if (showSenderSpacer) {
        renderedRows.push(
            <tr key={`spacer-sender-${index}`}>
                <td colSpan={7} className="py-2 bg-gray-200"></td>
            </tr>
        );
    } else if (showReceiverSpacer) {
        renderedRows.push(
            <tr key={`spacer-receiver-${index}`}>
                <td colSpan={7} className="py-1 bg-gray-100"></td>
            </tr>
        );
    }

    renderedRows.push(
        <tr key={`${row.id}-${index}`}>
          <td className="px-4 py-2 whitespace-nowrap text-sm">{row.displayId}</td>
          <td className="px-4 py-2 whitespace-nowrap text-sm">{row.brand}</td>
          <td className="px-4 py-2 whitespace-nowrap text-sm">{row.style}</td>
          <td className="px-4 py-2 text-sm min-w-[250px]">{row.description}</td>
          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-800">{row.sender}</td>
          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-800">{row.receiver}</td>
          <td className="px-4 py-2 whitespace-nowrap text-sm">{row.note}</td>
        </tr>
    );
    
    lastSender = row.sender;
    lastReceiver = row.receiver;
  });

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="processed-requests-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-5xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="processed-requests-title" className="text-2xl font-bold text-gray-800 mb-4 flex-shrink-0">Processed Transfer Requests</h2>
        <div className="overflow-y-auto flex-grow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Style #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sender</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receiver</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {renderedRows}
            </tbody>
          </table>
        </div>
        <div className="mt-6 text-right space-x-2 flex-shrink-0">
          <button
            onClick={exportToCsv}
            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Export to CSV
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
            aria-label="Close processed requests"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProcessedRequestsModal;