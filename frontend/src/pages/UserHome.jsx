import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Chatbot from '../components/Chatbot';
import UserAnalytics from '../components/UserAnalytics';

const UserHome = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalSchemes: 0,
    eligibleSchemes: 0,
    applicationCount: 0,
    profileComplete: false
  });
  const [featuredSchemes, setFeaturedSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Fetch Profile
        const profileRes = await fetch('http://localhost:5000/api/profile', { headers });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        }

        // Fetch Dashboard Stats
        const statsRes = await fetch('http://localhost:5000/api/schemes/stats', { headers });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setDashboardStats(statsData);
        }

        // Fetch Featured Schemes
        const featuredRes = await fetch('http://localhost:5000/api/schemes/featured', { headers });
        if (featuredRes.ok) {
          const featuredData = await featuredRes.json();
          setFeaturedSchemes(featuredData);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b-4 border-orange-500 shadow-sm">
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white py-1 px-4">
          <div className="max-w-7xl mx-auto flex justify-between text-xs">
            <span>भारत सरकार | Government of India</span>
            <span>User Dashboard</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                ₹
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">User Dashboard</h1>
                <p className="text-xs text-gray-600">Welcome, {profile?.name || 'User'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/user/analytics')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Analytics
              </button>
              <button
                onClick={() => navigate('/user/profile')}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
              >
                My Profile
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-orange-500 to-green-600 rounded-xl p-8 text-white mb-8 shadow-lg">
          <h2 className="text-3xl font-bold mb-2">Welcome to Your Dashboard!</h2>
          <p className="text-lg opacity-90">
            {loading ? 'Loading your personalized schemes...' : 'Explore government schemes tailored for you'}
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm font-semibold mb-2">Total Schemes</p>
            <p className="text-4xl font-bold text-blue-600">
              {loading ? '...' : dashboardStats.totalSchemes}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm font-semibold mb-2">Applications Submitted</p>
            <p className="text-4xl font-bold text-green-600">
              {loading ? '...' : dashboardStats.applicationCount}
            </p>
          </div>

          <div
            onClick={() => navigate('/user/schemes')}
            className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <p className="text-gray-600 text-sm font-semibold mb-2">Eligible Schemes</p>
            <p className="text-4xl font-bold text-orange-600">
              {loading ? '...' : dashboardStats.eligibleSchemes}
            </p>
            <p className="text-xs text-orange-500 mt-2 font-medium">Click to view all →</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <p className="text-gray-600 text-sm font-semibold mb-2">Profile Status</p>
            <p className={`text-lg font-bold ${dashboardStats.profileComplete ? 'text-green-600' : 'text-yellow-600'}`}>
              {loading ? '...' : (dashboardStats.profileComplete ? 'Complete' : 'Incomplete')}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/user/profile')}
              className={`p-6 border-2 rounded-lg transition-all text-left ${dashboardStats.profileComplete ? 'bg-green-50 border-green-200 hover:bg-green-100' : 'bg-orange-50 border-orange-200 hover:bg-orange-100'}`}
            >
              <div className="text-4xl mb-3">{dashboardStats.profileComplete ? '✅' : '👤'}</div>
              <h4 className="font-bold text-gray-800 mb-2">{dashboardStats.profileComplete ? 'Profile Complete' : 'Complete Profile'}</h4>
              <p className="text-sm text-gray-600">{dashboardStats.profileComplete ? 'Your preferences are set to discover perfect schemes.' : 'Update your information to find eligible schemes'}</p>
            </button>

            <button 
              onClick={() => navigate('/user/all-schemes')}
              className="p-6 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-all text-left"
            >
              <div className="text-4xl mb-3">🔍</div>
              <h4 className="font-bold text-gray-800 mb-2">Browse All Schemes</h4>
              <p className="text-sm text-gray-600">Explore {dashboardStats.totalSchemes > 0 ? `${dashboardStats.totalSchemes} available` : 'available'} government welfare schemes</p>
            </button>

            <button className="p-6 bg-purple-50 border-2 border-purple-200 rounded-lg hover:bg-purple-100 transition-all text-left">
              <div className="text-4xl mb-3">📋</div>
              <h4 className="font-bold text-gray-800 mb-2">Track Applications</h4>
              <p className="text-sm text-gray-600">{dashboardStats.applicationCount > 0 ? `You have ${dashboardStats.applicationCount} active application(s).` : 'Check status of your scheme applications'}</p>
            </button>
          </div>
        </div>

        {/* Featured Schemes */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">
            {dashboardStats.eligibleSchemes > 0 ? 'Top Matching Schemes For You' : 'Featured Schemes'}
          </h3>

          <div className="space-y-4">
            {loading ? (
              <p className="text-gray-500 text-center py-4">Loading schemes in real-time...</p>
            ) : featuredSchemes.length > 0 ? (
              featuredSchemes.map((scheme) => (
                <div key={scheme.id} className="p-5 border-2 border-gray-200 rounded-lg hover:border-orange-500 transition-all cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-800 mb-2">{scheme.scheme_name}</h4>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{scheme.description}</p>
                      <div className="flex space-x-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {scheme.ministry || 'Government Scheme'}
                        </span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {scheme.scheme_level || 'Central'}
                        </span>
                        {scheme.matchStatus && (
                          <span className={`px-3 py-1 text-xs rounded-full ${scheme.matchStatus === 'Eligible' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {scheme.matchScore ? `${scheme.matchScore.toFixed(0)}% Match` : scheme.matchStatus}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/schemes/${scheme.id}`)}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold text-sm whitespace-nowrap ml-4"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No schemes found at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm">© 2025 Government of India. All rights reserved.</p>
        </div>
      </footer>
      <Chatbot />
    </div>
  );
};

export default UserHome;