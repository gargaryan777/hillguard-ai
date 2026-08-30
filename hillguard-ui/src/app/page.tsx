'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import { Search, MapPin, Activity, Droplets, Mountain, AlertTriangle, Send, Target, WifiOff } from 'lucide-react';
import { db } from '@/lib/db';

// Dynamic import for React-Leaflet with SSR disabled
const MapUI = dynamic(() => import('@/components/MapUI'), { 
  ssr: false, 
  loading: () => (
    <div className="h-full w-full bg-slate-900 animate-pulse flex items-center justify-center text-white/50">
      Loading Map...
    </div>
  ) 
});

interface EvaluationData {
  risk_score: number;
  base_probability: number;
  rain_factor: number;
  terrain: {
    elevation_m: number;
    slope_deg: number;
    aspect_deg: number;
    active_rainfall_mm: number;
  };
}

export default function Dashboard() {
  // Map State
  const [center, setCenter] = useState<[number, number]>([27.3389, 88.6065]); // Gangtok, Sikkim
  const [dangerZones, setDangerZones] = useState<any[]>([]);
  const [liveReports, setLiveReports] = useState<any[]>([]);

  // Input State
  const [searchQuery, setSearchQuery] = useState('');
  const [latInput, setLatInput] = useState('');
  const [lonInput, setLonInput] = useState('');
  
  // Scan State
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  
  // Reporting State
  const [reportDesc, setReportDesc] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);

  // Fetch initial map data
  useEffect(() => {
    fetch('http://localhost:8000/api/map-data')
      .then(res => res.json())
      .then(data => {
        if(data.danger_zones) setDangerZones(data.danger_zones);
        if(data.live_reports) setLiveReports(data.live_reports);
      })
      .catch(console.error);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLon = parseFloat(data[0].lon);
        setCenter([newLat, newLon]);
        setLatInput(newLat.toFixed(4));
        setLonInput(newLon.toFixed(4));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleScan = async () => {
    const lat = parseFloat(latInput);
    const lon = parseFloat(lonInput);
    if (isNaN(lat) || isNaN(lon)) return;
    
    setCenter([lat, lon]);
    setEvaluating(true);
    setEvaluation(null);

    try {
      const res = await fetch('http://localhost:8000/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lon })
      });
      if(!res.ok) throw new Error("Evaluation failed");
      const data = await res.json();
      setEvaluation(data);
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineReports();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Try syncing on initial load if online
    if (navigator.onLine) {
      syncOfflineReports();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncOfflineReports = async () => {
    try {
      const unsynced = await db.reports.where('synced').equals('false').toArray();
      // Dexie boolean index might be tricky, so let's just get all where synced is false
      // actually, indexeddb doesn't index booleans natively in old versions, but we used a normal field
      // to be safe, just filter in memory if few, or use 0 for false. Let's just fetch unsynced
      const pending = await db.reports.filter(r => !r.synced).toArray();
      
      for (const report of pending) {
        try {
          const res = await fetch('http://localhost:8000/api/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              latitude: report.latitude, 
              longitude: report.longitude, 
              description: report.description 
            })
          });
          
          if(res.ok) {
            const data = await res.json();
            if(data.report) {
               setLiveReports(prev => [...prev, data.report]);
               await db.reports.update(report.id!, { synced: true });
            }
          }
        } catch (err) {
          console.error("Failed to sync report", report.id);
        }
      }
    } catch(err) {
      console.error("Sync error:", err);
    }
  };

  const submitReport = async () => {
    const lat = parseFloat(latInput);
    const lon = parseFloat(lonInput);
    if (isNaN(lat) || isNaN(lon) || !reportDesc) return;
    
    setSubmittingReport(true);
    try {
      if (isOnline) {
        const res = await fetch('http://localhost:8000/api/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude: lat, longitude: lon, description: reportDesc })
        });
        const data = await res.json();
        if(data.report) {
           setLiveReports(prev => [...prev, data.report]);
           setReportDesc('');
           setShowReportForm(false);
           
           // Also save locally as synced
           await db.reports.add({
             latitude: lat,
             longitude: lon,
             description: reportDesc,
             timestamp: Date.now(),
             synced: true
           });
        }
      } else {
        // Offline mode caching
        await db.reports.add({
          latitude: lat,
          longitude: lon,
          description: reportDesc,
          timestamp: Date.now(),
          synced: false
        });
        
        // Optimistically add to UI
        setLiveReports(prev => [...prev, { lat, lng: lon, description: reportDesc + " (Offline Pending)" }]);
        setReportDesc('');
        setShowReportForm(false);
        alert("You are offline. Report cached and will sync automatically when connection is restored.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit report. Please check your connection.");
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* Sidebar: Fixed 384px */}
      <div className="w-96 shrink-0 bg-slate-950/80 backdrop-blur-md border-r border-slate-800 p-6 flex flex-col z-10 shadow-2xl overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Activity className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight text-white leading-tight">Hillguard AI</h1>
            <p className="text-xs text-slate-400 font-medium flex items-center justify-between">
              Real-time Hazard Assessment
              {!isOnline && <span className="text-orange-400 flex items-center gap-1"><WifiOff className="w-3 h-3" /> Offline</span>}
            </p>
          </div>
        </div>

        {/* Global Search */}
        <form onSubmit={handleSearch} className="mb-6 relative group">
          <input 
            type="text" 
            placeholder="Search region or city..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all placeholder:text-slate-500 shadow-inner"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-emerald-400 transition-colors" />
        </form>

        {/* Coordinate Scanner */}
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400" /> Coordinate Scanner
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-slate-500 block mb-1.5 font-medium uppercase tracking-wider">Latitude</label>
              <input type="number" step="any" value={latInput} onChange={e => setLatInput(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors" placeholder="27.33" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1.5 font-medium uppercase tracking-wider">Longitude</label>
              <input type="number" step="any" value={lonInput} onChange={e => setLonInput(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors" placeholder="88.60" />
            </div>
          </div>
          <button 
            onClick={handleScan}
            disabled={evaluating || !latInput || !lonInput}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:shadow-none"
          >
            {evaluating ? <span className="animate-pulse">Analyzing Terrain...</span> : 'Execute Scan'}
          </button>
        </div>

        {/* Results Panel */}
        {evaluation && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
            <div className={`rounded-2xl p-5 mb-5 border backdrop-blur-sm ${
              evaluation.risk_score > 70 ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.15)]' : 
              evaluation.risk_score > 40 ? 'bg-orange-500/10 border-orange-500/20 text-orange-400 shadow-[0_0_30px_rgba(249,115,22,0.15)]' : 
              'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
            }`}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-80 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" /> Hazard Risk Score
              </div>
              <div className="text-5xl font-black tracking-tighter mb-2">{evaluation.risk_score}%</div>
              <div className="text-xs font-medium opacity-90 flex justify-between items-center bg-black/20 rounded-lg px-3 py-1.5 mt-3">
                <span>Base: {evaluation.base_probability}%</span>
                <span>Rain: +{evaluation.rain_factor}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <Mountain className="w-5 h-5 text-slate-400 mb-2" />
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Elevation</div>
                <div className="font-semibold text-slate-200">{evaluation.terrain.elevation_m}m</div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <Activity className="w-5 h-5 text-slate-400 mb-2" />
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Slope</div>
                <div className="font-semibold text-slate-200">{evaluation.terrain.slope_deg}°</div>
              </div>
              <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 p-4 rounded-xl border border-blue-500/20 col-span-2 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets className="w-4 h-4 text-blue-400" />
                    <div className="text-[10px] uppercase tracking-wider text-blue-400/80 font-bold">24h Rainfall</div>
                  </div>
                  <div className="font-semibold text-blue-100">{evaluation.terrain.active_rainfall_mm} mm live reading</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Crowdsourced Reporting Section */}
        <div className="mt-auto pt-6 border-t border-slate-800/50">
          <button 
            onClick={() => setShowReportForm(!showReportForm)}
            className="w-full flex items-center justify-between text-sm font-medium text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/5"
          >
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-400" /> 
              Submit Hazard Report
            </span>
            <span className="text-xl leading-none">{showReportForm ? '−' : '+'}</span>
          </button>
          
          {showReportForm && (
            <div className="mt-3 animate-in fade-in slide-in-from-top-2">
              <textarea 
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-500/50 min-h-[100px] mb-3 placeholder:text-slate-600 transition-colors"
                placeholder="Describe local anomalies (e.g., severe road cracking, fresh rockfalls, unusual water seepage)..."
                value={reportDesc}
                onChange={e => setReportDesc(e.target.value)}
              />
              <button 
                onClick={submitReport}
                disabled={submittingReport || !reportDesc || !latInput || !lonInput}
                className="w-full bg-orange-600/90 hover:bg-orange-500 text-white font-medium py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-[0_0_15px_rgba(249,115,22,0.2)]"
              >
                {submittingReport ? <span className="animate-pulse">Submitting...</span> : <><Send className="w-4 h-4" /> Broadcast Alert</>}
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative z-0 bg-slate-900 h-full w-full">
        <MapUI center={center} dangerZones={dangerZones} liveReports={liveReports} />
      </div>

    </div>
  );
}
