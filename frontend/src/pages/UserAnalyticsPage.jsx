import React from 'react';
import { useNavigate } from 'react-router-dom';
import UserAnalytics from '../components/UserAnalytics';
import Chatbot from '../components/Chatbot';

const UserAnalyticsPage = () => {
  const navigate = useNavigate();

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
            <span>Analytics Dashboard</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                📊
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">My Analytics</h1>
                <p className="text-xs text-gray-600">Personalized Insights</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/user/home')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Dashboard
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
        <UserAnalytics />
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

export default UserAnalyticsPage;
