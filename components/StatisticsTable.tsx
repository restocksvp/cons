import React from 'react';

export const renderStatsTable = (statsData: any, title: string) => {
    if (!statsData || !statsData.sender_stats) {
        return <p className="text-gray-500">No statistics data available.</p>;
    }

    const { sender_stats, total_unique_styles } = statsData;
    const allReceivers = new Set<string>();
    let totalOverall = 0;
    const receiverTotals: Record<string, number> = {};

    Object.values(sender_stats).forEach((sender: any) => {
        Object.keys(sender.styles_to_receivers).forEach(receiver => {
            allReceivers.add(receiver);
        });
    });

    const sortedReceivers = Array.from(allReceivers).sort();
    const sortedSenders = Object.keys(sender_stats).sort();

    // Calculate totals
    sortedSenders.forEach(senderKey => {
        const sender = sender_stats[senderKey];
        totalOverall += sender.total_styles_sent;
        sortedReceivers.forEach(receiverKey => {
             const count = sender.styles_to_receivers[receiverKey] || 0;
             receiverTotals[receiverKey] = (receiverTotals[receiverKey] || 0) + count;
        });
    });

    return (
        <div className="overflow-x-auto shadow-md rounded-lg">
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <table className="min-w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                    <tr>
                        <th rowSpan={2} className="px-4 py-3 border">Sender</th>
                        <th rowSpan={2} className="px-4 py-3 border">Total Sent</th>
                        <th rowSpan={2} className="px-4 py-3 border">Unique Styles</th>
                        <th colSpan={sortedReceivers.length || 1} className="px-4 py-3 text-center border">Receivers</th>
                    </tr>
                    <tr>
                        {sortedReceivers.map(r => <th key={r} className="px-4 py-2 border">{r}</th>)}
                    </tr>
                    <tr className="font-bold bg-gray-200 text-gray-800">
                       <td className="px-4 py-2 border">Total</td>
                       <td className="px-4 py-2 border">{totalOverall}</td>
                       <td className="px-4 py-2 border">{total_unique_styles ?? 'N/A'}</td>
                       {sortedReceivers.map(r => <td key={r} className="px-4 py-2 border">{receiverTotals[r] || 0}</td>)}
                    </tr>
                </thead>
                <tbody>
                    {sortedSenders.map(sender => (
                        <tr key={sender} className="bg-white border-b">
                            <td className="px-4 py-2 font-medium text-gray-900 border">{sender}</td>
                            <td className="px-4 py-2 border">{sender_stats[sender].total_styles_sent}</td>
                            <td className="px-4 py-2 border">{sender_stats[sender].unique_styles_sent_count}</td>
                            {sortedReceivers.map(receiver => (
                                <td key={receiver} className="px-4 py-2 border">{sender_stats[sender].styles_to_receivers[receiver] || 0}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};