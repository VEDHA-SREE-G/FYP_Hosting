import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  RefreshCw, 
  LogOut, 
  Users, 
  FileText, 
  BarChart3, 
  AlertTriangle,
  CheckCircle2,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  AlertCircle,
  Building2,
  Globe,
  Copy,
  TrendingUp
} from 'lucide-react';
import AdminAnalytics from '../components/AdminAnalytics';

const AdminHome = () => {
  const navigate = useNavigate();
  const [suspiciousProfiles, setSuspiciousProfiles] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schemesLoading, setSchemesLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSchemes: 0,
    applicationsToday: 0,
    suspiciousCount: 0
  });
  
  // Scheme management states
  const [showSchemeModal, setShowSchemeModal] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // 'view', 'edit'
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [schemeFormData, setSchemeFormData] = useState({
    scheme_name: '',
    ministry: '',
    description: '',
    eligibility: '',
    benefits: '',
    application_process: '',
    documents_required: '',
    scheme_level: '',
    scheme_url: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchSuspiciousProfiles();
    fetchSchemes();
  }, []);

  useEffect(() => {
    fetchSchemes();
  }, [currentPage, searchQuery]);

  const fetchSuspiciousProfiles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profile/suspicious', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const profilesArray = Array.isArray(data) ? data : [];
        setSuspiciousProfiles(profilesArray);
        setStats(prev => ({ ...prev, suspiciousCount: profilesArray.length }));
      } else {
        showMessage('error', 'Failed to fetch suspicious profiles');
        setSuspiciousProfiles([]);
      }
    } catch (error) {
      showMessage('error', 'Network error occurred');
      console.error('Error fetching suspicious profiles:', error);
      setSuspiciousProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchemes = async () => {
    try {
      setSchemesLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/schemes?page=${currentPage}&limit=10&search=${searchQuery}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSchemes(data.schemes || []);
        setTotalPages(data.totalPages || 1);
        setStats(prev => ({ ...prev, activeSchemes: data.total || 0 }));
      } else {
        showMessage('error', 'Failed to fetch schemes');
        setSchemes([]);
      }
    } catch (error) {
      showMessage('error', 'Network error occurred');
      console.error('Error fetching schemes:', error);
      setSchemes([]);
    } finally {
      setSchemesLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const handleReview = async (userId, action) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profile/review', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, action })
      });

      if (response.ok) {
        showMessage('success', `Profile ${action}ed successfully!`);
        fetchSuspiciousProfiles();
      } else {
        showMessage('error', 'Review action failed');
      }
    } catch (error) {
      showMessage('error', 'Network error occurred');
      console.error('Error reviewing profile:', error);
    }
  };

  const handleViewScheme = (scheme) => {
    setSelectedScheme(scheme);
    setModalMode('view');
    setShowSchemeModal(true);
  };

  const handleEditScheme = (scheme) => {
    setSelectedScheme(scheme);
    setSchemeFormData({
      scheme_name: scheme.scheme_name || '',
      ministry: scheme.ministry || '',
      description: scheme.description || '',
      eligibility: scheme.eligibility || '',
      benefits: scheme.benefits || '',
      application_process: scheme.application_process || '',
      documents_required: scheme.documents_required || '',
      scheme_level: scheme.scheme_level || '',
      scheme_url: scheme.scheme_url || ''
    });
    setModalMode('edit');
    setShowSchemeModal(true);
  };

  const handleDeleteScheme = async (schemeId) => {
    if (!window.confirm('Are you sure you want to delete this scheme?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/schemes/${schemeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showMessage('success', 'Scheme deleted successfully!');
        fetchSchemes();
      } else {
        showMessage('error', 'Failed to delete scheme');
      }
    } catch (error) {
      showMessage('error', 'Network error occurred');
      console.error('Error deleting scheme:', error);
    }
  };

  const handleSaveScheme = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/schemes/${selectedScheme.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(schemeFormData)
      });

      if (response.ok) {
        showMessage('success', 'Scheme updated successfully!');
        setShowSchemeModal(false);
        fetchSchemes();
        resetSchemeForm();
      } else {
        showMessage('error', 'Failed to update scheme');
      }
    } catch (error) {
      showMessage('error', 'Network error occurred');
      console.error('Error saving scheme:', error);
    }
  };

  const handleSyncSchemes = async () => {
    try {
      setSyncing(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/schemes/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showMessage('success', 'Schemes synced successfully from scraper!');
        fetchSchemes();
      } else {
        showMessage('error', 'Failed to sync schemes');
      }
    } catch (error) {
      showMessage('error', 'Network error occurred');
      console.error('Error syncing schemes:', error);
    } finally {
      setSyncing(false);
    }
  };

  const resetSchemeForm = () => {
    setSchemeFormData({
      scheme_name: '',
      ministry: '',
      description: '',
      eligibility: '',
      benefits: '',
      application_process: '',
      documents_required: '',
      scheme_level: '',
      scheme_url: ''
    });
    setSelectedScheme(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b-4 border-green-600 shadow-sm">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-1 px-4">
          <div className="max-w-7xl mx-auto flex justify-between text-xs">
            <span>Government of India</span>
            <span>Admin Control Panel</span>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
                <p className="text-xs text-gray-600">System Administration & Monitoring</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/admin/analytics')}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold flex items-center gap-2"
              >
                Analytics
              </button>
              <button
                onClick={fetchSuspiciousProfiles}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Alert Messages */}
      {message.text && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className={`p-4 rounded-lg border-l-4 ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-500 text-green-800' 
              : 'bg-red-50 border-red-500 text-red-800'
          }`}>
            <p className="font-medium">{message.text}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-2">Total Users</p>
                <p className="text-4xl font-bold text-blue-600">{stats.totalUsers}</p>
                <p className="text-xs text-gray-500 mt-2">Active platform users</p>
              </div>
              <Users className="w-12 h-12 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-2">Active Schemes</p>
                <p className="text-4xl font-bold text-green-600">{stats.activeSchemes}</p>
                <p className="text-xs text-gray-500 mt-2">Total in database</p>
              </div>
              <FileText className="w-12 h-12 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-2">Applications Today</p>
                <p className="text-4xl font-bold text-orange-600">{stats.applicationsToday}</p>
                <p className="text-xs text-gray-500 mt-2">Applications submitted today</p>
              </div>
              <BarChart3 className="w-12 h-12 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-2">Suspicious Profiles</p>
                <p className="text-4xl font-bold text-red-600">{stats.suspiciousCount}</p>
                <p className="text-xs text-gray-500 mt-2">Requires attention</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
          </div>
        </div>

        {/* Schemes Management Section */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-8 h-8" />
                  <h3 className="text-2xl font-bold">Schemes Management</h3>
                </div>
                <p className="text-sm opacity-90">View, edit, and manage government schemes</p>
              </div>
              <button
                onClick={handleSyncSchemes}
                disabled={syncing}
                className="px-6 py-3 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition-colors font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {syncing ? (
                  <>
                    <div className="w-5 h-5 border-3 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    <span>Sync Schemes</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Search Bar */}
            <div className="mb-6 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search schemes by name, ministry, or description..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
              />
            </div>

            {schemesLoading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg font-medium">Loading schemes...</p>
              </div>
            ) : schemes.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                <h4 className="text-2xl font-bold text-gray-800 mb-2">No Schemes Found</h4>
                <p className="text-gray-600 mb-4">Click "Sync Schemes" to fetch schemes from the scraper</p>
                <button
                  onClick={handleSyncSchemes}
                  disabled={syncing}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  {syncing ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      <span>Sync Schemes Now</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Scheme Name</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Ministry</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Level</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Created</th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {schemes.map((scheme) => (
                        <tr key={scheme.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="font-semibold text-gray-900 text-sm">
                              {scheme.scheme_name || 'Unnamed Scheme'}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {scheme.description?.substring(0, 60)}...
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700">
                            {scheme.ministry || 'N/A'}
                          </td>
                          <td className="px-4 py-4">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                              {scheme.scheme_level || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {new Date(scheme.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => handleViewScheme(scheme)}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-semibold transition-colors shadow flex items-center gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </button>
                              <button
                                onClick={() => handleEditScheme(scheme)}
                                className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-xs font-semibold transition-colors shadow flex items-center gap-1"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteScheme(scheme.id)}
                                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-semibold transition-colors shadow flex items-center gap-1"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-6">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    <span className="text-sm text-gray-600 font-medium">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Suspicious Profiles Section */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-8 h-8" />
                  <h3 className="text-2xl font-bold">Suspicious Activity Monitor</h3>
                </div>
                <p className="text-sm opacity-90">Review and manage flagged user profiles</p>
              </div>
              <div>
                {stats.suspiciousCount > 0 ? (
                  <AlertCircle className="w-12 h-12" />
                ) : (
                  <CheckCircle2 className="w-12 h-12" />
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg font-medium">Loading suspicious profiles...</p>
              </div>
            ) : suspiciousProfiles.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle2 className="w-24 h-24 text-green-500 mx-auto mb-4" />
                <h4 className="text-2xl font-bold text-gray-800 mb-2">No Suspicious Activity Detected</h4>
                <p className="text-gray-600">All user profiles are verified and clean</p>
                <button
                  onClick={fetchSuspiciousProfiles}
                  className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2 mx-auto"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Status
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                  <p className="text-sm text-yellow-800 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <strong>Action Required:</strong> {suspiciousProfiles.length} profile{suspiciousProfiles.length > 1 ? 's' : ''} flagged for review.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">User ID</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Flags</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Applications</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {suspiciousProfiles.map((profile) => (
                        <tr key={profile.userId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 text-sm font-mono text-gray-700">
                            #{profile.userId}
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                            {profile.name || 'N/A'}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1">
                              {profile.duplicateProfile && (
                                <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full flex items-center gap-1">
                                  <Copy className="w-3 h-3" />
                                  Duplicate
                                </span>
                              )}
                              {profile.identityMismatch && (
                                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  ID Mismatch
                                </span>
                              )}
                              {profile.applicationCount > 3 && (
                                <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  High Activity
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm font-bold text-gray-700">
                            {profile.applicationCount}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleReview(profile.userId, 'approve')}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold transition-colors shadow flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleReview(profile.userId, 'reject')}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold transition-colors shadow flex items-center gap-1"
                              >
                                <X className="w-4 h-4" />
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Scheme Modal */}
      {showSchemeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className={`p-6 text-white ${
              modalMode === 'view' ? 'bg-gradient-to-r from-blue-600 to-blue-700' :
              'bg-gradient-to-r from-yellow-600 to-orange-600'
            }`}>
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  {modalMode === 'view' ? (
                    <>
                      <Eye className="w-6 h-6" />
                      View Scheme
                    </>
                  ) : (
                    <>
                      <Edit className="w-6 h-6" />
                      Edit Scheme
                    </>
                  )}
                </h3>
                <button
                  onClick={() => setShowSchemeModal(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {modalMode === 'view' ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Scheme Name</h4>
                    <p className="text-gray-900">{selectedScheme?.scheme_name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Ministry</h4>
                    <p className="text-gray-900">{selectedScheme?.ministry || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Level</h4>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                      {selectedScheme?.scheme_level || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Description</h4>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedScheme?.description || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Eligibility</h4>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedScheme?.eligibility || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Benefits</h4>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedScheme?.benefits || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Application Process</h4>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedScheme?.application_process || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Documents Required</h4>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedScheme?.documents_required || 'N/A'}</p>
                  </div>
                  {selectedScheme?.scheme_url && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 mb-2">Scheme URL</h4>
                      <a 
                        href={selectedScheme.scheme_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {selectedScheme.scheme_url}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Scheme Name *</label>
                    <input
                      type="text"
                      value={schemeFormData.scheme_name}
                      onChange={(e) => setSchemeFormData({...schemeFormData, scheme_name: e.target.value})}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Ministry</label>
                    <input
                      type="text"
                      value={schemeFormData.ministry}
                      onChange={(e) => setSchemeFormData({...schemeFormData, ministry: e.target.value})}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Scheme Level</label>
                    <select
                      value={schemeFormData.scheme_level}
                      onChange={(e) => setSchemeFormData({...schemeFormData, scheme_level: e.target.value})}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                    >
                      <option value="">Select Level</option>
                      <option value="Central">Central</option>
                      <option value="State">State</option>
                      <option value="District">District</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                    <textarea
                      value={schemeFormData.description}
                      onChange={(e) => setSchemeFormData({...schemeFormData, description: e.target.value})}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                      rows="4"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Eligibility</label>
                    <textarea
                      value={schemeFormData.eligibility}
                      onChange={(e) => setSchemeFormData({...schemeFormData, eligibility: e.target.value})}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Benefits</label>
                    <textarea
                      value={schemeFormData.benefits}
                      onChange={(e) => setSchemeFormData({...schemeFormData, benefits: e.target.value})}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Application Process</label>
                    <textarea
                      value={schemeFormData.application_process}
                      onChange={(e) => setSchemeFormData({...schemeFormData, application_process: e.target.value})}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Documents Required</label>
                    <textarea
                      value={schemeFormData.documents_required}
                      onChange={(e) => setSchemeFormData({...schemeFormData, documents_required: e.target.value})}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Scheme URL</label>
                    <input
                      type="url"
                      value={schemeFormData.scheme_url}
                      onChange={(e) => setSchemeFormData({...schemeFormData, scheme_url: e.target.value})}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => setShowSchemeModal(false)}
                      className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveScheme}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Update Scheme
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm">© 2025 Government of India - Admin Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default AdminHome;