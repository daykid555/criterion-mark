import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Your existing icon fix (this is correct)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function AdminMapPage() {
  const [scans, setScans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 100);
    }
  }, [scans]);

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const response = await apiClient.get('/api/admin/scans');
        const validScans = response.data.filter(scan => scan.latitude && scan.longitude);
        setScans(validScans);
      } catch (err) {
        setError('Failed to load scan data.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchScans();
  }, []);

  const mapCenter = [9.0765, 8.6753];

  if (isLoading) {
    return <p className="text-white text-center">Loading map data...</p>;
  }

  if (error) {
    return <p className="text-red-400 text-center">{error}</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-4xl font-bold text-white drop-shadow-lg">Scan Location Map</h1>
        <Link to="/admin/dashboard" className="text-white/80 hover:text-white transition-colors">
          ← Back to Dashboard
        </Link>
      </div>
      
      <div className="glass-panel p-2 h-[70vh] w-full">
        {scans.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-white/70">No scan location data available to display.</p>
          </div>
        ) : (
          <MapContainer 
            center={mapCenter} 
            zoom={6} 
            scrollWheelZoom={true} 
            className="h-full w-full rounded-xl"
            ref={mapRef}
          >
            <TileLayer
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {scans.map((scan) => (
              <Marker key={scan.id} position={[scan.latitude, scan.longitude]}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold">{scan.qrCode?.batch?.drugName || 'Unknown Product'}</p>
                    <p>By: {scan.qrCode?.batch?.manufacturer?.companyName || 'Unknown Manufacturer'}</p>
                    <hr className="my-1"/>
                    <p>Scanned: {new Date(scan.scannedAt).toLocaleString()}</p>
                    
                    {/* --- THIS IS THE FIX --- */}
                    {/* It now displays the precise fullAddress and falls back gracefully */}
                    <p><strong>Location:</strong> {scan.fullAddress || `${scan.city || 'N/A'}, ${scan.country || 'N/A'}`}</p>
                    {/* --- END OF FIX --- */}

                    <p>IP: {scan.ipAddress}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}

export default AdminMapPage;