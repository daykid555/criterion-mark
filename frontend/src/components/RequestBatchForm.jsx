import { useState } from 'react'; // Import useState to manage form inputs
import axios from 'axios'; // Import axios for making API requests
import apiClient from '../api';

function RequestBatchForm({ onSuccess }) {
  // --- STATE ---
  // Create state variables to hold the values from the input fields
  const [drugName, setDrugName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [nafdacNumber, setNafdacNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // --- HANDLERS ---
  // This function is called when the form is submitted
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents the browser from reloading
    setIsLoading(true); // Show loading state on the button
    setMessage(null);   // Clear any previous messages

    try {
      // The data we want to send to the backend
      const requestData = {
        drugName: drugName,
        quantity: quantity,
        expirationDate: expirationDate,
        nafdacNumber: nafdacNumber,
      };

      // Use axios to send a POST request to our backend API
      const response = await apiClient.post('/api/batches', requestData);
      
      // If successful, show a success message and clear the form
      setMessage({ type: 'success', text: `Successfully created batch ID: ${response.data.id}` });
      setDrugName('');
      setQuantity('');
      setExpirationDate('');
      setNafdacNumber('');
      if (onSuccess) onSuccess();

    } catch (error) {
      // If there's an error, show an error message
      const errorText = error.response?.data?.error || 'An unexpected error occurred.';
      setMessage({ type: 'error', text: errorText });
    } finally {
      setIsLoading(false); // Hide loading state
    }
  };

  // --- JSX ---
  return (
    // The form container no longer needs its own panel styles
    <div className="w-full max-w-2xl text-white">
      <h2 className="text-2xl font-bold mb-6">Request New Batch of Seals</h2>
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Drug Name Input */}
          <div>
            <label htmlFor="drugName" className="block text-sm font-medium mb-1 opacity-80">Drug Name</label>
            <input
              type="text"
              id="drugName"
              className="w-full px-4 py-3 glass-input" // <-- USE NEW CLASS
              placeholder="e.g., Paracetamol 500mg"
              required
              value={drugName}
              onChange={(e) => setDrugName(e.target.value)}
            />
          </div>

          {/* Quantity Input */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium mb-1 opacity-80">Quantity</label>
            <input type="number" id="quantity" className="w-full px-4 py-3 glass-input" placeholder="e.g., 10000" required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>

          {/* Expiration Date Input */}
          <div>
            <label htmlFor="expirationDate" className="block text-sm font-medium mb-1 opacity-80">Expiration Date</label>
            <input type="date" id="expirationDate" className="w-full px-4 py-3 glass-input" required value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} />
          </div>

          {/* NAFDAC Number Input */}
          <div>
            <label htmlFor="nafdacNumber" className="block text-sm font-medium mb-1 opacity-80">NAFDAC Registration Number</label>
            <input type="text" id="nafdacNumber" className="w-full px-4 py-3 glass-input" placeholder="e.g., A4-1234" required value={nafdacNumber} onChange={(e) => setNafdacNumber(e.target.value)} />
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full font-bold py-3 px-4 rounded-lg glass-button" // <-- USE NEW CLASS
          >
            {isLoading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>

      {/* Message Area */}
      {message && (
         <div className={`mt-4 p-4 rounded-lg text-sm ${message.type === 'success' ? 'glass-panel text-green-200' : 'glass-panel text-red-200'}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

export default RequestBatchForm;