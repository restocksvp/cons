import React from 'react';

export const TableSkeleton = () => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {[...Array(9)].map((_, i) => (
              <th key={i} className="px-2 py-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {[...Array(10)].map((_, i) => (
            <tr key={i}>
              {[...Array(9)].map((_, j) => (
                <td key={j} className="px-2 py-2">
                  <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableSkeleton;
