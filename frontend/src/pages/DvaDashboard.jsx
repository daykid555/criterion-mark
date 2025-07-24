import { useState } from 'react';
import DvaApprovalQueue from '../components/DvaApprovalQueue';
import DvaHistory from '../components/DvaHistory';

function DvaDashboard() {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' or 'history'

  return (
    <>
      <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">DVA Dashboard</h1>

      {/* Tab Navigation */}
      <div className="flex border-b border-white/20 mb-8">
        <button
          onClick={() => setActiveTab('queue')}
          className={`py-2 px-4 text-lg font-medium ${activeTab === 'queue' ? 'text-white border-b-2 border-white' : 'text-white/60'}`}
        >
          Approval Queue
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-2 px-4 text-lg font-medium ${activeTab === 'history' ? 'text-white border-b-2 border-white' : 'text-white/60'}`}
        >
          Action History
        </button>
      </div>

      {/* Conditional Rendering of Tabs */}
      <div>
        {activeTab === 'queue' ? <DvaApprovalQueue /> : <DvaHistory />}
      </div>
    </>
  );
}

export default DvaDashboard;