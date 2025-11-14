import { useState, useRef } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Chat from './components/Chat';
import Invoices from './components/Invoices';
import { invoicesAPI } from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleLogin = (userData, token) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    setCurrentView('dashboard');
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await invoicesAPI.upload(file);
      alert('Invoice uploaded and processed successfully!');
      // Refresh current view
      window.location.reload();
    } catch (error) {
      alert('Upload failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 smooth-shadow">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-black rounded-lg"></div>
              <h1 className="text-lg font-medium text-gray-900">Invoice Insights</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleUploadClick}
                disabled={uploading}
                className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Navigation */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex space-x-8">
            {['Dashboard', 'Chat', 'Invoices'].map((tab) => {
              const viewName = tab.toLowerCase();
              const isActive = currentView === viewName;
              return (
                <button
                  key={tab}
                  onClick={() => setCurrentView(viewName)}
                  className={`py-4 px-1 border-b-2 transition-all text-sm font-medium ${
                    isActive
                      ? 'border-black text-gray-900'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {currentView === 'dashboard' && <Dashboard onUploadClick={handleUploadClick} />}
        {currentView === 'chat' && <Chat />}
        {currentView === 'invoices' && <Invoices onUploadClick={handleUploadClick} />}
      </main>
    </div>
  );
}

export default App;
