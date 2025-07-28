// frontend/src/components/BatchHistoryTable.jsx

// (STATUS_STYLES const remains the same)
const STATUS_STYLES = {
    PENDING_DVA_APPROVAL: 'bg-yellow-400/20 text-yellow-200 border border-yellow-400/30',
    PENDING_ADMIN_APPROVAL: 'bg-blue-400/20 text-blue-200 border border-blue-400/30',
    PENDING_PRINTING: 'bg-purple-400/20 text-purple-200 border border-purple-400/30',
    DELIVERED: 'bg-green-400/20 text-green-200 border border-green-400/30',
    ADMIN_REJECTED: 'bg-red-400/20 text-red-200 border border-red-400/30',
};


function BatchHistoryTable({ batches }) {
  if (!batches || batches.length === 0) {
    return <p className="text-center text-white/70 mt-8">You have not requested any batches yet.</p>;
  }

  // Get the base URL for our API from environment variables
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  return (
    <div className="w-full mt-4 text-white">
      <h2 className="text-2xl font-bold mb-6">Batch History</h2>
      {/* This div makes the table scrollable on small screens */}
      <div className="overflow-x-auto">
        {/* min-w adds a minimum width to prevent content from squishing */}
        <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr className="border-b border-white/20">
              <th className="p-4 text-sm font-semibold opacity-80">Batch ID</th>
              <th className="p-4 text-sm font-semibold opacity-80">Drug Name</th>
              <th className="p-4 text-sm font-semibold opacity-80">Quantity</th>
              <th className="p-4 text-sm font-semibold opacity-80">Status</th>
              <th className="p-4 text-sm font-semibold opacity-80">Date Requested</th>
              {/* --- NEW: Add the Seal Design column header --- */}
              <th className="p-4 text-sm font-semibold opacity-80 text-center">Seal Design</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.id} className="border-b border-white/10">
                <td className="p-4">{batch.id}</td>
                <td className="p-4 font-medium">{batch.drugName}</td>
                <td className="p-4">{batch.quantity.toLocaleString()}</td>
                <td className="p-4 whitespace-nowrap">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[batch.status] || 'bg-gray-400/20 text-gray-200'} ${(batch.status.includes('PENDING')) ? 'pulse-attention' : ''}`}>
                    {batch.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="p-4 opacity-70 whitespace-nowrap">
                  {new Date(batch.createdAt).toLocaleDateString()}
                </td>
                {/* --- NEW: Add the Seal Design table data cell --- */}
                <td className="p-4 text-center">
                  {batch.seal_background_url ? (
                    // If a seal URL exists, display the image
                    <img 
                      src={`${API_BASE_URL}${batch.seal_background_url}`}
                      alt="Seal Preview"
                      className="h-10 w-auto object-contain mx-auto rounded-sm bg-white/10 p-1"
                    />
                  ) : (
                    // If not, show a pending message
                    <span className="text-xs text-white/50 italic">Pending Admin</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BatchHistoryTable;