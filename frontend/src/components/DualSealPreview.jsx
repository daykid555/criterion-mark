import React, { useState, useEffect } from 'react';
import apiClient from '../api';

const DualSealPreview = ({ code }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!code) {
            setIsLoading(false);
            setError('No code selected for preview.');
            return;
        }

        let isMounted = true;
        const fetchImage = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await apiClient.get(`/api/printing/seal/${code}`,
                {
                    responseType: 'blob'
                });
                if (isMounted) {
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    setImageUrl(url);
                }
            } catch (err) {
                if (isMounted) {
                    setError('Could not load seal preview.');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchImage();

        return () => {
            isMounted = false;
            if (imageUrl) {
                window.URL.revokeObjectURL(imageUrl);
            }
        };
    }, [code]);

    if (isLoading) return <p className="text-white/60">Loading preview...</p>;
    if (error) return <p className="text-red-400">{error}</p>;

    return imageUrl ? <img src={imageUrl} alt={`Seal preview for ${code}`} className="rounded-lg border-2 border-gray-700" /> : <p className="text-white/60">Select a code to see the preview.</p>;
};

export default DualSealPreview;
