import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Import refactored modular components
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import LoginCard from './components/LoginCard';
import UploadBox from './components/UploadBox';
import ResultCard from './components/ResultCard';
import HistoryTable from './components/HistoryTable';
import FaqPanel from './components/FaqPanel';
import Aurora from './components/Aurora';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  // Supabase Configuration States
  const [supabaseUrl, setSupabaseUrl] = useState(import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('supabase_url') || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('supabase_anon_key') || '');
  const [supabase, setSupabase] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Authentication States
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // App Navigation States
  const [currentTab, setCurrentTab] = useState('landing'); // 'landing' | 'scan' | 'history' | 'about'
  
  // Predict Scan States
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [batchResults, setBatchResults] = useState([]);
  const [selectedBatchIndex, setSelectedBatchIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.5);
  const [xaiMethod, setXaiMethod] = useState('gradcam');

  // History States
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Analytics
  const [totalScans, setTotalScans] = useState(0);
  const [fakeCount, setFakeCount] = useState(0);

  const isAdmin = !!(user && user.email && user.email.toLowerCase().includes('admin'));

  // Setup Supabase Client
  useEffect(() => {
    if (supabaseUrl && supabaseAnonKey) {
      try {
        const client = createClient(supabaseUrl, supabaseAnonKey);
        setSupabase(client);
        
        // Check current session
        client.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            setUser(session.user);
            const isUserAdmin = session.user.email?.toLowerCase().includes('admin');
            setCurrentTab(isUserAdmin ? 'admin' : 'scan');
          }
        });

        // Listen for auth state changes
        const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
          if (session) {
            setUser(session.user);
            const isUserAdmin = session.user.email?.toLowerCase().includes('admin');
            setCurrentTab(isUserAdmin ? 'admin' : 'scan');
          } else {
            setUser(null);
          }
        });

        return () => subscription.unsubscribe();
      } catch (err) {
        console.error("Invalid Supabase configuration:", err);
      }
    } else {
      setShowConfigModal(true);
    }
  }, [supabaseUrl, supabaseAnonKey]);

  // Load Scan History
  useEffect(() => {
    if (user && currentTab === 'history') {
      fetchHistory();
    }
  }, [user, currentTab]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      let token = 'mock-token';
      if (user && user.email && user.email.toLowerCase().includes('admin')) {
        token = 'admin-super-token';
      } else if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token || 'mock-token';
      }
      const response = await fetch('/api/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setHistoryList(data);
        setTotalScans(data.length);
        setFakeCount(data.filter(s => s.prediction === 'FAKE').length);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Save Config Values
  const handleSaveConfig = (e) => {
    e.preventDefault();
    localStorage.setItem('supabase_url', supabaseUrl);
    localStorage.setItem('supabase_anon_key', supabaseAnonKey);
    setShowConfigModal(false);
    window.location.reload();
  };

  // Handle Authentication
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const isSystemAdmin = email.trim().toLowerCase() === 'admin' || email.trim().toLowerCase() === 'admin@astralens.com';

    try {
      if (isSystemAdmin) {
        // Administrator Bypass authentication check (bypasses Supabase database connection)
        if (authView === 'signup') {
          setAuthError('Administrator account is pre-registered and cannot be created.');
          return;
        }
        
        const response = await fetch('/api/auth/mock/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
          setUser({
            id: 'admin-12345',
            email: 'admin@astralens.com',
            user_metadata: { full_name: 'System Administrator' }
          });
          setCurrentTab('admin');
        } else {
          throw new Error(data.detail || 'Administrator login failed');
        }
      } else if (supabase) {
        // SUPABASE REAL AUTH MODE
        if (authView === 'signup') {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName }
            }
          });
          if (error) throw error;
          setAuthSuccess('Registration successful! You can now log in.');
          setAuthView('login');
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (error) throw error;
          setUser(data.user);
          const isUserAdmin = data.user.email?.toLowerCase().includes('admin');
          setCurrentTab(isUserAdmin ? 'admin' : 'scan');
        }
      } else {
        // MOCK OFFLINE DEV AUTH MODE
        if (authView === 'signup') {
          const response = await fetch('/api/auth/mock/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, full_name: fullName || email.split('@')[0] })
          });
          const data = await response.json();
          if (response.ok) {
            setAuthSuccess('Registration successful! You can now log in.');
            setAuthView('login');
          } else {
            throw new Error(data.detail || 'Mock signup failed');
          }
        } else {
          const response = await fetch('/api/auth/mock/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const data = await response.json();
          if (response.ok) {
            setUser({
              id: data.user.id,
              email: data.user.email,
              user_metadata: { full_name: data.user.full_name }
            });
            const isUserAdmin = data.user.email?.toLowerCase().includes('admin');
            setCurrentTab(isUserAdmin ? 'admin' : 'scan');
          } else {
            throw new Error(data.detail || 'Mock login failed');
          }
        }
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed.');
    }
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setScanResult(null);
    setSelectedFile(null);
    setPreviewUrl('');
    setSelectedFiles([]);
    setPreviewUrls([]);
    setBatchResults([]);
    setSelectedBatchIndex(0);
    setCurrentTab('landing');
  };

  // Handle Image Selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      
      const urls = files.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
      
      // Maintain compatibility with components expecting single values
      setSelectedFile(files[0]);
      setPreviewUrl(urls[0]);
      
      setScanResult(null);
      setBatchResults([]);
      setSelectedBatchIndex(0);
    }
  };

  // Predict Inference
  const handleScan = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    setIsScanning(true);
    setScanResult(null);
    setBatchResults([]);
    setSelectedBatchIndex(0);

    const isBatch = selectedFiles.length > 1;
    const endpoint = isBatch ? '/api/predict/batch' : '/api/predict';

    const formData = new FormData();
    if (isBatch) {
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
    } else {
      formData.append('files', selectedFiles[0]);
    }
    formData.append('method', xaiMethod);

    try {
      let token = 'mock-token';
      if (user && user.email && user.email.toLowerCase().includes('admin')) {
        token = 'admin-super-token';
      } else if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token || 'mock-token';
      }
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await response.json();
      
      if (isBatch) {
        if (Array.isArray(data) && data.length > 0) {
          setBatchResults(data);
          setScanResult(data[0]); // default to first result active
        } else {
          alert('Batch prediction failed.');
        }
      } else {
        if (data.status === 'success') {
          setScanResult(data);
        } else {
          alert(data.detail || 'Prediction failed.');
        }
      }
    } catch (err) {
      alert('Error connecting to FastAPI backend.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleLoadResultFromHistory = (scan) => {
    setScanResult({
      prediction: scan.prediction,
      confidence: scan.confidence,
      orig_b64: null,
      heat_b64: null,
      image_url: scan.image_url,
      heatmap_url: scan.heatmap_url,
      orig_url_fallback: scan.image_url,
      heat_url_fallback: scan.heatmap_url
    });
    setCurrentTab('scan');
  };

  return (
    <div className="min-h-screen flex flex-col relative text-zinc-100">
      {/* Background Aurora WebGL Shader effect - Fixed position for viewport-lock on mobile */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden opacity-35">
        <Aurora 
          colorStops={["#7cff67", "#B497CF", "#5227FF"]}
          blend={0.72}
          amplitude={1.0}
          speed={1.8}
        />
      </div>

      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>

      {/* Global Navigation Header */}
      <Navbar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        user={user} 
        isAdmin={isAdmin}
        onSignOut={handleSignOut} 
        onOpenConfig={() => setShowConfigModal(true)} 
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 flex flex-col items-center justify-center">
        
        {/* LANDING TAB / WELCOME VIEW */}
        {currentTab === 'landing' && !user && (
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-16 mt-8">
            <Hero 
              onStartScan={() => setAuthView('login')} 
              onViewFaq={() => setCurrentTab('about')} 
            />
            
            <LoginCard 
              authView={authView}
              setAuthView={setAuthView}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              fullName={fullName}
              setFullName={setFullName}
              authError={authError}
              setAuthError={setAuthError}
              authSuccess={authSuccess}
              setAuthSuccess={setAuthSuccess}
              onAuthSubmit={handleAuthSubmit}
            />
          </div>
        )}

        {/* DETECTOR / SCAN TAB */}
        {currentTab === 'scan' && user && (
          <div className="w-full max-w-5xl flex flex-col items-center gap-8">
            <div className="text-center max-w-2xl mb-6">
              <h2 className="text-4xl font-extrabold font-space bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-3">
                Verify Image Authenticity
              </h2>
              <p className="text-zinc-400">
                Upload a high-resolution image to analyze structural signatures. Fakes will display highlight overlays pointing out anomalies.
              </p>
            </div>

            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <UploadBox 
                isScanning={isScanning}
                previewUrl={previewUrl}
                selectedFile={selectedFile}
                selectedFiles={selectedFiles}
                previewUrls={previewUrls}
                handleFileChange={handleFileChange}
                handleScan={handleScan}
                xaiMethod={xaiMethod}
                setXaiMethod={setXaiMethod}
              />
              
              <div className="lg:col-span-7 flex flex-col justify-center w-full">
                {batchResults.length > 0 && (
                  <div className="glass-panel p-5 w-full mb-6 flex flex-col gap-3">
                    <span className="font-space font-bold text-xs uppercase tracking-wider text-indigo-400">
                      ⚡ Batch Results ({batchResults.length} Images Scanned)
                    </span>
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                      {batchResults.map((result, idx) => {
                        const isSelected = selectedBatchIndex === idx;
                        const isReal = result.prediction === 'REAL';
                        const imgSrc = result.orig_b64 
                          ? `data:image/jpeg;base64,${result.orig_b64}` 
                          : (result.orig_url_fallback || result.image_url);
                        
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSelectedBatchIndex(idx);
                              setScanResult(result);
                            }}
                            className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${isSelected ? 'border-indigo-500 scale-105 shadow-glow-sm' : 'border-white/10 hover:border-white/30'}`}
                          >
                            <img src={imgSrc} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                            <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${isReal ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                              {isReal ? 'R' : 'F'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <ResultCard 
                  scanResult={scanResult}
                  heatmapOpacity={heatmapOpacity}
                  setHeatmapOpacity={setHeatmapOpacity}
                />
              </div>
            </div>
          </div>
        )}

        {/* SCAN HISTORY TAB */}
        {currentTab === 'history' && user && (
          <HistoryTable 
            historyList={historyList}
            historyLoading={historyLoading}
            totalScans={totalScans}
            fakeCount={fakeCount}
            onRefresh={fetchHistory}
            onLoadResult={handleLoadResultFromHistory}
          />
        )}

        {/* DETAILS/VIVA FAQ TAB */}
        {currentTab === 'about' && (
          <FaqPanel />
        )}

        {/* SECURE ADMIN PANEL */}
        {currentTab === 'admin' && user && isAdmin && (
          <AdminDashboard token={user.email.toLowerCase().includes('admin') ? 'admin-super-token' : 'mock-token'} onViewScan={handleLoadResultFromHistory} />
        )}

      </main>



      {scanResult && (
        <div style={{ display: 'none' }}>
          {scanResult.orig_url_fallback && (
            <div className="hidden">
              <img src={scanResult.orig_url_fallback} alt="Preload original" />
              <img src={scanResult.heatmap_url} alt="Preload heatmap" />
            </div>
          )}
        </div>
      )}

      {/* Global Footer */}
      <footer className="w-full py-8 text-center text-xs text-zinc-600 border-t border-white/5 bg-zinc-950/40 font-mono mt-auto">
        &copy; {new Date().getFullYear()} Astra Lens. Powered by FastAPI, PyTorch EfficientNet-B0 & React.
      </footer>
    </div>
  );
}
