// frontend/src/pages/HealthAdvisorDashboardPage.jsx

import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiPlus, FiVideo, FiEdit, FiTrash2, FiLoader, FiAlertTriangle, FiCheckSquare } from 'react-icons/fi';

function HealthAdvisorDashboardPage() {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { tab } = useParams(); // Get 'pending' or 'all' from the URL

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      const endpoint = tab === 'pending' 
        ? '/api/health-advisor/pending-content' 
        : '/api/health-advisor/videos';
      
      try {
        const response = await apiClient.get(endpoint);
        setContent(response.data);
      } catch (err) {
        setError('Failed to fetch data. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [tab]); // Re-fetch data whenever the tab in the URL changes

  const handleAddContent = (item) => {
    navigate('/health-advisor/create', { state: { pendingItem: item } });
  };

  const handleDelete = (videoId) => {
    alert(`(Feature Pending) Deleting video ID: ${videoId}`);
  };

  const getPageTitle = () => {
    return tab === 'pending' ? 'Action Required' : 'All Content';
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center p-8 text-white"><FiLoader className="animate-spin text-2xl mx-auto" /></div>;
    }
    if (error) {
      return <div className="text-center p-8 text-red-300 flex flex-col items-center gap-4"><FiAlertTriangle className="text-4xl" /> <p>{error}</p></div>;
    }
    if (content.length === 0) {
      return tab === 'pending' ? (
        <div className="text-center p-8 text-white/70">
          <FiCheckSquare className="text-5xl mx-auto mb-4 text-green-400" />
          <h2 className="text-xl font-bold">All Caught Up!</h2>
          <p>There are no delivered products awaiting health content.</p>
        </div>
      ) : (
        <div className="text-center p-8 text-white/70">
            <FiVideo className="text-5xl mx-auto mb-4" />
            <h2 className="text-xl font-bold">No Content Entries Found</h2>
            <p>Click "Add New Content" in the sidebar to create your first entry.</p>
        </div>
      );
    }
    
    // Render the correct table based on the tab
    return tab === 'pending' ? (
       <table className="min-w-full text-sm text-left text-white/90">
          <thead className="bg-white/10 text-xs uppercase">
            <tr>
              <th scope="col" className="px-6 py-3">Drug Name</th>
              <th scope="col" className="px-6 py-3">NAFDAC Number</th>
              <th scope="col" className="px-6 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {content.map((item) => (
              <tr key={item.nafdacNumber} className="border-b border-white/10 hover:bg-white/5">
                <td className="px-6 py-4 font-bold">{item.drugName}</td>
                <td className="px-6 py-4 font-mono">{item.nafdacNumber}</td>
                <td className="px-6 py-4 text-center">
                  <button onClick={() => handleAddContent(item)} className="glass-button-sm text-xs font-bold py-1 px-3 rounded-md flex items-center justify-center gap-2 mx-auto">
                    <FiPlus /> Add Content
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
    ) : (
       <table className="min-w-full text-sm text-left text-white/90">
          <thead className="bg-white/10 text-xs uppercase">
             <tr>
                <th scope="col" className="px-6 py-3">Drug Name</th>
                <th scope="col" className="px-6 py-3">NAFDAC Number</th>
                <th scope="col" className="px-6 py-3 text-center">Actions</th>
              </tr>
          </thead>
          <tbody>
            {content.map((video) => (
              <tr key={video.id} className="border-b border-white/10 hover:bg-white/5">
                <td className="px-6 py-4 font-bold">{video.drugName}</td>
                <td className="px-6 py-4 font-mono">{video.nafdacNumber}</td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center items-center space-x-4">
                    <button onClick={() => alert(`(Feature Pending) Edit video ID: ${video.id}`)} className="text-blue-300 hover:text-blue-200"><FiEdit size={18} /></button>
                    <button onClick={() => handleDelete(video.id)} className="text-red-400 hover:text-red-300"><FiTrash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
    );
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">{getPageTitle()}</h1>
      </div>
      <div className="glass-panel p-1">
        <div className="overflow-x-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default HealthAdvisorDashboardPage;