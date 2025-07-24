// A mapping to make status text look prettier
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

  return (
    <div className="w-full mt-4 text-white">
      <h2 className="text-2xl font-bold mb-6">Batch History</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/20">
              <th className="p-4 text-sm font-semibold opacity-80">Batch ID</th>
              <th className="p-4 text-sm font-semibold opacity-80">Drug Name</th>
              <th className="p-4 text-sm font-semibold opacity-80">Quantity</th>
              <th className="p-4 text-sm font-semibold opacity-80">Status</th>
              <th className="p-4 text-sm font-semibold opacity-80">Date Requested</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.id} className="border-b border-white/10">
                <td className="p-4">{batch.id}</td>
                <td className="p-4 font-medium">{batch.drugName}</td>
                <td className="p-4">{batch.quantity.toLocaleString()}</td>
                <td className="p-4 no-wrap">
                  <span className={`
    px-3 py-1 text-xs font-medium rounded-full 
    ${STATUS_STYLES[batch.status] || 'bg-gray-400/20 text-gray-200'}
    ${(batch.status.includes('PENDING')) ? 'pulse-attention' : ''}
  `}>
    {batch.status.replace(/_/g, ' ')}
  </span>
                </td>
                <td className="p-4 opacity-70">
                  {new Date(batch.createdAt).toLocaleDateString()}
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