import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import UserLogin from './pages/UserLogin';
import UserRegister from './pages/UserRegister';
import UserHome from './pages/UserHome';
import UserProfile from './pages/UserProfile';
import UserAnalyticsPage from './pages/UserAnalyticsPage';
import AllSchemes from './pages/AllSchemes';
import EligibleSchemes from './pages/EligibleSchemes';
import SchemeDetail from './pages/SchemeDetail';
import AdminLogin from './pages/AdminLogin';
import AdminRegister from './pages/AdminRegister';
import AdminHome from './pages/AdminHome';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';


// Protected Route Component
const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  
  if (!token) {
    // Redirect to login if no token
    return <Navigate to={allowedRole === 'admin' ? '/admin/login' : '/user/login'} />;
  }
  
  if (allowedRole && userRole !== allowedRole) {
    // Redirect to home if role doesn't match
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <Router basename="/">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        
        {/* User Routes */}
        <Route path="/user/login" element={<UserLogin />} />
        <Route path="/user/register" element={<UserRegister />} />
        <Route 
          path="/user/home" 
          element={
            <ProtectedRoute allowedRole="user">
              <UserHome />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/user/profile" 
          element={
            <ProtectedRoute allowedRole="user">
              <UserProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/user/analytics" 
          element={
            <ProtectedRoute allowedRole="user">
              <UserAnalyticsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/user/all-schemes" 
          element={
            <ProtectedRoute allowedRole="user">
              <AllSchemes />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/user/schemes" 
          element={
            <ProtectedRoute allowedRole="user">
              <EligibleSchemes />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/schemes/:id" 
          element={
            <ProtectedRoute allowedRole="user">
              <SchemeDetail />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/register" element={<AdminRegister />} />
        <Route 
          path="/admin/home" 
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminHome />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/analytics" 
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminAnalyticsPage />
            </ProtectedRoute>
          } 
        />

        {/* 404 Route - Redirect to Home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
