import React, { useState, useEffect, useRef, useMemo } from 'react';

import type { TableRow, MasterStyleRecord, ProcessedRequest } from './types';
import { NOTE_OPTIONS, DEFAULT_STORE_CODES } from './constants';

import { AlertBar } from './components/AlertBar';
import { ConfirmationModal } from './components/ConfirmationModal';
import { ImportModal } from './components/ImportModal';
import { ProcessedRequestsModal } from './components/ProcessedRequestsModal';
import { ProcessingOverlay } from './components/ProcessingOverlay';
import { ProgressViewModal } from './components/ProgressViewModal';
import { StatisticsModal } from './components/StatisticsModal';
import { StoreManagerModal } from './components/StoreManagerModal';
import { StoreSelector } from './components/StoreSelector';
import { TableSkeleton } from './components/TableSkeleton';

declare global {
    interface Window {
        ZXing: any;
    }
}

const App = () => {
  const [stylesInput, setStylesInput] = useState('');
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [masterStyleData, setMasterStyleData] = useState<MasterStyleRecord[]>([]);
  const [filter, setFilter] = useState('');
  const [filterColumn, setFilterColumn] = useState('all');
  const [showStats, setShowStats] = useState(false);
  const [statisticsData, setStatisticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showProcessedRequests, setShowProcessedRequests] = useState(false);
  const [showProgressView, setShowProgressView] = useState(false);
  const [processedData, setProcessedData] = useState<ProcessedRequest[]>([]);
  const [storeCodes, setStoreCodes] = useState<string[]>([]);
  const [isStoreManagerOpen, setIsStoreManagerOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set<number>());
  const [sortConfig, setSortConfig] = useState<{ key: keyof TableRow | null, direction: 'ascending' | 'descending' }>({ key: null, direction: 'ascending' });
  const [alert, setAlert] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const alertTimerRef = useRef<number | null>(null);
  const [bulkFrom, setBulkFrom] = useState('');
  const [bulkTo, setBulkTo] = useState('');
  const [bulkNote, setBulkNote] = useState('');

  const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (alertTimerRef.current) {
      window.clearTimeout(alertTimerRef.current);
    }
    setAlert({ message, type });
    alertTimerRef.current = window.setTimeout(() => {
      setAlert(null);
      alertTimerRef.current = null;
    }, 5000);
  };

  useEffect(() => {
    try {
        const savedStores = localStorage.getItem('storeCodes');
        if (savedStores) {
            setStoreCodes(JSON.parse(savedStores));
        } else {
            setStoreCodes(DEFAULT_STORE_CODES);
        }
    } catch (error) {
        console.error("Failed to load stores from localStorage", error);
        setStoreCodes(DEFAULT_STORE_CODES);
    }
  }, []);
  
  const handleUpdateStores = (newStores: string[]) => {
      const sortedStores = [...newStores].sort();
      setStoreCodes(sortedStores);
      localStorage.setItem('storeCodes', JSON.stringify(sortedStores));
  };

  const processAndSetMasterData = (csvText: string) => {
    try {
        const lines = csvText.trim().replace(/\r\n/g, '\n').split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) {
            showAlert('File must have a header and at least one data row.', 'error');
            return;
        }

        const headerLine = lines.shift()!.trim();
        const delimiter = headerLine.includes('\t') ? '\t' : ',';

        const headers = headerLine.toLowerCase().split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));

        const styleIndex = headers.findIndex(h => h === 'style #' || h === 'style');
        const brandIndex = headers.findIndex(h => h === 'brand');
        const descriptionIndex = headers.findIndex(h => h === 'description');

        if (styleIndex === -1 || brandIndex === -1 || descriptionIndex === -1) {
            showAlert('Header must contain "BRAND", "STYLE #" (or "STYLE"), and "DESCRIPTION".', 'error');
            return;
        }

        const totalDataRows = lines.length;

        const parsedMasterData = lines.map(line => {
            let parts;
            if (delimiter === '\t') {
                parts = line.split('\t');
            } else {
                parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            }
            
            const maxIndex = Math.max(styleIndex, brandIndex, descriptionIndex);
            if (parts.length <= maxIndex) {
                 console.warn(`Skipping malformed line (not enough columns or parse error): ${line}`);
                 return null;
            }

            const cleanPart = (p: string) => p ? p.trim().replace(/^"|"$/g, '').trim() : '';

            const brand = cleanPart(parts[brandIndex]).toUpperCase();
            const style = cleanPart(parts[styleIndex]).toUpperCase();
            const description = cleanPart(parts[descriptionIndex]).toUpperCase();

            if (!brand || !style) {
                console.warn(`Skipping master data line with missing brand or style: ${line}`);
                return null;
            }
            return { brand, style, description };
        }).filter(Boolean) as MasterStyleRecord[];

        const skippedRowCount = totalDataRows - parsedMasterData.length;

        if (parsedMasterData.length === 0) {
            let message = 'No valid data rows could be parsed from the file.';
            let type: 'info' | 'error' = 'info';
            if (skippedRowCount > 0) {
                message = `All ${skippedRowCount} data rows were skipped due to formatting errors or missing data. Please check the file and browser console.`;
                type = 'error';
            }
            showAlert(message, type);
            return;
        }

        setMasterStyleData(parsedMasterData);
        let successMessage = `Successfully loaded ${parsedMasterData.length} styles as the data source.`;
        if (skippedRowCount > 0) {
            successMessage += ` ${skippedRowCount} row(s) were skipped due to errors.`;
        }
        showAlert(successMessage, 'success');

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        showAlert(`Error processing master data: ${errorMessage}`, 'error');
    }
  };

  const handleFetchFromUrl = async (urlToFetch: string) => {
    if (!urlToFetch) {
        showAlert('Please enter a valid URL.', 'error');
        return;
    }
    setIsLoading(true);
    setLoadingText('Fetching remote data...');
    try {
        const response = await fetch(urlToFetch);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }
        const csvData = await response.text();
        processAndSetMasterData(csvData);
        setIsImportModalOpen(false);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        showAlert(`Could not fetch data from URL. Details: ${errorMessage}`, 'error');
    } finally {
        setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
        return;
    }

    setIsLoading(true);
    setLoadingText('Reading file...');

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            if (typeof text === 'string') {
                processAndSetMasterData(text);
                setIsImportModalOpen(false);
            } else {
                throw new Error('File content could not be read as text.');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            showAlert(`Error reading file: ${errorMessage}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };
    reader.onerror = () => {
        showAlert('Failed to read the file.', 'error');
        setIsLoading(false);
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

const handleLoadStyles = () => {
    setIsLoading(true);
    setLoadingText('Loading Styles...');
    try {
        const trimmedInput = stylesInput.trim();
        if (!trimmedInput) {
             setIsLoading(false);
             return;
        }

        const lines = trimmedInput.split('\n').filter(line => line.trim() !== '');

        if (lines.length === 0) {
            setIsLoading(false);
            return;
        }

        const newRows: TableRow[] = lines.map((line, index) => {
             const style = line.trim().toUpperCase();
             const masterRecord = masterStyleData.find(record => record.style.toUpperCase() === style);

             const newId = (tableData.length > 0 ? Math.max(...tableData.map(r => r.id)) : 0) + index + 1;
             return {
                id: newId,
                displayId: newId,
                brand: masterRecord ? masterRecord.brand : '',
                style: style,
                description: masterRecord ? masterRecord.description : '',
                from: '',
                to: '',
                note: '',
                customNote: ''
             };
        });
        
        if (newRows.length > 0) {
            setTableData(prevData => [...prevData, ...newRows]);
            if(masterStyleData.length > 0) {
                const foundCount = newRows.filter(r => r.brand).length;
                showAlert(`Loaded ${newRows.length} styles. Found details for ${foundCount}.`, 'success');
            }
        }
        setStylesInput('');

    } catch (error) {
        console.error('Failed to load styles:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        showAlert(`Error Loading Styles: ${errorMessage}`, 'error');
    } finally {
        setIsLoading(false);
    }
};

  const updateRow = (id: number, updatedValues: Partial<TableRow>) => {
    setTableData(currentData =>
      currentData.map(row => (row.id === id ? { ...row, ...updatedValues } : row))
    );
  };

  const handleDuplicate = (id: number) => {
    const rowToDuplicate = tableData.find(row => row.id === id);
    if (rowToDuplicate) {
      const newId = Math.max(...tableData.map(r => r.id)) + 1;
      const newRow: TableRow = {
        ...rowToDuplicate,
        id: newId,
        displayId: rowToDuplicate.displayId,
        from: '',
        to: '',
        note: '',
        customNote: ''
      };
      const originalIndex = tableData.findIndex(row => row.id === id);
      const newData = [...tableData];
      newData.splice(originalIndex + 1, 0, newRow);
      setTableData(newData);
    }
  };

  const handleDelete = (id: number) => {
    setTableData(currentData => currentData.filter(row => row.id !== id));
    setSelectedRowIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
    });
  };
  
  const handleClearAll = () => {
    setStylesInput('');
    setTableData([]);
    setSelectedRowIds(new Set());
  };

  const handleSaveProgress = () => {
    try {
      localStorage.setItem('transferRequestsProgress', JSON.stringify(tableData));
       showAlert('Progress saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving progress to localStorage:', error);
      showAlert('Failed to save progress. Your browser storage might be full.', 'error');
    }
  };

  const handleLoadProgress = () => {
     setConfirmation({
        isOpen: true,
        title: 'Load Progress',
        message: 'Are you sure you want to load saved progress? This will overwrite any unsaved changes in the current table.',
        confirmText: 'Load',
        onConfirm: () => {
            try {
                const savedData = localStorage.getItem('transferRequestsProgress');
                if (savedData) {
                    const loadedData = JSON.parse(savedData);
                    if (Array.isArray(loadedData)) {
                        setTableData(loadedData);
                        setSelectedRowIds(new Set());
                         showAlert('Progress loaded successfully!', 'success');
                    } else {
                         showAlert('Saved progress is not in the correct format.', 'error');
                    }
                } else {
                     showAlert('No saved progress found in your browser.', 'error');
                }
            } catch (error) {
                console.error('Error loading progress from localStorage:', error);
                 showAlert('Failed to load progress. The saved data might be corrupted.', 'error');
            }
        }
    });
  };

  const startScan = () => setIsScanning(true);
  const stopScan = () => setIsScanning(false);

  useEffect(() => {
    if (!isScanning) {
        return;
    }

    const videoElement = videoRef.current;
    if (!videoElement) {
        console.error("Video element ref is not available.");
        setIsScanning(false); 
        return;
    }

    const ZXing = window.ZXing;
    if (!ZXing) {
        showAlert("Barcode scanning library failed to load. Please try refreshing the page.", "error");
        setIsScanning(false);
        return;
    }

    const codeReader = new ZXing.BrowserMultiFormatReader();
    let isMounted = true;

    const startDecoding = async () => {
        try {
            codeReader.decodeFromVideoDevice(undefined, videoElement, (result, err) => {
                if (!isMounted) return;

                if (result) {
                    setStylesInput(prev => prev + (prev ? '\n' : '') + result.getText());
                    stopScan();
                }
                
                if (err && !(err instanceof ZXing.NotFoundException)) {
                    console.error('Barcode scan error:', err);
                    showAlert('An unexpected error occurred during scanning. The scanner has been stopped.', 'error');
                    stopScan();
                }
            });

        } catch (err) {
            if (!isMounted) return;
            
            console.error("Failed to start scanner:", err);
            let message = 'Could not start the camera. Please ensure it is not in use by another application.';
            if (err instanceof Error) {
                switch(err.name) {
                    case 'NotAllowedError':
                    case 'PermissionDeniedError':
                        message = 'Camera permission denied. Please grant camera access in your browser settings to use the scanner.';
                        break;
                    case 'NotFoundError':
                    case 'DevicesNotFoundError':
                        message = 'No camera found. Please ensure a camera is connected and enabled.';
                        break;
                    case 'NotReadableError':
                        message = 'The camera is already in use by another application.';
                        break;
                }
            }
            showAlert(message, 'error');
            setIsScanning(false);
        }
    };

    startDecoding();

    return () => {
        isMounted = false;
        codeReader.reset();
    };
  }, [isScanning]);


  const handleProcessRequests = () => {
    const incompleteRows = tableData.filter(row => !row.from || !row.to);

    if (tableData.length === 0) {
        showAlert('No data in the table to process.', 'info');
        return;
    }

    const proceedWithProcessing = () => {
        setIsProcessing(true);
        const processed = tableData.map(row => ({
          id: row.id,
          displayId: row.displayId,
          brand: row.brand,
          style: row.style,
          description: row.description,
          sender: row.from,
          receiver: row.to,
          note: row.note === 'Other' ? row.customNote || '' : row.note,
        })).sort((a, b) => {
          const senderCompare = a.sender.localeCompare(b.sender);
          if (senderCompare !== 0) return senderCompare;
          const receiverCompare = a.receiver.localeCompare(b.receiver);
          if (receiverCompare !== 0) return receiverCompare;
          const brandCompare = a.brand.localeCompare(b.brand);
          if (brandCompare !== 0) return brandCompare;
          return a.style.localeCompare(b.style);
        });
        
        setTimeout(() => {
            setProcessedData(processed);
            setShowProcessedRequests(true);
            setIsProcessing(false);
        }, 500);
    };

    if (incompleteRows.length > 0) {
        const incompleteDisplayIds = [...new Set(incompleteRows.map(row => row.displayId))].sort((a, b) => Number(a) - Number(b)).join(', ');
        setConfirmation({
            isOpen: true,
            title: 'Incomplete Requests Found',
            message: (
                <>
                    <p>The following requests are incomplete (missing a 'From' or 'To' store):</p>
                    <p className="font-bold my-2">IDs: {incompleteDisplayIds}</p>
                    <p>Do you want to proceed and process all requests, including the incomplete ones?</p>
                </>
            ),
            onConfirm: proceedWithProcessing,
            confirmText: 'Process Anyway'
        });
    } else {
        proceedWithProcessing();
    }
  };

const handleViewStatistics = () => {
    if (tableData.length === 0) {
        showAlert('No data available to generate statistics.', 'info');
        return;
    }

    const requestsForStats = tableData;

    const senderStatsAgg = {};
    const allUniqueStyles = new Set();

    for (const row of requestsForStats) {
        const sender = row.from;
        const receiver = row.to;

        allUniqueStyles.add(row.style);

        if (!sender) {
            continue;
        }

        if (!senderStatsAgg[sender]) {
            senderStatsAgg[sender] = {
                total_styles_sent: 0,
                unique_styles: new Set(),
                styles_to_receivers: {},
            };
        }
        
        senderStatsAgg[sender].total_styles_sent += 1;
        senderStatsAgg[sender].unique_styles.add(row.style);

        if (receiver) {
            if (!senderStatsAgg[sender].styles_to_receivers[receiver]) {
                senderStatsAgg[sender].styles_to_receivers[receiver] = 0;
            }
            senderStatsAgg[sender].styles_to_receivers[receiver] += 1;
        }
    }
    
    const final_sender_stats = {};
    for (const sender in senderStatsAgg) {
        final_sender_stats[sender] = {
            total_styles_sent: senderStatsAgg[sender].total_styles_sent,
            unique_styles_sent_count: senderStatsAgg[sender].unique_styles.size,
            styles_to_receivers: senderStatsAgg[sender].styles_to_receivers,
        };
    }
    
    setStatisticsData({ 
        sender_stats: final_sender_stats,
        total_unique_styles: allUniqueStyles.size 
    });
    setShowStats(true);
};

  const filteredData = useMemo(() => {
    return tableData.filter(row => {
      if (!filter) return true;
      const lowerCaseFilter = filter.toLowerCase();
      
      if (filterColumn === 'all') {
        return (
          row.brand.toLowerCase().includes(lowerCaseFilter) ||
          row.style.toLowerCase().includes(lowerCaseFilter) ||
          row.description.toLowerCase().includes(lowerCaseFilter) ||
          row.from.toLowerCase().includes(lowerCaseFilter) ||
          row.to.toLowerCase().includes(lowerCaseFilter)
        );
      } else {
        const column = filterColumn as keyof TableRow;
        const rowValue = row[column]?.toString().toLowerCase() || '';
        return rowValue.includes(lowerCaseFilter);
      }
    });
  }, [tableData, filter, filterColumn]);

  const sortedAndFilteredData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig.key !== null) {
      const { key, direction } = sortConfig;
      sortableItems.sort((a, b) => {
        const aValue = a[key!];
        const bValue = b[key!];
        
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        let comparison = 0;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          if (aValue < bValue) comparison = -1;
          else if (aValue > bValue) comparison = 1;
        } else {
          comparison = String(aValue).toLowerCase().localeCompare(String(bValue).toLowerCase());
        }

        return direction === 'ascending' ? comparison : -comparison;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  const requestSort = (key: keyof TableRow) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const rowColorMap = useMemo(() => {
    const displayIdCounts = tableData.reduce((acc, row) => {
      acc[row.displayId] = (acc[row.displayId] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const duplicatedDisplayIds = Object.keys(displayIdCounts)
      .filter(id => displayIdCounts[Number(id)] > 1)
      .map(Number);

    const colorPalette = [
      'bg-blue-50', 'bg-green-50', 'bg-yellow-50',
      'bg-purple-50', 'bg-pink-50', 'bg-indigo-50'
    ];

    return duplicatedDisplayIds.reduce((acc, id, index) => {
      acc[id] = colorPalette[index % colorPalette.length];
      return acc;
    }, {} as Record<number, string>);
  }, [tableData]);

  const getRowClassName = (row: TableRow) => {
    if (selectedRowIds.has(row.id)) return 'bg-blue-100';
    if (row.from && !row.to) return 'bg-pink-100';
    return rowColorMap[row.displayId] || '';
  };

  const handleSelectRow = (id: number) => {
    setSelectedRowIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
        const allFilteredIds = sortedAndFilteredData.map(row => row.id);
        setSelectedRowIds(new Set(allFilteredIds));
    } else {
        setSelectedRowIds(new Set());
    }
  };

  const handleApplyBulkChanges = () => {
    if (selectedRowIds.size === 0 || (!bulkFrom && !bulkTo && !bulkNote)) {
      return;
    }

    setTableData(prevData =>
      prevData.map(row => {
        if (selectedRowIds.has(row.id)) {
          const updatedRow = { ...row };
          if (bulkFrom) updatedRow.from = bulkFrom;
          if (bulkTo) updatedRow.to = bulkTo;
          if (bulkNote) {
            updatedRow.note = bulkNote;
            if (bulkNote !== 'Other') {
                updatedRow.customNote = '';
            }
          }
          return updatedRow;
        }
        return row;
      })
    );
    
    showAlert(`Applied changes to ${selectedRowIds.size} rows.`, 'success');
    handleClearSelection();
  };

  const handleClearSelection = () => {
    setSelectedRowIds(new Set());
    setBulkFrom('');
    setBulkTo('');
    setBulkNote('');
  };
  
  const renderSortArrow = (columnKey: keyof TableRow) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  const filterOptions = [
    { value: 'all', label: 'All Columns' },
    { value: 'brand', label: 'Brand' },
    { value: 'style', label: 'Style #' },
    { value: 'description', label: 'Description' },
    { value: 'from', label: 'From' },
    { value: 'to', label: 'To' },
  ];

  const placeholderText = `Use the "Import Data" button to load your data.
Then, enter the styles you want to request, one per line.
e.g.
DD5975 010
CW9610 010
DV0050 010`;

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
       {alert && <AlertBar message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}

      {isScanning && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col items-center justify-center">
            <video ref={videoRef} className="w-full max-w-lg h-auto rounded-lg" playsInline></video>
            <button onClick={stopScan} className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg shadow-lg">Stop Scanning</button>
        </div>
      )}

      <header className="bg-gray-800 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-center flex-grow">Store Transfer Request Generator</h1>
            <button
                onClick={() => setIsStoreManagerOpen(true)}
                className="bg-gray-600 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 text-sm"
            >
                Manage Stores
            </button>
        </div>
      </header>

      <main className="container mx-auto p-4 max-w-screen-2xl">
        <div className="bg-white p-4 rounded-lg shadow-md mb-4 space-y-4">
          <div>
            <label htmlFor="styles-input" className="block text-sm font-medium text-gray-700 mb-1">
              Enter Styles# to Request (one per line):
            </label>
            <textarea
              id="styles-input"
              value={stylesInput}
              onChange={e => setStylesInput(e.target.value)}
              className="w-full h-40 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={placeholderText}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              <button onClick={handleLoadStyles} disabled={isLoading || !stylesInput} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-semibold">
                {isLoading && loadingText.startsWith('Loading Styles') ? loadingText : 'Load from Text Area'}
              </button>
              <button onClick={startScan} className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
                Scan Barcode
              </button>
               <button onClick={() => setIsImportModalOpen(true)} className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
                Import Data
              </button>
              <button onClick={handleClearAll} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
                Clear All
              </button>
              <button onClick={handleViewStatistics} className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
                View Statistics
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md relative">
          {isProcessing && <ProcessingOverlay />}
           <div className="flex items-center mb-3 space-x-2">
            <label className="font-medium text-gray-700">Filter By:</label>
            <select
                value={filterColumn}
                onChange={e => setFilterColumn(e.target.value)}
                className="p-2 border border-gray-300 rounded-md text-base"
            >
                {filterOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <input
              type="text"
              placeholder="Type to filter..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded-md w-full max-w-sm text-base"
            />
          </div>

          {selectedRowIds.size > 0 && (
            <div className="bg-blue-200 border-t-2 border-b-2 border-blue-300 p-3 rounded-md mb-3 flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div className="flex-shrink-0">
                <span className="font-bold text-blue-800">{selectedRowIds.size} rows selected.</span>
              </div>
              <div className="flex-grow flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-2">
                  <label className="font-medium text-sm text-gray-700">Set From:</label>
                  <select value={bulkFrom} onChange={e => setBulkFrom(e.target.value)} className="p-1 border border-gray-300 rounded-md shadow-sm">
                    <option value="">--</option>
                    {storeCodes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="font-medium text-sm text-gray-700">Set To:</label>
                  <select value={bulkTo} onChange={e => setBulkTo(e.target.value)} className="p-1 border border-gray-300 rounded-md shadow-sm">
                    <option value="">--</option>
                    {storeCodes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="font-medium text-sm text-gray-700">Set Note:</label>
                  <select value={bulkNote} onChange={e => setBulkNote(e.target.value)} className="p-1 border border-gray-300 rounded-md shadow-sm">
                    {NOTE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || '--'}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                <button 
                  onClick={handleApplyBulkChanges} 
                  disabled={!bulkFrom && !bulkTo && !bulkNote}
                  className="px-4 py-1.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm shadow flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Apply
                </button>
                <button onClick={handleClearSelection} className="px-4 py-1.5 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors text-sm shadow">
                  Clear
                </button>
              </div>
            </div>
          )}

          {isLoading && tableData.length === 0 ? (
            <TableSkeleton />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-3 text-left">
                      <input type="checkbox" onChange={handleSelectAll} checked={selectedRowIds.size > 0 && selectedRowIds.size === sortedAndFilteredData.length} />
                    </th>
                    <th className="px-2 py-3 text-left text-sm font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestSort('displayId')}>ID{renderSortArrow('displayId')}</th>
                    <th className="px-2 py-3 text-left text-sm font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestSort('brand')}>Brand{renderSortArrow('brand')}</th>
                    <th className="px-2 py-3 text-left text-sm font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestSort('style')}>Style #{renderSortArrow('style')}</th>
                    <th className="px-2 py-3 text-left text-sm font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestSort('description')}>Description{renderSortArrow('description')}</th>
                    <th className="px-2 py-3 text-left text-sm font-medium text-gray-500 uppercase">From</th>
                    <th className="px-2 py-3 text-left text-sm font-medium text-gray-500 uppercase">To</th>
                    <th className="px-2 py-3 text-left text-sm font-medium text-gray-500 uppercase w-40">Note</th>
                    <th className="px-2 py-3 text-left text-sm font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedAndFilteredData.map(row => {
                      const otherRowsWithSameStyle = tableData.filter(
                        r => r.style === row.style && r.id !== row.id
                      );

                      const fromStoresForThisStyle = new Set(otherRowsWithSameStyle.map(r => r.from).filter(Boolean));
                      const toStoresForThisStyle = new Set(otherRowsWithSameStyle.map(r => r.to).filter(Boolean));

                      const disabledForFromSelector = Array.from(toStoresForThisStyle);
                      const disabledForToSelector = Array.from(new Set([row.from, ...fromStoresForThisStyle])).filter(Boolean);

                      return (
                          <tr key={row.id} className={getRowClassName(row)}>
                              <td className="px-2 py-2">
                                  <input type="checkbox" checked={selectedRowIds.has(row.id)} onChange={() => handleSelectRow(row.id)} />
                              </td>
                              <td className="px-2 py-2 whitespace-nowrap text-base">{row.displayId}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-base">{row.brand}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-base">{row.style}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-base min-w-[200px]">{row.description}</td>
                              <td className="px-2 py-2">
                                  <StoreSelector 
                                      stores={storeCodes} 
                                      selected={row.from} 
                                      onChange={newSelection => updateRow(row.id, { from: newSelection })}
                                      disabledStores={disabledForFromSelector} 
                                  />
                              </td>
                              <td className="px-2 py-2">
                                  <StoreSelector 
                                      stores={storeCodes} 
                                      selected={row.to} 
                                      onChange={newSelection => updateRow(row.id, { to: newSelection })}
                                      disabledStores={disabledForToSelector}
                                  />
                              </td>
                              <td className="px-2 py-2">
                                  <select
                                      value={row.note}
                                      onChange={e => updateRow(row.id, { note: e.target.value })}
                                      className="p-1 border border-gray-300 rounded-md text-base w-full"
                                  >
                                      {NOTE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || '-- Select Note --'}</option>)}
                                  </select>
                                  {row.note === 'Other' && (
                                      <input
                                          type="text"
                                          value={row.customNote || ''}
                                          onChange={e => updateRow(row.id, { customNote: e.target.value })}
                                          className="mt-1 p-1 border border-gray-300 rounded-md text-base w-full"
                                          placeholder="Custom note..."
                                      />
                                  )}
                              </td>
                              <td className="px-2 py-2 whitespace-nowrap text-base">
                              <div className="flex flex-col space-y-1">
                                  <button onClick={() => handleDuplicate(row.id)} className="bg-gray-500 text-white px-2 py-1 rounded-md text-sm hover:bg-gray-600">Duplicate</button>
                                  <button onClick={() => handleDelete(row.id)} className="bg-red-600 text-white px-2 py-1 rounded-md text-sm hover:bg-red-700">Delete</button>
                              </div>
                              </td>
                          </tr>
                      );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={handleProcessRequests}
              disabled={isProcessing || tableData.length === 0}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-semibold disabled:bg-gray-400"
            >
                {isProcessing ? 'Processing...' : 'Process Requests'}
            </button>
            <button
              onClick={() => setShowProgressView(true)}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 font-semibold"
            >
                View Progress
            </button>
        </div>
      </main>

       <div className="fixed bottom-4 right-4 flex flex-col gap-2">
         <button onClick={handleSaveProgress} className="bg-gray-700 text-white px-[0.6rem] py-[0.2rem] rounded-md hover:bg-gray-800 cursor-pointer text-[0.6rem] shadow-lg">
           Save Progress
         </button>
         <button onClick={handleLoadProgress} className="bg-gray-700 text-white px-[0.6rem] py-[0.2rem] rounded-md hover:bg-gray-800 cursor-pointer text-[0.6rem] shadow-lg">
           Load Progress
         </button>
      </div>

      {showStats && <StatisticsModal statsData={statisticsData} onClose={() => setShowStats(false)} />}
      {showProcessedRequests && <ProcessedRequestsModal processedData={processedData} onClose={() => setShowProcessedRequests(false)} />}
      {showProgressView && <ProgressViewModal onClose={() => setShowProgressView(false)} />}
      {isStoreManagerOpen && (
          <StoreManagerModal
              isOpen={isStoreManagerOpen}
              onClose={() => setIsStoreManagerOpen(false)}
              stores={storeCodes}
              onUpdateStores={handleUpdateStores}
              tableData={tableData}
          />
      )}
       {confirmation && confirmation.isOpen && (
        <ConfirmationModal
            isOpen={confirmation.isOpen}
            title={confirmation.title}
            message={confirmation.message}
            onConfirm={confirmation.onConfirm}
            onClose={() => setConfirmation(null)}
            confirmText={confirmation.confirmText}
        />
      )}
      {isImportModalOpen && (
        <ImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onFetchFromUrl={handleFetchFromUrl}
            onFileUpload={handleFileUpload}
            isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default App;
