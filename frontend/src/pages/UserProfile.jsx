import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    gender: '',
    income: '',
    occupation: '',
    state: '',
    district: '',
    category: '',
    disability: false,
    farmer: false,
    student: false,
    widow: false,
    seniorCitizen: false,
    applicationCount: 0,
    profileComplete: false
  });

  const [user, setUser] = useState({ email: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  const categories = ['General', 'OBC', 'SC', 'ST'];
  const genders = ['Male', 'Female', 'Other'];

  useEffect(() => {
    fetchProfile();
  }, []);

  const getToken = () => localStorage.getItem('token');

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      // ✅ CORRECT URL
      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data) {
          setProfile(data);
        }
        
        // Decode token to get user email
        const token = getToken();
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUser({ email: payload.email || 'user@example.com' });
          } catch (e) {
            console.error('Token decode error:', e);
          }
        }
      } else {
        const errorData = await response.json();
        showMessage('error', errorData.error || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
      showMessage('error', 'Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setProfile(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Auto-save after 2 seconds
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    setAutoSaveTimer(setTimeout(() => autoSave({ [name]: newValue }), 2000));
  };

  const autoSave = async (updates) => {
    try {
      // ✅ CORRECT URL
      const response = await fetch('http://localhost:5000/api/profile/autosave', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        console.log('Auto-saved successfully');
        // Don't show message for auto-save to avoid spam
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  };

  const handleSubmit = async () => {
    // Client-side validations for mandatory fields
    if (!profile.name || !profile.age || !profile.gender || profile.income === '' || !profile.occupation || !profile.state || !profile.district || !profile.category) {
      showMessage('error', 'Please fill all mandatory fields marked with *');
      return;
    }
    
    // Constraints
    if (Number(profile.age) <= 0 || Number(profile.age) > 120) {
      showMessage('error', 'Age must be a valid number greater than 0 and up to 120');
      return;
    }
    if (Number(profile.income) < 0) {
      showMessage('error', 'Income cannot be negative');
      return;
    }

    setLoading(true);

    try {
      // ✅ CORRECT URL
      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('success', 'Profile updated successfully! ✓');
        setIsEditing(false);
        fetchProfile(); // Refresh profile data
      } else {
        showMessage('error', data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      showMessage('error', 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  if (loading && !profile.name) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg font-medium">Loading Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Government Header */}
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
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                ₹
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Profile Dashboard</h1>
                <p className="text-sm text-gray-600">योजना पोर्टल - Manage your information</p>
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
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <p className="text-sm text-gray-600">
            Home / User Dashboard / <span className="text-orange-600 font-semibold">My Profile</span>
          </p>
        </div>
      </div>

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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="bg-gradient-to-r from-orange-500 to-green-600 p-6 text-white text-center">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-4xl font-bold text-orange-600 shadow-lg">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <h2 className="text-xl font-bold">{profile.name || 'User Name'}</h2>
                <p className="text-sm mt-1 opacity-90">{user.email}</p>
              </div>
              
              <div className="p-4">
                <div className="bg-orange-50 rounded-lg p-4 mb-4 border border-orange-200">
                  <p className="text-xs text-orange-800 font-semibold mb-2">APPLICATION STATUS</p>
                  <p className="text-3xl font-bold text-orange-600">{profile.applicationCount || 0}</p>
                  <p className="text-xs text-gray-600 mt-1">Schemes Applied</p>
                </div>

                <div className="space-y-2">
                  <div className={`flex items-center justify-between p-3 rounded ${profile.profileComplete ? 'bg-green-50' : 'bg-yellow-50'}`}>
                    <span className="text-sm font-medium text-gray-700">Profile Status</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${profile.profileComplete ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                      {profile.profileComplete ? 'Complete' : 'Incomplete'}
                    </span>
                  </div>

                  {profile.student && (
                    <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded text-sm">
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      <span className="text-blue-800 font-medium">Student</span>
                    </div>
                  )}
                  
                  {profile.farmer && (
                    <div className="flex items-center space-x-2 p-2 bg-green-50 rounded text-sm">
                      <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                      <span className="text-green-800 font-medium">Farmer</span>
                    </div>
                  )}
                  
                  {profile.seniorCitizen && (
                    <div className="flex items-center space-x-2 p-2 bg-purple-50 rounded text-sm">
                      <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                      <span className="text-purple-800 font-medium">Senior Citizen</span>
                    </div>
                  )}

                  {profile.disability && (
                    <div className="flex items-center space-x-2 p-2 bg-indigo-50 rounded text-sm">
                      <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                      <span className="text-indigo-800 font-medium">PWD</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Profile Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md border border-gray-200">
              <div className="bg-gradient-to-r from-orange-500 to-green-600 p-6 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold">Personal Information</h3>
                    <p className="text-sm mt-1 opacity-90">Update your profile details for scheme eligibility</p>
                  </div>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-5 py-2 bg-white text-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-semibold shadow"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-5 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold shadow"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={profile.name || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                    />
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Age <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={profile.age || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter age"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="gender"
                      value={profile.gender || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                    >
                      <option value="">Select Gender</option>
                      {genders.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  {/* Annual Income */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Annual Income (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="income"
                      value={profile.income || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter annual income"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                    />
                  </div>

                  {/* Occupation */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Occupation <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="occupation"
                      value={profile.occupation || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter occupation"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                    />
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      State <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="state"
                      value={profile.state || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                    >
                      <option value="">Select State</option>
                      {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* District */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      District <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="district"
                      value={profile.district || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter district"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={profile.category || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Eligibility Checkboxes Section */}
                <div className="mt-8 pt-6 border-t-2 border-gray-200">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">🎯 Scheme Eligibility Criteria</h4>
                  <p className="text-sm text-gray-600 mb-4">Select all that apply to find schemes you're eligible for</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { name: 'student', label: 'Student', color: 'blue', icon: '🎓' },
                      { name: 'farmer', label: 'Farmer', color: 'green', icon: '🌾' },
                      { name: 'disability', label: 'Person with Disability', color: 'indigo', icon: '♿' },
                      { name: 'widow', label: 'Widow', color: 'pink', icon: '👤' },
                      { name: 'seniorCitizen', label: 'Senior Citizen (60+)', color: 'purple', icon: '👴' }
                    ].map(item => (
                      <label 
                        key={item.name} 
                        className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          profile[item.name] 
                            ? `bg-${item.color}-50 border-${item.color}-500` 
                            : 'bg-white border-gray-300 hover:border-gray-400'
                        } ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="checkbox"
                          name={item.name}
                          checked={profile[item.name] || false}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <span className="text-2xl">{item.icon}</span>
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                {isEditing && (
                  <div className="mt-8 flex justify-end space-x-4">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-orange-500 to-green-600 text-white rounded-lg hover:from-orange-600 hover:to-green-700 transition-all font-semibold shadow-lg disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm">© 2025 Government of India. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default UserProfile;