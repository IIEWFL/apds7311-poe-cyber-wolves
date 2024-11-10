import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const categories = ["Pending", "Technology", "Health", "Business", "Entertainment"];
const VALID_CURRENCIES = ['ZAR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'];

const VALIDATION_PATTERNS = {
    amount: /^\d+(\.\d{1,2})?$/,
    swiftCode: /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
    ibanPayee: /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/
};

function EditPost() {
    const [formData, setFormData] = useState(null); // Start with null to indicate no data loaded
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [validationErrors, setValidationErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();
    const { id } = useParams();

    // Fetch existing post data
    useEffect(() => {
        const fetchPost = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    setError('No authorization token found');
                    setLoading(false);
                    return;
                }

                const response = await axios.get(`/api/posts/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Set the form data with the fetched values
                setFormData({
                    amount: response.data.amount,
                    currency: response.data.currency || 'ZAR',
                    provider: response.data.provider || 'SWIFT',
                    swiftCode: response.data.swiftCode || '',
                    ibanPayee: response.data.ibanPayee || '',
                    category: response.data.category || categories[0]
                });
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load transaction details');
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [id]);

    const validateField = (name, value) => {
        switch (name) {
            case 'amount':
                const numValue = parseFloat(value);
                if (!VALIDATION_PATTERNS.amount.test(value) || numValue <= 0 || numValue > 1000000000) {
                    return 'Invalid amount. Must be between 0 and 1,000,000,000 with max 2 decimal places';
                }
                break;
            case 'swiftCode':
                if (!VALIDATION_PATTERNS.swiftCode.test(value)) {
                    return 'Invalid SWIFT code format';
                }
                break;
            case 'ibanPayee':
                if (!VALIDATION_PATTERNS.ibanPayee.test(value)) {
                    return 'Invalid IBAN format';
                }
                break;
            default:
                return '';
        }
        return '';
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        const error = validateField(name, value);
        setValidationErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSaving(true);

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error('No authorization token found');
            }

            await axios.patch(`/api/posts/${id}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate("/posts");
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update transaction');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading transaction details...</p>
                </div>
            </div>
        );
    }

    if (!formData) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <p className="text-red-600">Failed to load transaction details.</p>
                    <button 
                        onClick={() => navigate("/posts")}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Return to Transactions
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                        Edit Transaction
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Amount Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    required
                                    min="0.01"
                                    max="1000000000"
                                    step="0.01"
                                    className={`block w-full rounded-md border ${
                                        validationErrors.amount 
                                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                    } shadow-sm p-2`}
                                />
                                {validationErrors.amount && (
                                    <p className="mt-1 text-sm text-red-600">{validationErrors.amount}</p>
                                )}
                            </div>

                            {/* Currency Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Currency
                                </label>
                                <select
                                    name="currency"
                                    value={formData.currency}
                                    onChange={handleChange}
                                    className="block w-full rounded-md border border-gray-300 shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {VALID_CURRENCIES.map((curr) => (
                                        <option key={curr} value={curr}>{curr}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Provider Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Provider
                                </label>
                                <input
                                    type="text"
                                    value={formData.provider}
                                    readOnly
                                    className="block w-full rounded-md border border-gray-300 bg-gray-50 shadow-sm p-2"
                                />
                            </div>

                            {/* SWIFT Code Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    SWIFT Code
                                </label>
                                <input
                                    type="text"
                                    name="swiftCode"
                                    value={formData.swiftCode}
                                    onChange={handleChange}
                                    required
                                    maxLength={11}
                                    className={`block w-full rounded-md border ${
                                        validationErrors.swiftCode 
                                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                    } shadow-sm p-2`}
                                />
                                {validationErrors.swiftCode && (
                                    <p className="mt-1 text-sm text-red-600">{validationErrors.swiftCode}</p>
                                )}
                            </div>

                            {/* IBAN Field */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payee IBAN
                                </label>
                                <input
                                    type="text"
                                    name="ibanPayee"
                                    value={formData.ibanPayee}
                                    onChange={handleChange}
                                    required
                                    maxLength={34}
                                    className={`block w-full rounded-md border ${
                                        validationErrors.ibanPayee 
                                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                    } shadow-sm p-2`}
                                />
                                {validationErrors.ibanPayee && (
                                    <p className="mt-1 text-sm text-red-600">{validationErrors.ibanPayee}</p>
                                )}
                            </div>

                            {/* Category Field */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="block w-full rounded-md border border-gray-300 shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {categories.map((category) => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-50 p-4">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => navigate("/posts")}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving || Object.keys(validationErrors).some(key => validationErrors[key])}
                                className={`px-4 py-2 rounded-md text-white font-medium ${
                                    isSaving || Object.keys(validationErrors).some(key => validationErrors[key])
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                } transition-colors duration-200`}
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default EditPost;