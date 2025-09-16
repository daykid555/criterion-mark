import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import toast from 'react-hot-toast';

const AdminUniversalWarningPage = () => {
    const [universalWarningText, setUniversalWarningText] = useState('');
    const [universalWarningVideoUrl, setUniversalWarningVideoUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const response = await apiClient.get('/api/admin/settings');
                setUniversalWarningText(response.data.universalWarningText || '');
                setUniversalWarningVideoUrl(response.data.universalWarningVideoUrl || '');
            } catch (err) {
                console.error('Error fetching settings:', err);
                toast.error('Failed to load universal warning settings.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await apiClient.post('/api/admin/settings', {
                universalWarningText,
                universalWarningVideoUrl,
            });
            toast.success('Universal warning settings updated successfully!');
        } catch (err) {
            console.error('Error updating settings:', err);
            toast.error('Failed to update universal warning settings.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="glass-panel p-6 sm:p-8 lg:p-10 w-full h-full flex flex-col">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Universal Warning Settings</h2>
            <p className="mb-6 text-sm text-white/80">
                This content will be shown to users when they scan a product code that is determined to be counterfeit or invalid.
            </p>
            
            {isLoading ? (
                <div className="flex-grow flex items-center justify-center">
                    <p className="text-white">Loading settings...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
                    <div className="mb-4 flex-grow">
                        <label htmlFor="universalWarningText" className="block text-sm font-medium text-white/80 mb-1">
                            Warning Message
                        </label>
                        <textarea
                            id="universalWarningText"
                            rows="6"
                            className="glass-input w-full px-3 py-2 text-base h-full"
                            value={universalWarningText}
                            onChange={(e) => setUniversalWarningText(e.target.value)}
                            placeholder="e.g., Warning: This product could not be verified. It may be counterfeit."
                            disabled={isSaving}
                        ></textarea>
                    </div>

                    <div className="mb-6">
                        <label htmlFor="universalWarningVideoUrl" className="block text-sm font-medium text-white/80 mb-1">
                            Warning Video URL
                        </label>
                        <input
                            type="url"
                            id="universalWarningVideoUrl"
                            className="glass-input w-full px-3 py-2 text-base"
                            value={universalWarningVideoUrl}
                            onChange={(e) => setUniversalWarningVideoUrl(e.target.value)}
                            placeholder="https://example.com/warning-video.mp4"
                            disabled={isSaving}
                        />
                    </div>

                    <div className="flex justify-end mt-auto">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="glass-button font-bold py-2 px-4 rounded-lg"
                        >
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default AdminUniversalWarningPage;
