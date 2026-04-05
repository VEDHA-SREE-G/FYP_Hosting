import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ExternalLink, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import Chatbot from '../components/Chatbot';

const AllSchemes = () => {
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/schemes?page=${currentPage}&limit=10&search=${searchQuery}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSchemes(data.schemes || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching schemes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, [currentPage, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b-4 border-orange-500 shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/user/home')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">All Available Schemes</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 flex-1">
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200">
           <p className="text-gray-600 mb-6">Browse all synced government welfare schemes available in the platform.</p>
           
           <div className="relative mb-8">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search schemes by name, ministry, or keywords..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium font-lg">Fetching schemes...</p>
            </div>
          ) : schemes.length === 0 ? (
             <div className="text-center py-12 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No schemes match your search criteria.</p>
             </div>
          ) : (
             <div className="space-y-6">
               {schemes.map(scheme => (
                 <div key={scheme.id} className="bg-white border rounded-lg p-6 hover:shadow-lg transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{scheme.scheme_name}</h3>
                        <p className="text-blue-600 text-sm font-medium">{scheme.ministry}</p>
                      </div>
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
                        {scheme.scheme_level || "National"} Level
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{scheme.description}</p>
                    <div className="flex justify-start">
                       <button
                         onClick={() => navigate(`/schemes/${scheme.id}`)}
                         className="px-4 py-2 bg-white text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-medium text-sm flex items-center gap-2"
                       >
                         View Details <ExternalLink className="w-4 h-4" />
                       </button>
                    </div>
                 </div>
               ))}

               {totalPages > 1 && (
                 <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <span className="text-sm font-medium text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                 </div>
               )}
             </div>
          )}
        </div>
      </main>
      <Chatbot />
    </div>
  );
};
export default AllSchemes;
