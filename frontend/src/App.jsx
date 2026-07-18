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
            setCurrentTab('scan');
          }
        });

        // Listen for auth state changes
        const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
          if (session) {
            setUser(session.user);
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
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/history', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
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

    if (!supabase) {
      setAuthError('Supabase is not configured. Click the settings icon at top right.');
      return;
    }

    try {
      if (authView === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });
        if (error) throw error;
        setAuthSuccess('Verification email sent! Check your inbox.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        setUser(data.user);
        setCurrentTab('scan');
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
    setCurrentTab('landing');
  };

  // Handle Image Selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setScanResult(null);
    }
  };

  // Predict Inference
  const handleScan = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsScanning(true);
    setScanResult(null);

    const formData = new FormData();
    formData.append('files', selectedFile);
    formData.append('method', xaiMethod);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: formData
      });
      const data = await response.json();
      if (data.status === 'success') {
        setScanResult(data);
      } else {
        alert(data.detail || 'Prediction failed.');
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
                handleFileChange={handleFileChange}
                handleScan={handleScan}
                xaiMethod={xaiMethod}
                setXaiMethod={setXaiMethod}
              />
              
              <div className="lg:col-span-7 flex flex-col justify-center">
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
