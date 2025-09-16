import React, { useState, useEffect } from 'react';
import api from '../api';

const SystemSettings = () => {
    const [universalWarningText, setUniversalWarningText] = useState('');
    const [universalWarningVideoUrl, setUniversalWarningVideoUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const response = await api.get('/api/admin/settings');
                setUniversalWarningText(response.data.universalWarningText || '');
                setUniversalWarningVideoUrl(response.data.universalWarningVideoUrl || '');
            } catch (err) {
                console.error('Error fetching settings:', err);
                setError('Failed to load settings.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setError('');
        try {
            await api.post('/api/admin/settings', {
                universalWarningText,
                universalWarningVideoUrl,
            });
            setMessage('Settings updated successfully!');
        } catch (err) {
            console.error('Error updating settings:', err);
            setError('Failed to update settings.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Universal Warning Settings</h2>
            <p className="mb-6 text-sm text-gray-600">
                This content will be shown to users when they scan a product code that is determined to be counterfeit or invalid.
            </p>
            
            {message && <div className="mb-4 text-center p-3 bg-green-100 text-green-800 rounded-md">{message}</div>}
            {error && <div className="mb-4 text-center p-3 bg-red-100 text-red-800 rounded-md">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="universalWarningText" className="block text-sm font-medium text-gray-700 mb-1">
                        Warning Message
                    </label>
                    <textarea
                        id="universalWarningText"
                        rows="4"
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={universalWarningText}
                        onChange={(e) => setUniversalWarningText(e.target.value)}
                        placeholder="e.g., Warning: This product could not be verified. It may be counterfeit."
                        disabled={isLoading}
                    />
                </div>

                <div className="mb-6">
                    <label htmlFor="universalWarningVideoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                        Warning Video URL
                    </label>
                    <input
                        type="url"
                        id="universalWarningVideoUrl"
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={universalWarningVideoUrl}
                        onChange={(e) => setUniversalWarningVideoUrl(e.target.value)}
                        placeholder="https://example.com/warning-video.mp4"
                        disabled={isLoading}
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 transition duration-150 ease-in-out"
                    >
                        {isLoading ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SystemSettings;