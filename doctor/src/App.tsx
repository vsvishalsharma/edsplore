import React from 'react';
import { Routes, Route, useLocation, Navigate, Link, Outlet } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './lib/firebase';
import { Bot, LayoutDashboard, Users, CreditCard, MessageSquare, LogOut } from 'lucide-react';
import HomePage from './components/HomePage';
import Navbar from './components/Navbar';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import PaymentsPage from './components/PaymentsPage';
import AiChat from './components/AiChat';
import PromptEditor from './components/PromptEditor';

// Protected Route wrapper component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Dashboard Layout component
function DashboardLayout() {
  const [user] = useAuthState(auth);
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-lg font-semibold text-gray-900">MediAI</span>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          <Link
            to="/dashboard"
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
              location.pathname === '/dashboard' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/payments"
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
              location.pathname === '/payments' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span>Payments</span>
          </Link>

          <Link
            to="/ai-assistant"
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
              location.pathname === '/ai-assistant' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Bot className="w-5 h-5" />
            <span>AI Assistant</span>
          </Link>

          <Link
            to="/chat"
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
              location.pathname === '/chat' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>AI Chat</span>
          </Link>

          <div className="pt-4 mt-4 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-gray-900">
            {location.pathname.charAt(1).toUpperCase() + location.pathname.slice(2).replace(/-/g, ' ')}
          </h1>
          <div className="flex items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.email?.[0].toUpperCase()}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-auto bg-gray-50 p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function App() {
  const [user, loading] = useAuthState(auth);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show Navbar only on homepage
  const showNavbar = location.pathname === '/';

  // Public routes
  if (location.pathname === '/' || location.pathname === '/login') {
    return (
      <>
        {showNavbar && <Navbar />}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={
            user ? <Navigate to="/dashboard" replace /> : <AuthPage />
          } />
        </Routes>
      </>
    );
  }

  // Protected routes with dashboard layout
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard setCurrentPage={() => {}} />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/ai-assistant" element={<PromptEditor agentId="" llmId="" initialPrompt="" onPromptUpdate={() => {}} />} />
        <Route path="/chat" element={<AiChat />} />
      </Route>
    </Routes>
  );
}

export default App;