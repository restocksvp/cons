import React, { useState, useEffect } from 'react';
import { TableRow } from '../types.ts';
import { renderStatsTable } from './StatisticsTable.tsx';

export const ProgressViewModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [allRequests, setAllRequests] = useState<TableRow[]>([]);
    const [displayRequests, setDisplayRequests] = useState<TableRow[]>([]);
    const [viewMode, setViewMode] = useState<'default' | 'original' | 'all'>('default');
    const [searchInput, setSearchInput] = useState('');
    const [statusMessage, setStatusMessage] = useState('Loading...');
    const [statsData, setStatsData] = useState<any>(null);
    const [isStatsLoading, setIsStatsLoading] = useState(false);

    useEffect(() => {
        try {
            const savedData = localStorage.getItem('transferRequestsProgress');
            if (savedData) {
                const parsedData: TableRow[] = JSON.parse(savedData);
                if (Array.isArray(parsedData)) {
                    setAllRequests(parsedData);
                    setStatusMessage('');
                } else {
                    throw new Error('Saved data is not in the correct array format.');
                }
            } else {
                setStatusMessage('No saved progress found in your browser.');
            }
        } catch (error) {
            setStatusMessage('Error reading saved data. It may be corrupted.');
            console.error(error);
        }
    }, []);

    useEffect(() => {
        const calculateStats = () => {
            if (allRequests.length > 0) {
                setIsStatsLoading(true);
                const validRequests = allRequests.filter(row => row.from && row.to);

                if (validRequests.length === 0) {
                    setStatsData(null);
                    setIsStatsLoading(false);
                    return;
                }

                const senderStatsAgg: { [sender: string]: {
                    total_styles_sent: number;
                    unique_styles: Set<string>;
                    styles_to_receivers: { [receiver: string]: number };
                }} = {};
                const allUniqueStyles = new Set<string>();

                for (const row of validRequests) {
                    const sender = row.from;
                    const receiver = row.to;

                    if (!sender) continue;

                    if (!senderStatsAgg[sender]) {
                        senderStatsAgg[sender] = {
                            total_styles_sent: 0,
                            unique_styles: new Set(),
                            styles_to_receivers: {},
                        };
                    }
                    
                    allUniqueStyles.add(row.style);
                    senderStatsAgg[sender].total_styles_sent += 1;
                    senderStatsAgg[sender].unique_styles.add(row.style);

                    if (!senderStatsAgg[sender].styles_to_receivers[receiver]) {
                        senderStatsAgg[sender].styles_to_receivers[receiver] = 0;
                    }
                    senderStatsAgg[sender].styles_to_receivers[receiver] += 1;
                }
                
                const final_sender_stats: any = {};
                for (const sender in senderStatsAgg) {
                    final_sender_stats[sender] = {
                        total_styles_sent: senderStatsAgg[sender].total_styles_sent,
                        unique_styles_sent_count: senderStatsAgg[sender].unique_styles.size,
                        styles_to_receivers: senderStatsAgg[sender].styles_to_receivers,
                    };
                }
                
                setStatsData({ 
                    sender_stats: final_sender_stats,
                    total_unique_styles: allUniqueStyles.size 
                });
                setIsStatsLoading(false);
            } else {
                 setStatsData(null);
            }
        };

        const timer = setTimeout(calculateStats, 300);
        return () => clearTimeout(timer);

    }, [allRequests]);

    useEffect(() => {
        let processedData = [...allRequests];
        const trimmedSearch = searchInput.trim();

        if (trimmedSearch) {
            const searchStyles = trimmedSearch.toLowerCase().split('\n').filter(Boolean);
            processedData = processedData.filter(req => req.style && searchStyles.includes(req.style.toLowerCase()));
        }

        if (viewMode === 'default') {
            processedData = processedData.filter(req => !!req.from || !!req.to);
        }

        if (viewMode !== 'original') {
            processedData.sort((a, b) => {
                const fromA = a.from || '';
                const fromB = b.from || '';
                const toA = a.to || '';
                const toB = b.to || '';
                const brandA = a.brand || '';
                const brandB = b.brand || '';
                const styleA = a.style || '';
                const styleB = b.style || '';

                let compare = fromA.localeCompare(fromB);
                if (compare !== 0) return compare;
                compare = toA.localeCompare(toB);
                if (compare !== 0) return compare;
                compare = brandA.localeCompare(brandB);
                if (compare !== 0) return compare;
                return styleA.localeCompare(styleB);
            });
        }
        setDisplayRequests(processedData);
    }, [allRequests, viewMode, searchInput]);

    const handleSearch = (text: string) => {
        setSearchInput(text);
        if (!text) {
           setViewMode('default'); // Revert to default view when search is cleared
        }
    };

    const exportTableCsv = () => {
        let csvContent = "BRAND,STYLE #,DESCRIPTION,FROM,TO,NOTE\n";
        displayRequests.forEach(req => {
            const finalNote = req.note === 'Other' ? req.customNote : req.note;
            const rowData = [
                `"${(req.brand || '').toUpperCase().replace(/"/g, '""')}"`,
                `"${(req.style || '').replace(/"/g, '""')}"`,
                `"${(req.description || '').toUpperCase().replace(/"/g, '""')}"`,
                `"${req.from || ''}"`,
                `"${req.to || ''}"`,
                `"${(finalNote || '').replace(/"/g, '""')}"`
            ];
            csvContent += rowData.join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "saved_progress_table.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-gray-50 rounded-lg shadow-xl p-6 w-full max-w-6xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-3xl font-bold text-gray-800 mb-4 flex-shrink-0">View Saved Progress</h2>
                
                {statusMessage ? (
                    <p className="text-center text-red-500 font-bold">{statusMessage}</p>
                ) : (
                    <div className="flex-grow overflow-y-auto space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold mb-2">Search by Style #</h3>
                            <textarea
                                value={searchInput}
                                onChange={e => handleSearch(e.target.value)}
                                placeholder="Enter styles to search, one per line..."
                                className="w-full h-24 p-2 border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold mb-2">Saved Requests Table</h3>
                            <div className="flex gap-2 mb-2">
                                <button onClick={exportTableCsv} className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm">Export Table to CSV</button>
                                <button onClick={() => setViewMode('original')} className="bg-gray-600 text-white px-3 py-1 rounded-md text-sm">Original Data</button>
                                <button onClick={() => setViewMode('all')} className="bg-green-600 text-white px-3 py-1 rounded-md text-sm">Show All Data</button>
                            </div>
                            <div className="overflow-x-auto max-h-96 shadow-md rounded-lg">
                                <table className="min-w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2">BRAND</th>
                                            <th className="px-4 py-2">STYLE #</th>
                                            <th className="px-4 py-2">DESCRIPTION</th>
                                            <th className="px-4 py-2">FROM</th>
                                            <th className="px-4 py-2">TO</th>
                                            <th className="px-4 py-2">NOTE</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayRequests.map(req => {
                                            const finalNote = req.note === 'Other' ? req.customNote : req.note;
                                            return (
                                                <tr key={req.id} className="bg-white border-b">
                                                    <td className="px-4 py-2">{(req.brand || '').toUpperCase()}</td>
                                                    <td className="px-4 py-2">{req.style || ''}</td>
                                                    <td className="px-4 py-2">{(req.description || '').toUpperCase()}</td>
                                                    <td className="px-4 py-2">{req.from || ''}</td>
                                                    <td className="px-4 py-2">{req.to || ''}</td>
                                                    <td className="px-4 py-2">{finalNote || ''}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div>
                             {isStatsLoading ? <p>Loading Statistics...</p> : renderStatsTable(statsData, "Saved Progress Statistics")}
                        </div>
                    </div>
                )}

                <div className="mt-6 text-right space-x-2 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};