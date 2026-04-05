import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const EligibleSchemes = () => {
    const navigate = useNavigate();
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEligibleSchemes();
    }, []);

    const fetchEligibleSchemes = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/schemes/eligible', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSchemes(data);
            }
        } catch (error) {
            console.error('Error fetching eligible schemes:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b-4 border-orange-500 shadow-sm sticky top-0 z-10">
                <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white py-1 px-4">
                    <div className="max-w-7xl mx-auto flex justify-between text-xs">
                        <span>भारत सरकार | Government of India</span>
                        <span>Scheme Portal</span>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 cursor-pointer" onClick={() => navigate('/user/home')}>
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                ₹
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-800">User Dashboard</h1>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/user/home')}
                            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                        >
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">Your Eligible Schemes</h2>
                        <p className="text-gray-600 mt-2">Schemes matching your profile criteria</p>
                    </div>
                    <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full font-bold">
                        {schemes.length} Schemes Found
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Finding best schemes for you...</p>
                    </div>
                ) : schemes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {schemes.map((scheme) => (
                            <div key={scheme.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow border border-gray-100 flex flex-col h-full">
                                <div className="p-6 flex-grow">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-3 py-1 text-xs rounded-full font-semibold ${scheme.matchScore >= 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {scheme.matchScore ? `${scheme.matchScore.toFixed(0)}% Match` : 'Eligible'}
                                        </span>
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                            {scheme.scheme_level || 'Central'}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2" title={scheme.scheme_name}>
                                        {scheme.scheme_name}
                                    </h3>

                                    <p className="text-sm text-blue-600 mb-4 font-medium">
                                        {scheme.ministry}
                                    </p>

                                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                        {scheme.description}
                                    </p>

                                    {/* Match Details Preview */}
                                    {scheme.matchDetails && (
                                        <div className="space-y-3">
                                            {/* Strong Matches */}
                                            {Object.entries(scheme.matchDetails).filter(([_, d]) => d.score === 1).length > 0 && (
                                                <div>
                                                    <p className="text-xs font-semibold text-green-700 mb-1 uppercase">✅ Matched Criteria:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {Object.entries(scheme.matchDetails)
                                                            .filter(([_, detail]) => detail.score === 1)
                                                            .map(([key, detail]) => (
                                                                <span key={key} title={detail.reason} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200 cursor-help">
                                                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                                                </span>
                                                            ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Partial / Near Matches */}
                                            {Object.entries(scheme.matchDetails).filter(([_, d]) => d.score > 0 && d.score < 1).length > 0 && (
                                                <div>
                                                    <p className="text-xs font-semibold text-yellow-700 mb-1 uppercase">⚠️ Partial / Near Matches:</p>
                                                    <div className="flex flex-col gap-1">
                                                        {Object.entries(scheme.matchDetails)
                                                            .filter(([_, detail]) => detail.score > 0 && detail.score < 1)
                                                            .map(([key, detail]) => (
                                                                <span key={key} className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-200">
                                                                    {key.charAt(0).toUpperCase() + key.slice(1)}: {detail.reason}
                                                                </span>
                                                            ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Missed / Negative Matches (Only show if relevant/weighted) */}
                                            {Object.entries(scheme.matchDetails).filter(([_, d]) => d.score === 0 && d.weight > 0).length > 0 && (
                                                <div>
                                                    <p className="text-xs font-semibold text-red-700 mb-1 uppercase">❌ Missing Criteria:</p>
                                                    <div className="flex flex-col gap-1">
                                                        {Object.entries(scheme.matchDetails)
                                                            .filter(([_, detail]) => detail.score === 0 && detail.weight > 0)
                                                            .map(([key, detail]) => (
                                                                <span key={key} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded border border-red-200">
                                                                    {key.charAt(0).toUpperCase() + key.slice(1)}: {detail.reason || 'Did not meet criteria'}
                                                                </span>
                                                            ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-gray-50 border-t border-gray-100 mt-auto">
                                    <button
                                        onClick={() => navigate(`/schemes/${scheme.id}`)}
                                        className="w-full py-2 bg-white border-2 border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 font-bold transition-colors"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow p-12 text-center">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No Matching Schemes Found</h3>
                        <p className="text-gray-600 mb-6">Try updating your profile with more details to find relevant schemes.</p>
                        <button
                            onClick={() => navigate('/user/profile')}
                            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold"
                        >
                            Update Profile
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default EligibleSchemes;