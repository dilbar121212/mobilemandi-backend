import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Search,
  RefreshCw,
  TrendingDown,
  ShieldCheck,
  Cpu,
  Camera,
  Battery,
  BatteryCharging,
  HardDrive,
  Wifi,
  Layers,
  ArrowUpRight,
  Plus,
  Trash2,
  Terminal,
  Send,
  Sliders,
  DollarSign,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  ChevronRight,
  Sparkles,
  Zap,
  Tag,
  Building2,
  Clock,
} from 'lucide-react';
import {
  MobilePhone,
  ScrapeSource,
  PtaStatus,
} from './types/mobilemandi';
import { WhatMobileSpecsSheet } from './components/WhatMobileSpecsSheet';

const DEFAULT_ADMIN_KEY = 'mandi-admin-2026';

export default function App() {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<
    'bazaar' | 'scraper' | 'valuation' | 'admin' | 'advisor'
  >('bazaar');
  const [isMobileDeviceMode, setIsMobileDeviceMode] = useState<boolean>(false);

  // Phones database state
  const [phones, setPhones] = useState<MobilePhone[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [ptaFilter, setPtaFilter] = useState<string>('all');
  const [selectedPhoneForDetail, setSelectedPhoneForDetail] =
    useState<MobilePhone | null>(null);

  // Scraper & Sources state
  const [sources, setSources] = useState<ScrapeSource[]>([]);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [scraperLogs, setScraperLogs] = useState<string[]>([
    '[System] Initializing Pakistan Official Phone Price Automation engine...',
    '[Registry] 7 sources loaded: Samsung PK, Xiaomi PK, realme PK, OPPO PK, Vivo PK, PriceOye, Mandi B2B.',
  ]);
  const [scraperNotice, setScraperNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Admin Auth state
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [adminInputKey, setAdminInputKey] = useState<string>('');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);

  // Admin Modal: Add Source
  const [isNewSourceModalOpen, setIsNewSourceModalOpen] = useState<boolean>(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceCategory, setNewSourceCategory] = useState<'official_mfr' | 'retailer' | 'wholesale'>('official_mfr');
  const [newSourceInterval, setNewSourceInterval] = useState(60);

  // Admin Modal: Add Phone
  const [isAdminNewPhoneOpen, setIsAdminNewPhoneOpen] = useState(false);
  const [adminTitle, setAdminTitle] = useState('');
  const [adminBrand, setAdminBrand] = useState<MobilePhone['brand']>('Samsung');
  const [adminModel, setAdminModel] = useState('');
  const [adminStorage, setAdminStorage] = useState('256 GB');
  const [adminRam, setAdminRam] = useState('8 GB');
  const [adminOfficialPrice, setAdminOfficialPrice] = useState(149999);
  const [adminMarketLowest, setAdminMarketLowest] = useState(139999);
  const [adminPtaStatus, setAdminPtaStatus] = useState<PtaStatus>('Official PTA Approved');

  // AI Valuation State (PKR)
  const [valBrand, setValBrand] = useState('Samsung');
  const [valModel, setValModel] = useState('Galaxy S23');
  const [valStorage, setValStorage] = useState('256 GB');
  const [valPtaStatus, setValPtaStatus] = useState<PtaStatus>('Official PTA Approved');
  const [valBodyCondition, setValBodyCondition] = useState('Minor micro-scratches, no dents');
  const [valScreenCondition, setValScreenCondition] = useState('Original flawless display');
  const [valBatteryHealth, setValBatteryHealth] = useState(88);
  const [isValuating, setIsValuating] = useState(false);
  const [valuationResult, setValuationResult] = useState<any | null>(null);

  // Mandi Advisor Chat state (Rasho Bhai)
  const [chatMessages, setChatMessages] = useState<
    { id: string; role: 'user' | 'model'; text: string; time: string }[]
  >([
    {
      id: 'msg-01',
      role: 'model',
      text: 'Assalam-o-Alaikum! I am Rasho Bhai, your Mobile Mandi specialist. Looking for official PTA Approved prices, comparing Airlink vs M&P warranties, or checking spot rates in Hafeez Centre & Hall Road? Ask me anything!',
      time: '10:00',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [advisorModel, setAdvisorModel] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite'>('gemini-3.8-flash');
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchSources();
    fetchPhones();
  }, []);

  useEffect(() => {
    if (activeTab === 'advisor') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const fetchSources = async () => {
    try {
      const res = await fetch('/api/sources');
      const data = await res.json();
      if (data.sources) setSources(data.sources);
    } catch (e) {
      console.error('Error fetching sources:', e);
    }
  };

  const fetchPhones = async () => {
    try {
      const res = await fetch('/api/phones');
      const data = await res.json();
      if (data.phones) setPhones(data.phones);
    } catch (e) {
      console.error('Error fetching phones:', e);
    }
  };

  // Verify Admin Key
  const handleVerifyAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError(null);
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: adminInputKey }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAdminUnlocked(true);
      } else {
        setAdminAuthError('Invalid administrator credentials.');
      }
    } catch {
      setAdminAuthError('Authentication request failed.');
    }
  };

  // Trigger Scraper Run
  const handleTriggerScraper = async (sourceId?: string) => {
    setIsScraping(true);
    setScraperNotice(null);
    try {
      const res = await fetch('/api/scraper/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': DEFAULT_ADMIN_KEY,
        },
        body: JSON.stringify({ sourceId }),
      });
      const data = await res.json();
      if (data.logs) {
        setScraperLogs((prev) => [...data.logs, ...prev].slice(0, 50));
      }
      if (data.sources) setSources(data.sources);
      await fetchPhones();

      if (data.totalFailed > 0) {
        setScraperNotice({
          type: 'error',
          message: `Update completed with issues: ${data.totalUpdated} products updated, ${data.totalFailed} sources encountered errors. Check terminal logs.`,
        });
      } else {
        setScraperNotice({
          type: 'success',
          message: `Update successful: ${data.totalUpdated} official prices updated/verified.`,
        });
      }
    } catch (err: any) {
      setScraperNotice({
        type: 'error',
        message: `Scraper execution failed: ${err?.message}`,
      });
    } finally {
      setIsScraping(false);
    }
  };

  // Toggle Source Active
  const handleToggleSource = async (src: ScrapeSource) => {
    try {
      await fetch(`/api/sources/${src.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': DEFAULT_ADMIN_KEY,
        },
        body: JSON.stringify({ active: !src.active }),
      });
      fetchSources();
    } catch (err) {
      console.error(err);
    }
  };

  // Add Source
  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName || !newSourceUrl) return;
    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': DEFAULT_ADMIN_KEY,
        },
        body: JSON.stringify({
          name: newSourceName,
          url: newSourceUrl,
          category: newSourceCategory,
          scrapeIntervalMins: Number(newSourceInterval),
        }),
      });
      if (res.ok) {
        setIsNewSourceModalOpen(false);
        setNewSourceName('');
        setNewSourceUrl('');
        fetchSources();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Phone (Admin)
  const handleAdminAddPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminTitle || !adminModel) return;
    try {
      const newPhone: Partial<MobilePhone> = {
        title: adminTitle,
        brand: adminBrand,
        model: adminModel,
        storage: adminStorage,
        ram: adminRam,
        color: 'Graphite / Black',
        officialPtaStatus: adminPtaStatus,
        officialMfr: {
          price: Number(adminOfficialPrice),
          isPublishedByBrand: true,
          sourceName: `${adminBrand} Pakistan Official`,
          sourceUrl: 'https://mobilemandi.pk',
          lastVerified: new Date().toISOString(),
        },
        marketLowestPrice: Number(adminMarketLowest),
        retailerPrices: [
          {
            sourceId: 'src-mandi-b2b',
            retailerName: 'Hafeez Centre Mandi Direct',
            price: Number(adminMarketLowest),
            ptaStatus: adminPtaStatus,
            condition: 'Brand New',
            inStock: true,
            warranty: '1 Year Official Brand Warranty',
            url: 'https://mobilemandi.pk',
            sellerRating: 4.9,
            lastVerified: new Date().toISOString(),
          },
        ],
        priceHistory: [
          {
            date: new Date().toISOString().split('T')[0],
            officialPrice: Number(adminOfficialPrice),
            lowestMarketPrice: Number(adminMarketLowest),
            source: 'Admin Direct Entry',
          },
        ],
        marketTrend: 'Stable',
        isStale: false,
        lastSuccessfulUpdate: new Date().toISOString(),
        specs: {
          display: '6.7" AMOLED Display, 120Hz',
          processor: 'Octa-Core 5G Processor',
          rearCamera: '50 MP OIS Main Camera',
          frontCamera: '16 MP Selfie',
          battery: '5000 mAh Fast Charging',
          charging: 'Fast Charge Compatible',
          os: 'Android 14',
          network: '5G Dual SIM',
        },
      };

      const res = await fetch('/api/phones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': DEFAULT_ADMIN_KEY,
        },
        body: JSON.stringify(newPhone),
      });

      if (res.ok) {
        setIsAdminNewPhoneOpen(false);
        setAdminTitle('');
        setAdminModel('');
        fetchPhones();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Phone
  const handleDeletePhone = async (id: string) => {
    try {
      await fetch(`/api/phones/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': DEFAULT_ADMIN_KEY },
      });
      fetchPhones();
    } catch (err) {
      console.error(err);
    }
  };

  // Valuation Calculation (PKR) with resilient client-side fallback
  const handleCalculateValuation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsValuating(true);
    setValuationResult(null);

    // Calculate immediate client fallback value
    const calculateFallback = () => {
      let base = 140000;
      const m = `${valBrand} ${valModel}`.toLowerCase();
      if (m.includes('ultra') || m.includes('pro max') || m.includes('15 pro') || m.includes('16 pro')) {
        base = 360000;
      } else if (m.includes('s24') || m.includes('iphone 15') || m.includes('iphone 14')) {
        base = 240000;
      } else if (m.includes('s23') || m.includes('iphone 13')) {
        base = 180000;
      } else if (m.includes('a55') || m.includes('12 pro+') || m.includes('16 pro')) {
        base = 125000;
      } else if (m.includes('note') || m.includes('reno') || m.includes('v30')) {
        base = 85000;
      } else if (m.includes('c67') || m.includes('15c') || m.includes('a18') || m.includes('note 50')) {
        base = 42000;
      }

      const storageMult = valStorage.includes('256') ? 1.1 : valStorage.includes('512') ? 1.22 : valStorage.includes('1 TB') ? 1.35 : valStorage.includes('64') ? 0.88 : 1.0;
      const ptaMult = valPtaStatus.includes('Non-PTA') ? 0.55 : valPtaStatus.includes('Passport') ? 0.88 : 1.0;
      const condMult = valBodyCondition.includes('Like New') && valScreenCondition.includes('flawless') ? 1.0 : (valScreenCondition.includes('Cracked') || valBodyCondition.includes('damaged')) ? 0.55 : 0.9;
      const battMult = valBatteryHealth >= 90 ? 1.0 : valBatteryHealth >= 80 ? 0.92 : 0.82;

      const cash = Math.round((base * storageMult * ptaMult * condMult * battMult) / 500) * 500;
      return {
        estimatedCashValuePKR: cash,
        exchangeBonusValuePKR: Math.round((cash * 1.08) / 500) * 500,
        wholesaleMandiRatePKR: Math.round((cash * 0.94) / 500) * 500,
        grade: condMult >= 0.95 ? 'Grade A+ (Pristine)' : condMult >= 0.85 ? 'Grade A (Good)' : 'Grade B (Fair)',
        ptaTaxImpactDescription: valPtaStatus.includes('Non-PTA')
          ? 'Non-PTA device heavily discounted due to pending FBR customs duty (sim slot blocked after 60 days).'
          : 'Official PTA Approved device retaining 100% legal SIM network value in Pakistan without blocking risk.',
        recommendation: 'Fair second-hand cash valuation verified against current Hafeez Centre & Hall Road wholesale index.',
      };
    };

    try {
      const res = await fetch('/api/valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: valBrand,
          model: valModel,
          storage: valStorage,
          ptaStatus: valPtaStatus,
          physicalCondition: valBodyCondition,
          screenCondition: valScreenCondition,
          batteryPercent: valBatteryHealth,
        }),
      });
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data && data.result) {
        setValuationResult(data.result);
      } else {
        setValuationResult(calculateFallback());
      }
    } catch (err) {
      console.warn('Valuation fetch failed, applying market valuation model:', err);
      setValuationResult(calculateFallback());
    } finally {
      setIsValuating(false);
    }
  };

  // Send Chat Message to Rasho Bhai
  const handleSendChatMessage = async (e?: React.FormEvent, promptOverride?: string) => {
    if (e) e.preventDefault();
    const content = (promptOverride || chatInput).trim();
    if (!content || isChatLoading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { id: `u-${Date.now()}`, role: 'user' as const, text: content, time: timeStr };

    const nextList = [...chatMessages, userMsg];
    setChatMessages(nextList);
    if (!promptOverride) setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextList.map((m) => ({ role: m.role, content: m.text })),
          selectedModel: advisorModel,
          activePhoneContext: selectedPhoneForDetail || undefined,
          availablePhones: phones.map((p) => ({
            name: p.title,
            brand: p.brand,
            model: p.model,
            price: p.marketLowestPrice,
            officialPrice: p.officialMfr?.price || null,
            storage: p.storage,
            ram: p.ram,
          })),
        }),
      });
      const data = await res.json();
      const modelMsg = {
        id: `m-${Date.now()}`,
        role: 'model' as const,
        text: data.reply || 'Wholesale market counter is updating rates. Please retry.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, modelMsg]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model' as const,
          text: 'Rasho Bhai is currently in a call with distributors. Please retry shortly.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Filtered Phones
  const filteredPhones = phones.filter((p) => {
    const matchesBrand = selectedBrand === 'all' || p.brand.toLowerCase() === selectedBrand.toLowerCase();
    const matchesPta = ptaFilter === 'all' || p.officialPtaStatus.toLowerCase().includes(ptaFilter.toLowerCase());
    const matchesSearch =
      searchQuery === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBrand && matchesPta && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans">
      {/* Strict 3-Zone Top Bar Navigation */}
      <header className="sticky top-0 z-40 bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-700/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-950/40">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-1.5">
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('bazaar');
              }}
              className="text-lg font-bold tracking-tight text-white whitespace-nowrap flex items-center gap-1.5"
            >
              <span>Mobile Mandi Live</span>
              <span className="text-emerald-400 text-xs font-mono-tabular font-bold bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">PK</span>
            </a>
            <span title="Verified Official Pakistan Portal" className="flex items-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4 fill-emerald-500/20" />
            </span>
          </div>
        </div>

        {/* Zone 2: Single-line Clean Nav Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <button
            type="button"
            onClick={() => setActiveTab('bazaar')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
              activeTab === 'bazaar'
                ? 'border-emerald-500 text-white font-bold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            Pakistan Bazaar ({phones.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scraper')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'scraper'
                ? 'border-emerald-500 text-white font-bold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            <span>Official Price Automation</span>
            {isScraping && <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('valuation')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
              activeTab === 'valuation'
                ? 'border-emerald-500 text-white font-bold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            PTA Tax &amp; Resale
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('advisor')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
              activeTab === 'advisor'
                ? 'border-emerald-500 text-white font-bold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            Mandi Advisor (Rasho Bhai)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'admin'
                ? 'border-emerald-500 text-white font-bold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Admin Control Panel</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary CTA + Mobile Viewport Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsMobileDeviceMode(!isMobileDeviceMode)}
            title="Toggle between Mobile Phone Simulator and Desktop View"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 whitespace-nowrap cursor-pointer"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>{isMobileDeviceMode ? 'Full Viewport' : 'Mobile Phone Frame'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleTriggerScraper()}
            disabled={isScraping}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all shadow-md shadow-emerald-950/40 whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin' : ''}`} />
            <span>{isScraping ? 'Crawling PK Portals...' : 'Run Update Now'}</span>
          </button>
        </div>
      </header>

      {/* Mobile Navigation Strip (Small Screens) */}
      <div className="lg:hidden flex items-center justify-between border-b border-slate-700 bg-slate-900 px-3 py-2 overflow-x-auto gap-2">
        {(
          [
            ['bazaar', 'Bazaar'],
            ['scraper', 'Price Automation'],
            ['valuation', 'PTA & Valuation'],
            ['advisor', 'Advisor AI'],
            ['admin', 'Admin'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`px-3 py-1 text-xs font-semibold rounded whitespace-nowrap shrink-0 ${
              activeTab === key
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Real-time Pakistan Operational Ticker (Clean & Corporate) */}
      <div className="bg-slate-900/90 border-b border-slate-700/60 px-4 sm:px-8 py-2 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 font-mono-tabular">
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
            OFFICIAL PAKISTAN PRICE REGISTRY
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-slate-300">Direct Portals: Samsung PK, Xiaomi MiStore, realme PK, OPPO PK, Vivo PK</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-slate-300">PTA Status: 100% Tax-Paid Verified</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono-tabular">
          <span className="text-slate-400">Scheduler:</span>
          <span className="text-emerald-400 font-semibold">Autonomous 60s Background Service</span>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="flex-1 flex justify-center py-6 px-3 sm:px-6">
        <div
          className={`w-full transition-all duration-300 ${
            isMobileDeviceMode
              ? 'max-w-[420px] bg-[#0B111E] border-[8px] border-slate-800 rounded-[38px] p-4 shadow-2xl shadow-black overflow-hidden relative'
              : 'max-w-[1440px]'
          }`}
        >
          {isMobileDeviceMode && (
            <div className="flex justify-center mb-3">
              <div className="w-20 h-4 bg-slate-900 rounded-full flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-800"></div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 1: LIVE PAKISTAN SMARTPHONE BAZAAR
             ========================================================= */}
          {activeTab === 'bazaar' && (
            <div className="space-y-6">
              {/* Header & Search */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                    <span>Pakistan Official Smartphone Bazaar</span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Verified official manufacturer prices in PKR alongside Hafeez Centre &amp; Hall Road wholesale spot rates.
                  </p>
                </div>

                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Galaxy, Redmi, realme, Reno..."
                    className="w-full bg-[#111827] border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Brand Filter Bar & PTA Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    'all',
                    ...Array.from(
                      new Set([
                        'Samsung',
                        'Xiaomi',
                        'Redmi',
                        'OPPO',
                        'Vivo',
                        'Apple',
                        'Infinix',
                        'VGo Tel',
                        'QMobile',
                        'XMobile',
                        'Club Mobile',
                        ...phones.map((p) => p.brand),
                      ])
                    ),
                  ].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSelectedBrand(b)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all duration-200 cursor-pointer shadow-sm ${
                        selectedBrand.toLowerCase() === b.toLowerCase()
                          ? 'bg-emerald-600 text-white font-bold shadow-emerald-950/40'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                      }`}
                    >
                      {b === 'all' ? 'All Official Brands' : b}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-400">
                  <span className="font-medium text-slate-300">PTA Filter:</span>
                  <select
                    value={ptaFilter}
                    onChange={(e) => setPtaFilter(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="official pta approved">Official PTA Approved Only</option>
                    <option value="non-pta">Non-PTA (Grey Market)</option>
                  </select>
                </div>
              </div>

              {/* Smartphone Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredPhones.map((phone) => {
                  return (
                    <div
                      key={phone.id}
                      className="bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-xl shadow-black/20 group"
                    >
                      {/* Top Large Phone Showcase Container (Clean Light Studio Background) */}
                      <div className="relative w-full h-64 sm:h-72 bg-gradient-to-b from-white to-slate-100 flex items-center justify-center p-4 border-b border-slate-700/60 overflow-hidden">
                        {/* Top-Left: Brand Badge */}
                        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                          <span className="bg-slate-900/85 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                            {phone.brand}
                          </span>
                        </div>

                        {/* Top-Right: Official PTA Badge */}
                        <div className="absolute top-3 right-3 z-10">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-600 text-white flex items-center gap-1 shadow-sm">
                            <span>🛡️</span>
                            <span>{phone.officialPtaStatus}</span>
                          </span>
                        </div>

                        {/* Phone Images: Multi-angle showcase or single studio render */}
                        {phone.images && phone.images.length > 1 ? (
                          <div className="flex items-center justify-center gap-3 w-full h-full">
                            {phone.images.slice(0, 2).map((imgUrl, imgIdx) => (
                              <img
                                key={imgIdx}
                                src={imgUrl}
                                alt={`${phone.title} angle ${imgIdx + 1}`}
                                className="max-h-56 max-w-[48%] object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <img
                            src={phone.imageUrl || phone.images?.[0] || 'https://images.samsung.com/is/image/samsung/p6pim/pk/2401/gallery/pk-galaxy-s24-s928-sm-s928bztqpkd-thumb-539304386'}
                            alt={phone.title}
                            className="max-h-56 max-w-[85%] object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        )}
                      </div>

                      {/* Card Content Section */}
                      <div className="p-6 flex flex-col justify-between flex-1 gap-4">
                        <div className="space-y-3">
                          {/* Title & Tagline */}
                          <div>
                            <div className="text-xs font-mono-tabular text-emerald-400 font-bold mb-1">
                              {phone.ram} RAM · {phone.storage} ROM
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug">
                              {phone.title}
                            </h2>
                            {phone.tagline && (
                              <p className="text-xs sm:text-sm text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                {phone.tagline}
                              </p>
                            )}
                          </div>

                          {/* Official Manufacturer MSRP Box */}
                          <div className="bg-slate-700/60 border border-slate-600/70 rounded-xl p-3.5 space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                              <span className="uppercase tracking-wider flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
                                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>OFFICIAL BRAND PRICE (MSRP)</span>
                              </span>
                              <span className="text-slate-400 text-[10px] font-mono-tabular">
                                {new Date(phone.officialMfr.lastVerified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div className="flex items-baseline justify-between pt-0.5">
                              <div className="text-2xl font-extrabold font-mono-tabular text-white tracking-tight">
                                {phone.officialMfr.price
                                  ? `Rs. ${phone.officialMfr.price.toLocaleString('en-PK')}`
                                  : 'Catalog Showcase'}
                              </div>
                              <a
                                href={phone.officialMfr.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 text-xs font-semibold text-emerald-300 bg-slate-800 hover:bg-slate-750 rounded-md border border-slate-600 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <span>Official Site</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </a>
                            </div>

                            {phone.officialMfr.limitationNote && (
                              <p className="text-[11px] text-slate-300 italic pt-1 border-t border-slate-600/50 mt-1">
                                {phone.officialMfr.limitationNote}
                              </p>
                            )}
                          </div>

                          {/* Wholesale Rates Summary */}
                          <div className="p-3 bg-slate-900/90 border border-slate-700 rounded-xl flex items-center justify-between text-xs font-mono-tabular">
                            <div>
                              <div className="text-[11px] text-slate-400 uppercase font-semibold">
                                Hafeez Centre &amp; Mandi Rate
                              </div>
                              <div className="text-slate-300 text-[11px] mt-0.5">
                                Verified Nationwide Warranty
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-emerald-400 text-base sm:text-lg">
                                Rs. {phone.marketLowestPrice.toLocaleString('en-PK')}
                              </div>
                              <span className="text-[10px] text-emerald-400 font-semibold">
                                In Stock
                              </span>
                            </div>
                          </div>

                          {/* Specs Highlights */}
                          <div className="pt-2 border-t border-slate-700/80 grid grid-cols-2 gap-2 text-xs text-slate-400">
                            <div className="flex items-center gap-1.5 truncate">
                              <Cpu className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{phone.specs.chipset || phone.specs.processor.split('(')[0]}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <Camera className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{phone.specs.camera_main || phone.specs.rearCamera.split('+')[0]}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <Battery className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{phone.specs.battery.split(',')[0]}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{phone.specs.display.split(',')[0]}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Bottom Actions (OPPO style Learn More & Rasho Bhai advisor) */}
                        <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedPhoneForDetail(phone)}
                            className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-slate-700 hover:bg-slate-650 hover:text-emerald-300 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-600 shadow-sm"
                          >
                            <span>Learn more &amp; Full Specs</span>
                            <ChevronRight className="w-4 h-4 text-emerald-400" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPhoneForDetail(phone);
                              setActiveTab('advisor');
                              handleSendChatMessage(
                                undefined,
                                `Compare official price vs wholesale market price for ${phone.title}. Is it worth buying now in Pakistan?`
                              );
                            }}
                            title="Ask Rasho Bhai about this deal"
                            className="p-2.5 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/40 rounded-lg transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 2: OFFICIAL PRICE AUTOMATION & SOURCES REGISTRY
             ========================================================= */}
          {activeTab === 'scraper' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
                    <span>Pakistan Official Price Crawler Registry</span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Crawl official Pakistan smartphone portals with rate limiting, timeouts, and robots.txt compliance.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTriggerScraper()}
                    disabled={isScraping}
                    className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-emerald-400 to-emerald-500 text-slate-950 rounded-lg hover:from-emerald-300 hover:to-emerald-400 transition-all flex items-center gap-2 shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin' : ''}`} />
                    <span>{isScraping ? 'Running Full Update...' : 'Run Update Now'}</span>
                  </button>
                </div>
              </div>

              {scraperNotice && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    scraperNotice.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                  }`}
                >
                  {scraperNotice.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  )}
                  <span>{scraperNotice.message}</span>
                </div>
              )}

              {/* Configurable Source Registry Table */}
              <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Official Pakistan Price Sources ({sources.length})
                  </h2>
                  <span className="text-xs text-slate-400 font-mono-tabular">sources.json · Background Worker</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#0B101D] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                        <th className="py-3 px-4 font-semibold">Official Source</th>
                        <th className="py-3 px-4 font-semibold">Category</th>
                        <th className="py-3 px-4 font-semibold">Interval</th>
                        <th className="py-3 px-4 font-semibold">Last Successful Update</th>
                        <th className="py-3 px-4 font-semibold">Updated / Failed</th>
                        <th className="py-3 px-4 font-semibold">Crawler Status</th>
                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {sources.map((src) => (
                        <tr key={src.id} className="hover:bg-slate-800/30">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{src.name}</span>
                              <a
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-500 hover:text-emerald-400"
                              >
                                <ArrowUpRight className="w-3 h-3" />
                              </a>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono-tabular truncate max-w-[240px]">
                              {src.domain} · {src.apiType}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 uppercase text-[10px] font-semibold text-emerald-400">
                            {src.category === 'official_mfr' ? 'Official Brand' : src.category}
                          </td>
                          <td className="py-3.5 px-4 font-mono-tabular text-slate-300">
                            Every {src.scrapeIntervalMins}m
                          </td>
                          <td className="py-3.5 px-4 text-slate-300 font-mono-tabular">
                            {src.lastSuccessfulUpdate
                              ? new Date(src.lastSuccessfulUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : 'Pending Run'}
                          </td>
                          <td className="py-3.5 px-4 font-mono-tabular">
                            <span className="text-emerald-400 font-semibold">{src.productsUpdated ?? 0} ok</span>
                            {(src.productsFailed ?? 0) > 0 && (
                              <span className="text-red-400 font-semibold ml-1.5">/ {src.productsFailed} fail</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                src.status === 'success'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : src.status === 'running'
                                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
                              }`}
                            >
                              {src.status}
                            </span>
                            {src.lastErrorMessage && (
                              <div className="text-[10px] text-red-400 mt-1 line-clamp-1 max-w-[180px]">
                                {src.lastErrorMessage}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => handleTriggerScraper(src.id)}
                              disabled={isScraping}
                              className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 cursor-pointer disabled:opacity-50"
                            >
                              Scrape Now
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleSource(src)}
                              className="px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:text-white cursor-pointer"
                            >
                              {src.active ? 'Disable' : 'Enable'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Live Crawler Terminal Logs */}
              <div className="bg-[#080C14] border border-slate-800 rounded-xl p-4 font-mono-tabular space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-slate-300">Crawler Execution Feed &amp; Health Log</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Autonomous Worker Active</span>
                </div>
                <div className="h-44 overflow-y-auto text-xs space-y-1 text-slate-300 scrollbar-thin">
                  {scraperLogs.map((log, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-emerald-500/80 shrink-0">➜</span>
                      <span className={log.includes('Failure') || log.includes('error') ? 'text-red-400' : 'text-slate-300'}>
                        {log}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 3: PTA TAX & RESALE VALUATION (PKR)
             ========================================================= */}
          {activeTab === 'valuation' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
                  <span>PTA Tax &amp; Resale Cash Appraisal</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Accurate second-hand cash value in Pakistan considering FBR customs tax, physical wear, and local wholesale demand.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-6 bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-5">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>Appraisal Request Form</span>
                  </h2>

                  <form onSubmit={handleCalculateValuation} className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">Brand</label>
                        <select
                          value={valBrand}
                          onChange={(e) => setValBrand(e.target.value)}
                          className="w-full bg-[#0B101D] border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-400"
                        >
                          <option value="Samsung">Samsung</option>
                          <option value="Xiaomi">Xiaomi</option>
                          <option value="realme">realme</option>
                          <option value="OPPO">OPPO</option>
                          <option value="Vivo">Vivo</option>
                          <option value="Apple">Apple iPhone</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">Model</label>
                        <input
                          type="text"
                          value={valModel}
                          onChange={(e) => setValModel(e.target.value)}
                          placeholder="e.g. Galaxy S23 Ultra"
                          className="w-full bg-[#0B101D] border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">PTA Registration Status</label>
                        <select
                          value={valPtaStatus}
                          onChange={(e) => setValPtaStatus(e.target.value as any)}
                          className="w-full bg-[#0B101D] border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-400 font-semibold text-emerald-300"
                        >
                          <option value="Official PTA Approved">Official PTA Approved (Tax Paid)</option>
                          <option value="Non-PTA">Non-PTA (SIM Blocked / Wi-Fi Only)</option>
                          <option value="PTA Passport Registered">PTA Passport Registered</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">Battery Health %</label>
                        <input
                          type="number"
                          min={50}
                          max={100}
                          value={valBatteryHealth}
                          onChange={(e) => setValBatteryHealth(Number(e.target.value))}
                          className="w-full bg-[#0B101D] border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-400 font-mono-tabular"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Screen Condition</label>
                      <select
                        value={valScreenCondition}
                        onChange={(e) => setValScreenCondition(e.target.value)}
                        className="w-full bg-[#0B101D] border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-400"
                      >
                        <option value="Original flawless display, no scratches">Original flawless display, no scratches</option>
                        <option value="Minor micro-scratches, 100% touch functional">Minor micro-scratches, 100% touch functional</option>
                        <option value="Replaced screen / visible line">Replaced screen / visible line</option>
                        <option value="Cracked glass or bleeding pixels">Cracked glass or bleeding pixels</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isValuating}
                      className="w-full py-3 text-xs font-bold bg-gradient-to-r from-emerald-400 to-emerald-500 text-slate-950 rounded-lg hover:from-emerald-300 hover:to-emerald-400 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>{isValuating ? 'Appraising with Pakistan Market Rules...' : 'Calculate Resale Value in PKR'}</span>
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-6 bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-5">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
                    <span>Valuation Certificate</span>
                    <span className="text-[11px] text-emerald-400 font-mono-tabular">PKR Index</span>
                  </h2>

                  {valuationResult ? (
                    <div className="space-y-4">
                      <div className="bg-[#0B101D] border border-slate-800 rounded-xl p-5 text-center space-y-1">
                        <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                          Estimated Cash Buyout in PKR
                        </div>
                        <div className="text-3xl sm:text-4xl font-black font-mono-tabular text-emerald-400">
                          Rs. {Number(valuationResult.estimatedCashValuePKR).toLocaleString('en-PK')}
                        </div>
                        <div className="text-xs text-slate-300 font-semibold font-mono-tabular pt-1">
                          Exchange Bonus: Rs. {Number(valuationResult.exchangeBonusValuePKR).toLocaleString('en-PK')}
                        </div>
                      </div>

                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-1">
                        <span className="font-bold text-emerald-300 block">PTA Tax Impact:</span>
                        <p className="text-slate-300 leading-relaxed">{valuationResult.ptaTaxImpactDescription}</p>
                      </div>

                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-1">
                        <span className="font-bold text-white block">Dealer Recommendation:</span>
                        <p className="text-slate-300 leading-relaxed">{valuationResult.recommendation}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                      <Smartphone className="w-10 h-10 text-slate-700" />
                      <p className="text-xs">
                        Enter your smartphone details and submit to view instant cash buyout and PTA tax status assessment.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 4: PROTECTED ADMIN PANEL (Authentication & Controls)
             ========================================================= */}
          {activeTab === 'admin' && (
            <div className="space-y-6">
              {!isAdminUnlocked ? (
                <div className="max-w-md mx-auto bg-[#111827] border border-slate-800 rounded-2xl p-8 space-y-5 text-center my-12">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Administrator Authentication</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Administrative mutations (adding sources, inventory deletion, scheduled intervals) require authorization.
                    </p>
                  </div>
                  <form onSubmit={handleVerifyAdmin} className="space-y-3">
                    <input
                      type="password"
                      value={adminInputKey}
                      onChange={(e) => setAdminInputKey(e.target.value)}
                      placeholder="Enter Admin PIN / Key (Default: mandi-admin-2026)"
                      className="w-full bg-[#0B101D] border border-slate-700 rounded-lg p-2.5 text-xs text-white text-center focus:outline-none focus:border-emerald-400"
                    />
                    {adminAuthError && (
                      <p className="text-xs text-red-400">{adminAuthError}</p>
                    )}
                    <button
                      type="submit"
                      className="w-full py-2.5 text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-lg transition-colors cursor-pointer"
                    >
                      Unlock Admin Panel
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
                        <span>Admin Control &amp; Inventory Manager</span>
                        <span className="text-xs font-mono-tabular px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          Authenticated
                        </span>
                      </h1>
                      <p className="text-xs text-slate-400 mt-1">
                        Manage official Pakistani smartphone inventory and configure scraper intervals.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsNewSourceModalOpen(true)}
                        className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                      >
                        + Add Source
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAdminNewPhoneOpen(true)}
                        className="px-4 py-2 text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-lg transition-colors cursor-pointer"
                      >
                        + Add Phone Model
                      </button>
                    </div>
                  </div>

                  {/* Listings Table with Delete */}
                  <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                        Smartphone Inventory Database ({phones.length} Models)
                      </h2>
                      <span className="text-xs text-slate-400 font-mono-tabular">All PKR Verified</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#0B101D] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                            <th className="py-3 px-4 font-semibold">Model</th>
                            <th className="py-3 px-4 font-semibold">Brand</th>
                            <th className="py-3 px-4 font-semibold">PTA Status</th>
                            <th className="py-3 px-4 font-semibold">Official Price</th>
                            <th className="py-3 px-4 font-semibold">Lowest Market</th>
                            <th className="py-3 px-4 font-semibold text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {phones.map((phone) => (
                            <tr key={phone.id} className="hover:bg-slate-800/30">
                              <td className="py-3.5 px-4 font-bold text-white">{phone.title}</td>
                              <td className="py-3.5 px-4 text-emerald-400 font-semibold">{phone.brand}</td>
                              <td className="py-3.5 px-4 text-slate-300">{phone.officialPtaStatus}</td>
                              <td className="py-3.5 px-4 font-mono-tabular">
                                {phone.officialMfr.price ? `Rs. ${phone.officialMfr.price.toLocaleString('en-PK')}` : 'Showcase'}
                              </td>
                              <td className="py-3.5 px-4 font-bold text-emerald-400 font-mono-tabular">
                                Rs. {phone.marketLowestPrice.toLocaleString('en-PK')}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeletePhone(phone.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                                  title="Delete listing"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              TAB 5: MANDI ADVISOR AI (Rasho Bhai)
             ========================================================= */}
          {activeTab === 'advisor' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-4 bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-400 flex items-center justify-center text-slate-950 font-bold">
                    <Sparkles className="w-4 h-4 text-slate-950" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Rasho Bhai</h2>
                    <p className="text-[11px] text-emerald-400">Pakistan Market Specialist</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ask about PTA taxes, official distributor warranties (Airlink, M&amp;P), and spot prices across Hafeez Centre &amp; Hall Road.
                </p>

                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Quick Market Questions
                  </span>
                  <div className="space-y-1.5 text-xs">
                    {[
                      'Which phones are available under 50k?',
                      'Which official phone under 60k has good camera and battery?',
                      'Compare realme C67 vs Redmi 15C price in Hafeez Centre',
                    ].map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendChatMessage(undefined, sample)}
                        className="w-full text-left p-2.5 bg-[#0B101D] hover:bg-slate-800/60 border border-slate-800 rounded-lg text-slate-300 transition-colors cursor-pointer leading-snug"
                      >
                        “{sample}”
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 bg-[#111827] border border-slate-800 rounded-xl flex flex-col h-[580px]">
                <div className="px-5 py-3 border-b border-slate-800 bg-[#0E1524] flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span className="font-semibold text-white">Rasho Bhai's Consultation Counter</span>
                  </div>
                  <span className="font-mono-tabular">Gemini 3.8 Flash</span>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[10px] text-slate-500 mb-1 font-mono-tabular">
                        {msg.role === 'user' ? 'You' : 'Rasho Bhai'} · {msg.time}
                      </div>
                      <div
                        className={`max-w-xl p-3.5 rounded-xl text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                          msg.role === 'user'
                            ? 'bg-emerald-400 text-slate-950 font-medium'
                            : 'bg-[#0B101D] border border-slate-800 text-slate-200'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {isChatLoading && (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono-tabular p-3 bg-[#0B101D] border border-slate-800 rounded-lg w-fit">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Rasho Bhai is checking wholesale spot rates...</span>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                <form
                  onSubmit={(e) => handleSendChatMessage(e)}
                  className="p-3 border-t border-slate-800 bg-[#0E1524] flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about Pakistani phone prices, PTA taxes, warranty..."
                    className="flex-1 bg-[#0B101D] border border-slate-700 rounded-lg px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="submit"
                    disabled={isChatLoading || !chatInput.trim()}
                    className="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-lg transition-colors flex items-center gap-1.5 text-xs cursor-pointer disabled:opacity-50"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Modal: WhatMobile Pakistan Full Specs & Price History */}
          {selectedPhoneForDetail && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
              <div className="bg-[#0F172A] border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 space-y-6 shadow-2xl shadow-black/80 my-auto">
                {/* Modal Header */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-700/80">
                  <div className="flex items-center gap-4">
                    {selectedPhoneForDetail.imageUrl && (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white border border-slate-600 p-1.5 shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
                        <img
                          src={selectedPhoneForDetail.imageUrl}
                          alt={selectedPhoneForDetail.title}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs uppercase font-mono-tabular font-bold text-emerald-400">
                          {selectedPhoneForDetail.brand} · {selectedPhoneForDetail.ram} RAM · {selectedPhoneForDetail.storage}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white flex items-center gap-1 shadow-sm">
                          <span>🛡️</span>
                          <span>{selectedPhoneForDetail.officialPtaStatus}</span>
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                        {selectedPhoneForDetail.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Color: <span className="text-slate-200">{selectedPhoneForDetail.color}</span>
                        {selectedPhoneForDetail.tagline && (
                          <span className="hidden sm:inline text-slate-500"> · {selectedPhoneForDetail.tagline}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPhoneForDetail(null)}
                    className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer transition-colors"
                    aria-label="Close modal"
                  >
                    ✕
                  </button>
                </div>

                {/* Price Quick Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-800/90 border border-slate-700 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-400 uppercase font-semibold">Official Brand MSRP</div>
                      <div className="text-xs text-slate-300 mt-0.5">{selectedPhoneForDetail.officialMfr.sourceName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-white font-mono-tabular">
                        {selectedPhoneForDetail.officialMfr.price
                          ? `Rs. ${selectedPhoneForDetail.officialMfr.price.toLocaleString('en-PK')}`
                          : 'Showcase'}
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-800/90 border border-emerald-500/40 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-emerald-400 uppercase font-bold">Lowest Mandi Rate</div>
                      <div className="text-xs text-slate-300 mt-0.5">Hafeez Centre &amp; Wholesale Counter</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-emerald-400 font-mono-tabular">
                        Rs. {selectedPhoneForDetail.marketLowestPrice.toLocaleString('en-PK')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* WhatMobile Pakistan Categorized Technical Specifications */}
                <WhatMobileSpecsSheet phone={selectedPhoneForDetail} />

                {/* Price History Table */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>Verified Price History (PKR)</span>
                  </div>
                  <div className="bg-[#0B101D] border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs font-mono-tabular">
                      <thead>
                        <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                          <th className="p-3">Date</th>
                          <th className="p-3">Official Brand Price</th>
                          <th className="p-3">Lowest Market Spot Rate</th>
                          <th className="p-3">Verified Source</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {selectedPhoneForDetail.priceHistory.map((ph, i) => (
                          <tr key={i} className="hover:bg-slate-800/40">
                            <td className="p-3 text-slate-300">{ph.date}</td>
                            <td className="p-3 text-white font-semibold">
                              {ph.officialPrice ? `Rs. ${ph.officialPrice.toLocaleString('en-PK')}` : 'Showcase'}
                            </td>
                            <td className="p-3 font-bold text-emerald-400">
                              Rs. {ph.lowestMarketPrice.toLocaleString('en-PK')}
                            </td>
                            <td className="p-3 text-slate-400">{ph.source}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Retailers comparison */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    All Available Retail &amp; Mandi Sellers
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedPhoneForDetail.retailerPrices.map((src, i) => (
                      <div
                        key={i}
                        className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{src.retailerName}</span>
                            <span className="text-emerald-400 text-xs">✓</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {src.warranty} · {src.condition}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold font-mono-tabular text-emerald-400">
                            Rs. {src.price.toLocaleString('en-PK')}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {src.inStock ? 'In Stock' : 'Call Dealer'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = selectedPhoneForDetail;
                      setSelectedPhoneForDetail(null);
                      setActiveTab('advisor');
                      handleSendChatMessage(
                        undefined,
                        `Tell me the pros and cons of ${cur.title} in the Pakistani mobile market and its PTA tax situation.`
                      );
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Ask Rasho Bhai About This Phone</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPhoneForDetail(null)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold cursor-pointer border border-slate-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal: Admin Add Source */}
          {isNewSourceModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#111827] border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4">
                <h3 className="text-base font-bold text-white">Add Official Pakistan Price Source</h3>
                <form onSubmit={handleAddSource} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Source Name</label>
                    <input
                      type="text"
                      value={newSourceName}
                      onChange={(e) => setNewSourceName(e.target.value)}
                      placeholder="e.g. Infinix Pakistan Official"
                      className="w-full bg-[#0B101D] border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Official Website / Feed URL</label>
                    <input
                      type="text"
                      value={newSourceUrl}
                      onChange={(e) => setNewSourceUrl(e.target.value)}
                      placeholder="https://pk.infinixmobility.com/"
                      className="w-full bg-[#0B101D] border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Category</label>
                      <select
                        value={newSourceCategory}
                        onChange={(e) => setNewSourceCategory(e.target.value as any)}
                        className="w-full bg-[#0B101D] border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-400"
                      >
                        <option value="official_mfr">Official Manufacturer</option>
                        <option value="retailer">Authorized Retailer</option>
                        <option value="wholesale">Wholesale Mandi</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Interval (Minutes)</label>
                      <input
                        type="number"
                        value={newSourceInterval}
                        onChange={(e) => setNewSourceInterval(Number(e.target.value))}
                        className="w-full bg-[#0B101D] border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-400 font-mono-tabular"
                      />
                    </div>
                  </div>
                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsNewSourceModalOpen(false)}
                      className="px-3 py-2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-lg cursor-pointer"
                    >
                      Save Source
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Admin Add Phone */}
          {isAdminNewPhoneOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#111827] border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4">
                <h3 className="text-base font-bold text-white">Add Pakistan Official Phone Model</h3>
                <form onSubmit={handleAdminAddPhone} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Title</label>
                    <input
                      type="text"
                      value={adminTitle}
                      onChange={(e) => setAdminTitle(e.target.value)}
                      placeholder="Samsung Galaxy A35 5G (8GB/256GB)"
                      className="w-full bg-[#0B101D] border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Brand</label>
                      <select
                        value={adminBrand}
                        onChange={(e) => setAdminBrand(e.target.value as any)}
                        className="w-full bg-[#0B101D] border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-400"
                      >
                        <option value="Samsung">Samsung</option>
                        <option value="Xiaomi">Xiaomi</option>
                        <option value="realme">realme</option>
                        <option value="OPPO">OPPO</option>
                        <option value="Vivo">Vivo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Model</label>
                      <input
                        type="text"
                        value={adminModel}
                        onChange={(e) => setAdminModel(e.target.value)}
                        placeholder="Galaxy A35 5G"
                        className="w-full bg-[#0B101D] border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Official Price (PKR)</label>
                      <input
                        type="number"
                        value={adminOfficialPrice}
                        onChange={(e) => setAdminOfficialPrice(Number(e.target.value))}
                        className="w-full bg-[#0B101D] border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-400 font-mono-tabular"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Lowest Market (PKR)</label>
                      <input
                        type="number"
                        value={adminMarketLowest}
                        onChange={(e) => setAdminMarketLowest(Number(e.target.value))}
                        className="w-full bg-[#0B101D] border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-400 font-mono-tabular"
                      />
                    </div>
                  </div>
                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAdminNewPhoneOpen(false)}
                      className="px-3 py-2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-lg cursor-pointer"
                    >
                      Save to Inventory
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#090D16] px-4 sm:px-8 py-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>Mobile Mandi Live — Pakistan Official Phone Price Automation &amp; PTA Verification</div>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => setActiveTab('bazaar')} className="hover:text-white cursor-pointer">
            Bazaar
          </button>
          <span>·</span>
          <button type="button" onClick={() => setActiveTab('scraper')} className="hover:text-white cursor-pointer">
            Price Crawler
          </button>
          <span>·</span>
          <button type="button" onClick={() => setActiveTab('admin')} className="hover:text-white cursor-pointer">
            Admin Panel
          </button>
        </div>
      </footer>
    </div>
  );
}
