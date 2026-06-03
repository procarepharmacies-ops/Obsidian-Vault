import { useState, useEffect } from 'react';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  Store,
  Clock,
  RefreshCw,
  Search,
  Sun,
  Moon,
  ShieldCheck,
  PackageCheck,
  Database,
  Calendar,
  Layers,
  DollarSign,
  Users,
  CheckCircle2,
  Zap,
  MessageSquare
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

// API Base URL
const API_BASE = 'http://localhost:8000/api/v1';

// Interfaces corresponding to backend schemas
interface DashboardStats {
  today_revenue: number;
  today_transactions: number;
  low_stock_count: number;
}

interface RecentTransaction {
  sales_id: number;
  bill_number: string;
  total_bill_net: number;
  bill_date: string;
  branch_name: string;
}

interface DailyRevenue {
  date: string;
  revenue_egp: number;
  branch: string;
}

interface InventoryItem {
  product_id: number;
  product_code: string;
  name_ar: string;
  name_en: string;
  stock_amount: number;
  sell_price: number;
  expiry_date: string | null;
  branch?: string;
}

interface CashFlowPoint {
  date: string;
  inflow: number;
  outflow: number;
  net: number;
}

interface CashFlowSummary {
  cash_on_hand: number;
  monthly_inflow: number;
  monthly_outflow: number;
  net_cash_flow: number;
}

interface Employee {
  id: number;
  name: string;
  role: string;
  branch: string;
  salary_egp: number;
  shift: string;
  status: string;
}

interface PurchaseRec {
  product_code: string;
  name_ar: string;
  name_en: string;
  current_stock: number;
  recommended_order: number;
  estimated_cost_egp: number;
  urgency: string;
  pareto_core: boolean;
  branch: string;
}

interface LoyaltyMember {
  customer_id: number;
  name: string;
  phone: string;
  total_purchases_egp: number;
  loyalty_points: number;
  tier: string;
  last_purchase_date: string;
}

interface InteractionResponse {
  drug1: string;
  drug2: string;
  risk_level: string;
  mechanism: string;
  recommendation: string;
}

interface OtcRecommendation {
  symptom: string;
  recommended_actives: string[];
  brand_alternatives_in_stock: string[];
  dosing_instructions: string;
  red_flags: string;
}

function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

  // Active Tab: dashboard, inventory, cashflow, schedule, purchasing, clinical, loyalty
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'cashflow' | 'schedule' | 'purchasing' | 'clinical' | 'loyalty'>('dashboard');

  // API Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSales, setRecentSales] = useState<RecentTransaction[]>([]);
  const [dailySales, setDailySales] = useState<DailyRevenue[]>([]);
  const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
  
  // New States for Cashflow, Scheduler, and AI Procurement
  const [cashSummary, setCashSummary] = useState<CashFlowSummary | null>(null);
  const [cashChart, setCashChart] = useState<CashFlowPoint[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [purchasingRecs, setPurchasingRecs] = useState<PurchaseRec[]>([]);
  const [purchasingSummary, setPurchasingSummary] = useState<{ total_cost: number; critical_count: number } | null>(null);

  // Advanced States: Loyalty Program & Clinical AI
  const [loyaltyMembers, setLoyaltyMembers] = useState<LoyaltyMember[]>([]);
  const [loyaltySearch, setLoyaltySearch] = useState<string>('');
  const [sendingAlertId, setSendingAlertId] = useState<number | null>(null);
  const [alertSuccessId, setAlertSuccessId] = useState<number | null>(null);
  
  const [clinicalDrug1, setClinicalDrug1] = useState<string>('');
  const [clinicalDrug2, setClinicalDrug2] = useState<string>('');
  const [interactionResult, setInteractionResult] = useState<InteractionResponse | null>(null);
  const [checkingInteractions, setCheckingInteractions] = useState<boolean>(false);
  
  const [otcSymptom, setOtcSymptom] = useState<string>('');
  const [otcResult, setOtcResult] = useState<OtcRecommendation | null>(null);
  const [checkingOtc, setCheckingOtc] = useState<boolean>(false);

  // UI Filter states
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [inventorySearch, setInventorySearch] = useState<string>('');
  const [inventoryBranchFilter, setInventoryBranchFilter] = useState<'All' | 'Santa' | 'Masala'>('All');
  
  const [purchaseSearch, setPurchaseSearch] = useState<string>('');
  const [purchaseBranchFilter, setPurchaseBranchFilter] = useState<'All' | 'Santa' | 'Masala'>('All');
  const [purchaseParetoOnly, setPurchaseParetoOnly] = useState<boolean>(false);

  // Apply dark class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Fetch all dashboard data from live FastAPI backend
  const fetchDashboardData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Parallel fetches for optimum speed and UX response
      const [
        statsRes, recentRes, dailyRes, inventoryRes, 
        cashflowRes, scheduleRes, purchasingRes, loyaltyRes
      ] = await Promise.all([
        fetch(`${API_BASE}/sales/stats`),
        fetch(`${API_BASE}/sales/recent`),
        fetch(`${API_BASE}/sales/daily`),
        fetch(`${API_BASE}/inventory/?limit=50`),
        fetch(`${API_BASE}/cashflow/`),
        fetch(`${API_BASE}/schedule/`),
        fetch(`${API_BASE}/purchasing/`),
        fetch(`${API_BASE}/loyalty/members`)
      ]);

      if (
        !statsRes.ok || !recentRes.ok || !dailyRes.ok || !inventoryRes.ok ||
        !cashflowRes.ok || !scheduleRes.ok || !purchasingRes.ok || !loyaltyRes.ok
      ) {
        throw new Error('Connection failed on some SQL Servers. Re-routing dynamic gateways...');
      }

      const statsData: DashboardStats = await statsRes.json();
      const recentData: RecentTransaction[] = await recentRes.json();
      const dailyData: DailyRevenue[] = await dailyRes.json();
      const inventoryData: InventoryItem[] = await inventoryRes.json();
      const cashflowData = await cashflowRes.json();
      const scheduleData = await scheduleRes.json();
      const purchasingData = await purchasingRes.json();
      const loyaltyData: LoyaltyMember[] = await loyaltyRes.json();

      setStats(statsData);
      setRecentSales(recentData);
      setDailySales(dailyData);
      setLowStock(inventoryData);
      
      // Set Cash Flow State
      setCashSummary(cashflowData.summary);
      setCashChart(cashflowData.chart_data);
      
      // Set Employee Scheduler State
      setEmployees(scheduleData.employees);
      
      // Set AI Purchasing State
      setPurchasingRecs(purchasingData.recommendations);
      setPurchasingSummary({
        total_cost: purchasingData.total_order_cost_egp,
        critical_count: purchasingData.critical_replenish_count
      });

      // Set Loyalty Members State
      setLoyaltyMembers(loyaltyData);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Connection lost. Retrying backend links...');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch on mount & set up 10-second polling for live SQL streams
  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(() => {
      // Auto-poll silently in the background
      fetchDashboardData(false);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Trigger Drug-Drug Interaction Check
  const checkDrugInteractions = async () => {
    if (!clinicalDrug1 || !clinicalDrug2) return;
    setCheckingInteractions(true);
    setInteractionResult(null);
    try {
      const res = await fetch(`${API_BASE}/clinical/interactions?drug1=${encodeURIComponent(clinicalDrug1)}&drug2=${encodeURIComponent(clinicalDrug2)}`);
      if (res.ok) {
        const data = await res.json();
        setInteractionResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingInteractions(false);
    }
  };

  // Trigger symptom-based OTC lookup
  const checkOtcAlternatives = async (customSymptom?: string) => {
    const querySymptom = customSymptom || otcSymptom;
    if (!querySymptom) return;
    setCheckingOtc(true);
    setOtcResult(null);
    try {
      const res = await fetch(`${API_BASE}/clinical/otc-recommendations?symptom=${encodeURIComponent(querySymptom)}`);
      if (res.ok) {
        const data = await res.json();
        setOtcResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingOtc(false);
    }
  };

  // Trigger WhatsApp Loyalty Alert Notification
  const triggerWhatsAppAlert = async (id: number) => {
    setSendingAlertId(id);
    setAlertSuccessId(null);
    try {
      const res = await fetch(`${API_BASE}/loyalty/send-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: id })
      });
      if (res.ok) {
        setAlertSuccessId(id);
        // Clear success notification after 4 seconds
        setTimeout(() => {
          setAlertSuccessId(prev => prev === id ? null : prev);
        }, 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSendingAlertId(null);
    }
  };

  // Filters for Loyalty Members
  const filteredLoyaltyMembers = loyaltyMembers.filter(m => {
    const term = loyaltySearch.toLowerCase();
    return m.name.toLowerCase().includes(term) || m.phone.includes(term);
  });

  // Format Recharts daily data to align by date with branch-separated fields
  const getChartData = () => {
    const chartMap: { [date: string]: any } = {};

    dailySales.forEach(item => {
      // Format datetime to readable date
      const dateStr = new Date(item.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

      if (!chartMap[dateStr]) {
        chartMap[dateStr] = { date: dateStr, Santa: 0, Masala: 0, Total: 0 };
      }

      const isSanta = item.branch.toLowerCase().includes('santa');
      const val = parseFloat(item.revenue_egp.toFixed(2));
      
      if (isSanta) {
        chartMap[dateStr].Santa = val;
      } else {
        chartMap[dateStr].Masala = val;
      }
      
      chartMap[dateStr].Total = parseFloat((chartMap[dateStr].Santa + chartMap[dateStr].Masala).toFixed(2));
    });

    // Return chronological order (reverse from DB desc list)
    return Object.values(chartMap).reverse();
  };

  const chartData = getChartData();

  // Filters for low-stock inventory
  const filteredInventory = lowStock.filter(item => {
    const term = inventorySearch.toLowerCase();
    const matchesSearch = 
      item.name_en.toLowerCase().includes(term) ||
      item.name_ar.includes(term) ||
      item.product_code.includes(term);
      
    const matchesBranch = 
      inventoryBranchFilter === 'All' || 
      (item.branch && item.branch.toLowerCase() === inventoryBranchFilter.toLowerCase());
      
    return matchesSearch && matchesBranch;
  });

  // Filters for AI Purchasing
  const filteredPurchasing = purchasingRecs.filter(item => {
    const term = purchaseSearch.toLowerCase();
    const matchesSearch = 
      item.name_en.toLowerCase().includes(term) ||
      item.name_ar.includes(term) ||
      item.product_code.includes(term);
      
    const matchesBranch = 
      purchaseBranchFilter === 'All' || 
      item.branch.toLowerCase() === purchaseBranchFilter.toLowerCase();
      
    const matchesPareto = !purchaseParetoOnly || item.pareto_core;
    
    return matchesSearch && matchesBranch && matchesPareto;
  });

  // Calculate Average Invoice Value (EGP)
  const averageTicket = stats && stats.today_transactions > 0 
    ? stats.today_revenue / stats.today_transactions 
    : 0;

  return (
    <div className="min-h-screen transition-colors duration-300 antialiased font-sans pb-12">
      {/* Dynamic Glass Header */}
      <header className="sticky top-0 z-50 glass border-b shadow-sm px-6 py-4 mb-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Brand Logo & Slogan */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-pro-blue flex items-center justify-center glow-blue text-white shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-pro-blue to-pro-green opacity-40 mix-blend-overlay"></div>
              <Layers className="w-6 h-6 spin-slow" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white font-heading m-0 flex items-center gap-2">
                ProCare <span className="text-pro-blue dark:text-pro-green font-light">Pharmacy OS</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Dual Branch CEO KPI Control Center & Procurement OS
              </p>
            </div>
          </div>

          {/* Action Buttons, Dark Mode & Live SQL Badge */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Santa Connection Status */}
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-vitality animate-ping absolute"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-vitality relative"></span>
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Santa: Online
              </span>
            </div>

            {/* Masala Connection Status */}
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full" title="Masala Server timed out. Autonomic fallback mode is active.">
              <span className="w-2 h-2 rounded-full bg-amber-500 pulse-vitality relative"></span>
              <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Masala: Fallback
              </span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing || loading}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50 group cursor-pointer"
              title="Sync Live SQL Data"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : 'group-hover:rotate-45 duration-300'}`} />
            </button>

            {/* Dark Mode Switcher */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
              title="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Workspace */}
      <main className="max-w-7xl mx-auto px-6">
        
        {/* Error Alert Reconnect Widget */}
        {error && (
          <div className="mb-8 p-4 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-between text-red-700 dark:text-red-400 glass">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 flex-shrink-0 text-red-500 pulse-vitality" />
              <div>
                <p className="font-semibold text-sm">Server Bridging Timeout Alert</p>
                <p className="text-xs opacity-90">{error}</p>
              </div>
            </div>
            <button
              onClick={() => fetchDashboardData()}
              className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold shadow-md hover:bg-red-600 transition-all cursor-pointer"
            >
              Force Dynamic Reconnect
            </button>
          </div>
        )}

        {/* Global Navigation - Beautiful Glass Tabs */}
        <section className="flex flex-wrap gap-2 p-2 rounded-2xl glass mb-8 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-pro-blue text-white shadow-md glow-blue'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4.5 h-4.5" />
            CEO KPI Dashboard
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-pro-blue text-white shadow-md glow-blue'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-4.5 h-4.5" />
            Inventory Health
          </button>
          <button
            onClick={() => setActiveTab('cashflow')}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'cashflow'
                ? 'bg-pro-blue text-white shadow-md glow-blue'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-4.5 h-4.5" />
            Treasure Cash Flow
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-pro-blue text-white shadow-md glow-blue'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4.5 h-4.5" />
            Employee Schedule
          </button>
          <button
            onClick={() => setActiveTab('purchasing')}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'purchasing'
                ? 'bg-pro-blue text-white shadow-md glow-blue'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4.5 h-4.5" />
            AI Predictive Purchasing (80% Rule)
          </button>
          <button
            onClick={() => setActiveTab('clinical')}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'clinical'
                ? 'bg-pro-blue text-white shadow-md glow-blue'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4.5 h-4.5" />
            AI Clinical Assistant
          </button>
          <button
            onClick={() => setActiveTab('loyalty')}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'loyalty'
                ? 'bg-pro-blue text-white shadow-md glow-blue'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4.5 h-4.5" />
            WhatsApp Loyalty Alerts
          </button>
        </section>

        {/* --------------------- TAB 1: CEO KPI DASHBOARD --------------------- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Executive Summary stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Today's Unified Revenue */}
              <div className="glass rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-pro-blue/5 rounded-bl-full pointer-events-none group-hover:scale-110 duration-500"></div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Today's Consolidated Sales
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-pro-blue/15 text-pro-blue flex items-center justify-center glow-blue">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  {loading ? (
                    <div className="h-9 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                  ) : (
                    <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                      {stats ? stats.today_revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                      <span className="text-sm font-semibold text-pro-blue ml-1.5 dark:text-slate-400">EGP</span>
                    </h3>
                  )}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-xs text-emerald-500 dark:text-emerald-400 font-bold">Consolidated</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      Real-time Santa & Masala Sales
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Today's Transactions */}
              <div className="glass rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-pro-green/5 rounded-bl-full pointer-events-none group-hover:scale-110 duration-500"></div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Consolidated Invoices
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-pro-green/15 text-pro-green flex items-center justify-center glow-green">
                    <Activity className="w-5 h-5 text-pro-green" />
                  </div>
                </div>
                <div>
                  {loading ? (
                    <div className="h-9 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                  ) : (
                    <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                      {stats ? stats.today_transactions : '0'}
                      <span className="text-xs font-medium text-slate-400 ml-1">invoices</span>
                    </h3>
                  )}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      Total sales invoices processed today
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Average Basket Value (CEO KPI) */}
              <div className="glass rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 duration-500"></div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Avg Basket Value (KPI)
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-amber-500" />
                  </div>
                </div>
                <div>
                  {loading ? (
                    <div className="h-9 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                  ) : (
                    <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                      {averageTicket.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="text-sm font-semibold text-amber-500 ml-1.5">EGP</span>
                    </h3>
                  )}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      Average revenue net per customer bill
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 4: Critical Low Stock Count */}
              <div className="glass rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 duration-500"></div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Critical Out-of-Stocks
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-500 pulse-vitality" />
                  </div>
                </div>
                <div>
                  {loading ? (
                    <div className="h-9 w-16 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                  ) : (
                    <h3 className="text-3xl font-extrabold text-red-500 dark:text-red-400 tracking-tight">
                      {stats ? stats.low_stock_count : '0'}
                      <span className="text-xs font-medium text-slate-400 ml-1">items</span>
                    </h3>
                  )}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-xs text-red-500 font-bold">Below 15 Units</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      Requires urgent ordering
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Central Dashboard Workspace: Revenue trends on left, live stream invoices on right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Sales Performance Area Graph */}
              <div className="lg:col-span-2 glass rounded-3xl p-6 dark:border-slate-800">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white font-heading m-0">
                      Consolidated Revenue Flow (Last 7 Days)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Direct multi-server comparison: Santa & Masala branch sales trends.
                    </p>
                  </div>
                  
                  {/* Legend badges */}
                  <div className="flex gap-4 text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <span className="w-3 h-3 rounded bg-pro-blue"></span>
                      Santa Branch
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <span className="w-3 h-3 rounded bg-pro-green"></span>
                      Masala Branch
                    </span>
                  </div>
                </div>

                <div className="h-80 w-full">
                  {loading ? (
                    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
                  ) : chartData.length === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                      <Database className="w-12 h-12 stroke-1 mb-2 animate-bounce" />
                      <p className="text-sm font-semibold">No recent financial data found in SQL Server</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorSanta" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0c72bc" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#0c72bc" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="colorMasala" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8bc34a" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#8bc34a" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(203, 213, 225, 0.2)" />
                        <XAxis
                          dataKey="date"
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => `${val.toLocaleString()} EGP`}
                        />
                        <Tooltip
                          formatter={(value: any) => [`${parseFloat(value).toLocaleString()} EGP`]}
                          contentStyle={{
                            backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                          }}
                          labelStyle={{ fontWeight: 'bold', color: darkMode ? '#f1f5f9' : '#1e293b' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="Santa"
                          name="Santa Sales"
                          stroke="#0c72bc"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorSanta)"
                        />
                        <Area
                          type="monotone"
                          dataKey="Masala"
                          name="Masala Sales"
                          stroke="#8bc34a"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorMasala)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Live Invoice Feeds Panel */}
              <div className="glass rounded-3xl p-6 dark:border-slate-800 flex flex-col h-[420px] lg:h-auto">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white font-heading m-0 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-pro-blue spin-slow" />
                      Live Invoices Feed
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Consolidated transaction feed.
                    </p>
                  </div>
                  <span className="text-[10px] bg-pro-blue/15 text-pro-blue dark:text-slate-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    Realtime
                  </span>
                </div>

                {/* Scrollable list */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[300px] lg:max-h-[340px]">
                  {loading ? (
                    <div className="space-y-4">
                      <div className="h-16 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
                      <div className="h-16 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
                    </div>
                  ) : recentSales.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                      <Database className="w-12 h-12 stroke-1 mb-2 text-slate-300" />
                      <p className="text-xs text-center">No sales records found inside database index</p>
                    </div>
                  ) : (
                    recentSales.map((sale, idx) => {
                      const isSanta = sale.branch_name.toLowerCase() === 'santa';
                      const saleTime = new Date(sale.bill_date).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      const saleDate = new Date(sale.bill_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      });

                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-pro-blue/20 dark:hover:border-pro-blue/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-all flex justify-between items-center gap-3 group relative overflow-hidden"
                        >
                          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isSanta ? 'bg-pro-blue' : 'bg-pro-green'}`}></div>
                          <div className="pl-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                                INV #{sale.bill_number}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                isSanta 
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              }`}>
                                {isSanta ? 'Santa' : 'Masala'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                              <Calendar className="w-3 h-3" />
                              <span>{saleDate} at {saleTime}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-extrabold text-slate-800 dark:text-white text-sm">
                              {sale.total_bill_net.toFixed(2)}
                              <span className="text-[10px] font-semibold text-pro-blue dark:text-slate-400 ml-1">EGP</span>
                            </p>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 block">
                              Processed Net
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --------------------- TAB 2: INVENTORY HEALTH --------------------- */}
        {activeTab === 'inventory' && (
          <div className="glass rounded-3xl p-6 dark:border-slate-800 animate-fadeIn">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
              <div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-white font-heading m-0">
                  Low-Stock Pharmacy Tracker (Consolidated)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Active view of depleted stocks on both branch servers. Filter by branch.
                </p>
              </div>

              {/* Branch Filters & Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
                  {(['All', 'Santa', 'Masala'] as const).map((branch) => (
                    <button
                      key={branch}
                      onClick={() => setInventoryBranchFilter(branch)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        inventoryBranchFilter === branch
                          ? 'bg-pro-blue text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:text-pro-blue'
                      }`}
                    >
                      {branch}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search product code/name..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    className="w-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 pl-10 text-sm focus:outline-none focus:border-pro-blue focus:ring-1 focus:ring-pro-blue dark:text-white"
                  />
                  <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Product Low Stock Table */}
            <div className="overflow-x-auto rounded-xl">
              {loading ? (
                <div className="space-y-3 py-6">
                  <div className="h-10 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg"></div>
                  <div className="h-10 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg"></div>
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <PackageCheck className="w-16 h-16 stroke-1 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-semibold">No critical stock warnings found under this filter</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      <th className="py-3 px-4">Branch</th>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Product Name (EN / AR)</th>
                      <th className="py-3 px-4 text-center">Stock Level</th>
                      <th className="py-3 px-4 text-right">Retail Price</th>
                      <th className="py-3 px-4 text-right">Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {filteredInventory.map((item, idx) => {
                      const isSanta = item.branch && item.branch.toLowerCase() === 'santa';
                      const stockPercentage = Math.min((item.stock_amount / 15) * 100, 100);
                      
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="py-3 px-4">
                            <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                              isSanta 
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                              {item.branch}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-slate-500">{item.product_code}</td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-700 dark:text-slate-200">{item.name_en}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium text-right mt-0.5">{item.name_ar}</p>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col items-center gap-1 min-w-[120px]">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 pulse-vitality"></span>
                                {item.stock_amount.toFixed(2)} units
                              </span>
                              {/* Stock Health Bar */}
                              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                                <div 
                                  className="bg-red-500 h-full rounded-full" 
                                  style={{ width: `${stockPercentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-700 dark:text-slate-300">
                            {item.sell_price.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">EGP</span>
                          </td>
                          <td className="py-3 px-4 text-right text-xs text-slate-400 dark:text-slate-500 font-mono">
                            {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' }) : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* --------------------- TAB 3: TREASURE CASH FLOW --------------------- */}
        {activeTab === 'cashflow' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Cash metrics widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Cash On Hand */}
              <div className="glass rounded-3xl p-6 relative overflow-hidden dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Liquid Cash Reserves
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center glow-green">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>
                <div>
                  {loading ? (
                    <div className="h-9 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                  ) : (
                    <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                      {cashSummary ? cashSummary.cash_on_hand.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                      <span className="text-sm font-semibold text-emerald-500 ml-1.5">EGP</span>
                    </h3>
                  )}
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                    Cumulative Cash On Hand
                  </div>
                </div>
              </div>

              {/* Monthly Inflow */}
              <div className="glass rounded-3xl p-6 relative overflow-hidden dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Est. Monthly Inflow
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-pro-blue/15 text-pro-blue flex items-center justify-center glow-blue">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  {loading ? (
                    <div className="h-9 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                  ) : (
                    <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                      {cashSummary ? cashSummary.monthly_inflow.toLocaleString('en-US', { minimumFractionDigits: 0 }) : '0'}
                      <span className="text-sm font-semibold text-pro-blue ml-1.5">EGP</span>
                    </h3>
                  )}
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                    Consolidated Sales Inflow Forecast
                  </div>
                </div>
              </div>

              {/* Monthly Outflow */}
              <div className="glass rounded-3xl p-6 relative overflow-hidden dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Est. Monthly Outflow
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-red-500" />
                  </div>
                </div>
                <div>
                  {loading ? (
                    <div className="h-9 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                  ) : (
                    <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                      {cashSummary ? cashSummary.monthly_outflow.toLocaleString('en-US', { minimumFractionDigits: 0 }) : '0'}
                      <span className="text-sm font-semibold text-red-500 ml-1.5">EGP</span>
                    </h3>
                  )}
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                    Overheads & Procurements payables
                  </div>
                </div>
              </div>

              {/* Net Cash Flow */}
              <div className="glass rounded-3xl p-6 relative overflow-hidden dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Net Cash Flow Forecast
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-500 flex items-center justify-center glow-blue">
                    <Activity className="w-5 h-5 text-teal-500" />
                  </div>
                </div>
                <div>
                  {loading ? (
                    <div className="h-9 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                  ) : (
                    <h3 className="text-3xl font-extrabold text-teal-500 dark:text-teal-400 tracking-tight">
                      {cashSummary ? cashSummary.net_cash_flow.toLocaleString('en-US', { minimumFractionDigits: 0 }) : '0'}
                      <span className="text-sm font-semibold text-teal-500 ml-1.5">EGP</span>
                    </h3>
                  )}
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                    Estimated Net Cash Surplus / Mo
                  </div>
                </div>
              </div>
            </div>

            {/* Cash Inflow/Outflow Graphic & Log table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Cash flow Chart */}
              <div className="lg:col-span-2 glass rounded-3xl p-6 dark:border-slate-800">
                <h4 className="text-lg font-bold text-slate-800 dark:text-white font-heading mb-4">
                  Inflows vs Outflows (7-Day Financial Series)
                </h4>
                <div className="h-80 w-full">
                  {loading ? (
                    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cashChart}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(203, 213, 225, 0.2)" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val.toLocaleString()} EGP`} />
                        <Tooltip formatter={(value: any) => [`${parseFloat(value).toLocaleString()} EGP`]} />
                        <Legend wrapperStyle={{ fontSize: 12, fontWeight: 'bold' }} />
                        <Bar dataKey="inflow" name="Inflow (Sales)" fill="#0c72bc" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="outflow" name="Outflow (Expenses)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Cash Ledger */}
              <div className="glass rounded-3xl p-6 dark:border-slate-800 flex flex-col">
                <h4 className="text-lg font-bold text-slate-800 dark:text-white font-heading mb-4">
                  Daily Net Balance Ledger
                </h4>
                <div className="flex-1 overflow-y-auto space-y-4 max-h-[320px]">
                  {loading ? (
                    <div className="h-10 bg-slate-100 animate-pulse rounded"></div>
                  ) : (
                    cashChart.map((point, idx) => (
                      <div key={idx} className="p-3 border border-slate-100 dark:border-slate-800 rounded-2xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-extrabold text-slate-700 dark:text-slate-200">{point.date}</p>
                          <p className="text-[10px] text-slate-400">Net Surplus / Deficit</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${point.net >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {point.net >= 0 ? '+' : ''}{point.net.toLocaleString()} EGP
                          </p>
                          <p className="text-[9px] text-slate-400">
                            Inflow: {point.inflow.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --------------------- TAB 4: EMPLOYEE SCHEDULE --------------------- */}
        {activeTab === 'schedule' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Scheduler Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="glass rounded-3xl p-6 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Registered Team Members
                  </span>
                  <Users className="w-6 h-6 text-pro-blue" />
                </div>
                <h3 className="text-3xl font-extrabold">{employees.length} Staff</h3>
                <p className="text-[10px] text-slate-400 mt-2">Santa & Masala active rosters</p>
              </div>

              <div className="glass rounded-3xl p-6 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    On-Duty Now (Clocked In)
                  </span>
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-3xl font-extrabold text-emerald-500">
                  {employees.filter(e => e.status === "Clocked In").length} Present
                </h3>
                <p className="text-[10px] text-slate-400 mt-2">Active shifts logged in live</p>
              </div>

              <div className="glass rounded-3xl p-6 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Total Salary Overhead / Mo
                  </span>
                  <DollarSign className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-3xl font-extrabold">
                  {employees.reduce((acc, curr) => acc + curr.salary_egp, 0).toLocaleString()} EGP
                </h3>
                <p className="text-[10px] text-slate-400 mt-2">Payroll budget commitments</p>
              </div>
            </div>

            {/* Employee Directory grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {employees.map((emp) => {
                const clockedIn = emp.status === "Clocked In";
                const isOff = emp.status === "Off";
                
                // Get initials for profile placeholder
                const initials = emp.name.split(" ").map(w => w[0]).join("").slice(0, 2);
                
                return (
                  <div key={emp.id} className="glass rounded-3xl p-5 border border-slate-100 dark:border-slate-800 relative transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        clockedIn 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200' 
                          : isOff
                            ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200'
                      }`}>
                        {clockedIn && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-vitality"></span>}
                        {emp.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      {/* Premium Profile Visualizer */}
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pro-blue to-pro-green flex items-center justify-center font-heading font-extrabold text-white shadow-md text-sm">
                        {initials}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-700 dark:text-slate-200 text-base m-0">{emp.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{emp.role}</p>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span className="font-medium">Active Branch:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{emp.branch}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Working Hours:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{emp.shift}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Salary (EGP/Mo):</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{emp.salary_egp.toLocaleString()} EGP</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --------------------- TAB 5: AI PREDICTIVE PURCHASING (80% RULE) --------------------- */}
        {activeTab === 'purchasing' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Purchase Order Summary Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass rounded-3xl p-6 dark:border-slate-800 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-pro-blue/5 rounded-bl-full pointer-events-none group-hover:scale-110 duration-500"></div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Consolidated Purchase Order Cost
                  </span>
                  <DollarSign className="w-6 h-6 text-pro-blue" />
                </div>
                <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                  {purchasingSummary ? purchasingSummary.total_cost.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                  <span className="text-sm font-semibold text-pro-blue ml-1">EGP</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-2">Estimated cost at 75% retail value</p>
              </div>

              <div className="glass rounded-3xl p-6 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Critically Depleted Products
                  </span>
                  <AlertTriangle className="w-6 h-6 text-red-500 pulse-vitality" />
                </div>
                <h3 className="text-3xl font-extrabold text-red-500">
                  {purchasingSummary ? purchasingSummary.critical_count : '0'} SKUs
                </h3>
                <p className="text-[10px] text-slate-400 mt-2">Products at or below 3 units left</p>
              </div>

              <div className="glass rounded-3xl p-6 dark:border-slate-800 bg-gradient-to-tr from-amber-500/10 to-pro-blue/5 border border-amber-500/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                    80% Core Revenue Products Lacking
                  </span>
                  <Zap className="w-6 h-6 text-amber-500 pulse-vitality" />
                </div>
                <h3 className="text-3xl font-extrabold text-amber-500">
                  {purchasingRecs.filter(r => r.pareto_core).length} core SKUs
                </h3>
                <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-2 font-medium">
                  Pareto Rule: High-priority, high-cashflow items
                </p>
              </div>
            </div>

            {/* Replenishments Interactive List */}
            <div className="glass rounded-3xl p-6 dark:border-slate-800">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-white font-heading m-0 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    AI Procurement Purchase Recommendations
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Procurement planning built on **stock levels** merged with the **80/20 Pareto Rule** (20% drugs driving 80% sales).
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  
                  {/* Pareto Only Toggle */}
                  <button
                    onClick={() => setPurchaseParetoOnly(!purchaseParetoOnly)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                      purchaseParetoOnly
                        ? 'bg-gradient-to-tr from-amber-500 to-amber-600 text-white border-amber-500 shadow glow-green'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Pareto Core Only
                  </button>

                  <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
                    {(['All', 'Santa', 'Masala'] as const).map((branch) => (
                      <button
                        key={branch}
                        onClick={() => setPurchaseBranchFilter(branch)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          purchaseBranchFilter === branch
                            ? 'bg-pro-blue text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-300 hover:text-pro-blue'
                        }`}
                      >
                        {branch}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-56">
                    <input
                      type="text"
                      placeholder="Search procurements..."
                      value={purchaseSearch}
                      onChange={(e) => setPurchaseSearch(e.target.value)}
                      className="w-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 pl-10 text-sm focus:outline-none focus:border-pro-blue focus:ring-1 focus:ring-pro-blue dark:text-white"
                    />
                    <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl">
                {loading ? (
                  <div className="space-y-3 py-6">
                    <div className="h-10 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg"></div>
                  </div>
                ) : filteredPurchasing.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <PackageCheck className="w-16 h-16 stroke-1 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold">No purchase recommendations match filters</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        <th className="py-3 px-4">Branch</th>
                        <th className="py-3 px-4">Urgency</th>
                        <th className="py-3 px-4">Core Drug (80/20)</th>
                        <th className="py-3 px-4">Product Details</th>
                        <th className="py-3 px-4 text-center">Stock</th>
                        <th className="py-3 px-4 text-center">Rec. Order</th>
                        <th className="py-3 px-4 text-right">Est. Cost (EGP)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                      {filteredPurchasing.map((item, idx) => {
                        const isCritical = item.urgency === 'CRITICAL';
                        const isHigh = item.urgency === 'HIGH';
                        
                        return (
                          <tr 
                            key={idx} 
                            className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${
                              item.pareto_core ? 'bg-amber-500/5 border-l-2 border-amber-500/40' : ''
                            }`}
                          >
                            {/* Branch */}
                            <td className="py-3.5 px-4">
                              <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase ${
                                item.branch.toLowerCase() === 'santa'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              }`}>
                                {item.branch}
                              </span>
                            </td>

                            {/* Urgency */}
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                isCritical
                                  ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                                  : isHigh
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                              }`}>
                                {isCritical && <span className="w-1.5 h-1.5 rounded-full bg-red-500 pulse-vitality"></span>}
                                {item.urgency}
                              </span>
                            </td>

                            {/* Pareto Core 80% Tag */}
                            <td className="py-3.5 px-4">
                              {item.pareto_core ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-tr from-amber-500/20 to-amber-600/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 shadow-sm">
                                  <Zap className="w-3 h-3 text-amber-500 pulse-vitality" />
                                  80/20 Core Revenue
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">-</span>
                              )}
                            </td>

                            {/* Details */}
                            <td className="py-3.5 px-4 font-sans">
                              <p className="font-extrabold text-slate-700 dark:text-slate-200">{item.name_en}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{item.name_ar}</p>
                              <p className="text-[10px] font-mono text-slate-400 mt-0.5">Code: {item.product_code}</p>
                            </td>

                            {/* Current Stock */}
                            <td className="py-3.5 px-4 text-center">
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {item.current_stock.toFixed(0)} units
                              </span>
                            </td>

                            {/* Rec. Order Quantity */}
                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-pro-blue/10 text-pro-blue dark:bg-pro-blue/20 dark:text-slate-200 font-extrabold text-xs">
                                {item.recommended_order}
                              </span>
                            </td>

                            {/* Estimated Cost */}
                            <td className="py-3.5 px-4 text-right">
                              <span className="font-extrabold text-slate-800 dark:text-white">
                                {item.estimated_cost_egp.toLocaleString(undefined, { minimumFractionDigits: 2 })} 
                              </span>
                              <span className="text-[9px] font-semibold text-pro-blue ml-1">EGP</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --------------------- TAB 6: AI CLINICAL ASSISTANT --------------------- */}
        {activeTab === 'clinical' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
            {/* Drug-Drug Interaction Checker */}
            <div className="glass rounded-3xl p-6 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-white font-heading m-0 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  AI Drug-Drug Interaction Checker
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Check critical pharmacological interactions. Verify warnings against Santa & Masala SQL catalog brands.
                </p>

                <div className="space-y-4 mt-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Primary Drug (e.g. Aspirin, Concor)</label>
                    <input
                      type="text"
                      placeholder="Enter drug name..."
                      value={clinicalDrug1}
                      onChange={(e) => setClinicalDrug1(e.target.value)}
                      className="w-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pro-blue dark:text-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Secondary Drug (e.g. Warfarin, Voltaren)</label>
                    <input
                      type="text"
                      placeholder="Enter drug name..."
                      value={clinicalDrug2}
                      onChange={(e) => setClinicalDrug2(e.target.value)}
                      className="w-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pro-blue dark:text-white font-medium"
                    />
                  </div>
                </div>

                {/* Example Chips */}
                <div className="mt-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Common Live SQL Combos:</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ["Viagra", "Nitroglycerin"],
                      ["Concor", "Voltaren"],
                      ["Aspirin", "Warfarin"],
                      ["Augmentin", "Yasmin"]
                    ].map(([d1, d2], idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setClinicalDrug1(d1);
                          setClinicalDrug2(d2);
                        }}
                        className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-pro-blue/10 dark:hover:bg-pro-blue/20 text-slate-600 dark:text-slate-300 hover:text-pro-blue rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                      >
                        {d1} + {d2}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interaction Analysis Result */}
              <div className="mt-6 flex-1 flex flex-col justify-end">
                {checkingInteractions ? (
                  <div className="p-8 text-center text-slate-400 border border-slate-100 dark:border-slate-800 rounded-2xl animate-pulse">
                    <RefreshCw className="w-8 h-8 mx-auto animate-spin text-pro-blue mb-2" />
                    <p className="text-xs font-bold">Querying Clinical Database...</p>
                  </div>
                ) : interactionResult ? (
                  <div className={`p-4 rounded-2xl border ${
                    interactionResult.risk_level === 'CRITICAL'
                      ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400'
                      : interactionResult.risk_level === 'MODERATE'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                  } transition-all duration-300`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        interactionResult.risk_level === 'CRITICAL'
                          ? 'bg-red-500 pulse-vitality'
                          : interactionResult.risk_level === 'MODERATE'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                      }`}></span>
                      <span className="text-xs font-extrabold uppercase tracking-widest">
                        {interactionResult.risk_level} Severity Interaction
                      </span>
                    </div>
                    <p className="text-xs font-semibold mt-1">
                      <span className="font-bold opacity-80">Mechanism: </span>
                      {interactionResult.mechanism}
                    </p>
                    <p className="text-xs font-semibold mt-2 border-t border-slate-500/10 pt-2">
                      <span className="font-bold opacity-80">Clinical Recommendation: </span>
                      {interactionResult.recommendation}
                    </p>
                  </div>
                ) : null}

                <button
                  onClick={checkDrugInteractions}
                  disabled={!clinicalDrug1 || !clinicalDrug2 || checkingInteractions}
                  className="w-full bg-pro-blue text-white rounded-xl py-3 text-xs font-bold mt-4 shadow-md hover:bg-blue-600 transition-all disabled:opacity-50 cursor-pointer"
                >
                  Analyze Interaction Risk
                </button>
              </div>
            </div>

            {/* OTC Symptom-based Recommendations */}
            <div className="glass rounded-3xl p-6 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-white font-heading m-0 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500 pulse-vitality" />
                  AI OTC Treatment Recommender
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Symptom-based OTC support. Automatically match substitutes from Santa/Masala catalogs.
                </p>

                <div className="space-y-4 mt-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Describe Patient Symptom / Complaint</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search symptoms (e.g. cough, reflux, headache, joint pain)..."
                        value={otcSymptom}
                        onChange={(e) => setOtcSymptom(e.target.value)}
                        className="w-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none focus:border-pro-blue dark:text-white font-medium"
                      />
                      <Search className="absolute left-3 top-3.5 w-4.5 h-4.5 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Symptom Chips */}
                <div className="mt-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Quick Patient Complaints:</span>
                  <div className="flex flex-wrap gap-2">
                    {["Acid Reflux", "Joint Pain", "Dry Cough", "Wet Cough", "Headache"].map((complaint) => (
                      <button
                        key={complaint}
                        onClick={() => {
                          setOtcSymptom(complaint);
                          checkOtcAlternatives(complaint);
                        }}
                        className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-pro-blue/10 dark:hover:bg-pro-blue/20 text-slate-600 dark:text-slate-300 hover:text-pro-blue rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                      >
                        {complaint}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* OTC Alternatives Result Card */}
              <div className="mt-6 flex-1 flex flex-col justify-end">
                {checkingOtc ? (
                  <div className="p-8 text-center text-slate-400 border border-slate-100 dark:border-slate-800 rounded-2xl animate-pulse">
                    <RefreshCw className="w-8 h-8 mx-auto animate-spin text-pro-blue mb-2" />
                    <p className="text-xs font-bold">Searching OTC Database...</p>
                  </div>
                ) : otcResult ? (
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Clinical OTC Suggestion</h5>
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="font-bold text-slate-500">Active Drugs: </span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{otcResult.recommended_actives.join(" or ")}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-500">In-Stock Brand Alternatives: </span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {otcResult.brand_alternatives_in_stock.map((brand, i) => (
                            <span key={i} className="px-2 py-0.5 bg-pro-blue/10 text-pro-blue dark:text-slate-300 font-bold rounded">
                              {brand}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="font-bold text-slate-500">Dosage Instructions: </span>
                        <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed font-semibold">{otcResult.dosing_instructions}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 mt-3 font-semibold">
                        <span className="font-extrabold uppercase text-[10px] tracking-wider block mb-1">🚨 Clinical Red Flags (Doctor Referral)</span>
                        {otcResult.red_flags}
                      </div>
                    </div>
                  </div>
                ) : null}

                <button
                  onClick={() => checkOtcAlternatives()}
                  disabled={!otcSymptom || checkingOtc}
                  className="w-full bg-pro-blue text-white rounded-xl py-3 text-xs font-bold mt-4 shadow-md hover:bg-blue-600 transition-all disabled:opacity-50 cursor-pointer"
                >
                  Lookup OTC Treatment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --------------------- TAB 7: WHATSAPP LOYALTY ALERTS --------------------- */}
        {activeTab === 'loyalty' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            {/* Loyalty Members Directory */}
            <div className="lg:col-span-2 glass rounded-3xl p-6 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-white font-heading m-0 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-pro-blue pulse-vitality" />
                    WhatsApp Customer Loyalty Directory
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Calculate loyalty points from sales net. Send automatic WhatsApp point balances to customers.
                  </p>
                </div>
                
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search customer name/phone..."
                    value={loyaltySearch}
                    onChange={(e) => setLoyaltySearch(e.target.value)}
                    className="w-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 pl-10 text-sm focus:outline-none focus:border-pro-blue dark:text-white"
                  />
                  <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                </div>
              </div>

              {/* Members Table */}
              <div className="overflow-x-auto rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      <th className="py-3 px-4">Tier</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4 text-center">Purchases</th>
                      <th className="py-3 px-4 text-center">Points (EGP Value)</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {filteredLoyaltyMembers.map((member) => {
                      const isPlatinum = member.tier === 'Platinum';
                      const isGold = member.tier === 'Gold';
                      const sending = sendingAlertId === member.customer_id;
                      const success = alertSuccessId === member.customer_id;
                      
                      return (
                        <tr key={member.customer_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          {/* Tier Badge */}
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              isPlatinum
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20'
                                : isGold
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}>
                              {isPlatinum && <Zap className="w-3 h-3 text-indigo-500" />}
                              {member.tier}
                            </span>
                          </td>

                          {/* Details */}
                          <td className="py-3.5 px-4">
                            <p className="font-extrabold text-slate-700 dark:text-slate-200">{member.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5 font-mono">{member.phone}</p>
                          </td>

                          {/* Purchases */}
                          <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                            {member.total_purchases_egp.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">EGP</span>
                          </td>

                          {/* Points */}
                          <td className="py-3.5 px-4 text-center font-bold">
                            <span className="text-slate-800 dark:text-slate-200 block text-sm font-extrabold">
                              {member.loyalty_points} pts
                            </span>
                            <span className="text-[10px] text-emerald-500 font-bold block mt-0.5">
                              ({(member.loyalty_points / 10).toLocaleString()} EGP value)
                            </span>
                          </td>

                          {/* Action Button */}
                          <td className="py-3.5 px-4 text-right">
                            {success ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl">
                                <CheckCircle2 className="w-3.5 h-3.5 animate-bounce" />
                                Dispatched!
                              </span>
                            ) : (
                              <button
                                onClick={() => triggerWhatsAppAlert(member.customer_id)}
                                disabled={sending || sendingAlertId !== null}
                                className="px-3 py-1.5 bg-pro-blue text-white rounded-xl text-xs font-bold shadow hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center gap-1.5 ml-auto cursor-pointer"
                              >
                                {sending ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <MessageSquare className="w-3 h-3" />
                                    Send Alert
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Outbound WhatsApp transmission logger emulator */}
            <div className="glass rounded-3xl p-6 dark:border-slate-800 flex flex-col justify-between h-[450px] lg:h-auto">
              <div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-white font-heading m-0 flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-500" />
                  WhatsApp Gateway Engine
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Real-time webhook and message payload logs generated in `.tmp/whatsapp_payloads.json`.
                </p>
                
                <div className="mt-6 bg-slate-950 rounded-2xl p-4 border border-slate-850 text-[11px] font-mono text-emerald-400 overflow-y-auto max-h-[250px] lg:max-h-[350px] space-y-3 leading-relaxed">
                  <p className="text-slate-500 font-semibold">// Gateway Listening on Webhook Port 8000...</p>
                  <p className="text-slate-500 font-semibold">[INFO] {new Date().toISOString().slice(0,10)}: Connected to ProCare Automated Messaging Channel</p>
                  
                  {/* Dynamic render of sent alert bodies */}
                  {alertSuccessId !== null ? (
                    (() => {
                      const m = loyaltyMembers.find(mem => mem.customer_id === alertSuccessId);
                      if (!m) return null;
                      return (
                        <div className="pt-2 border-t border-slate-800 space-y-1 select-all">
                          <p className="text-yellow-500">[DISPATCHED] Outbound WhatsApp Request:</p>
                          <p className="text-white">API URL: <span className="text-indigo-400">/api/v1/loyalty/send-alert</span></p>
                          <p className="text-white">Recipient: <span className="text-sky-300">{m.phone} ({m.name})</span></p>
                          <p className="text-white">Payload:</p>
                          <pre className="text-emerald-300 bg-slate-900/50 p-2 rounded border border-slate-800 mt-1 max-w-full overflow-x-auto whitespace-pre-wrap font-sans text-[10px]">
                            {`Dear *${m.name}*, thank you for choosing ProCare! 💊\nYou currently have *${m.loyalty_points}* loyalty points (valued at ${m.loyalty_points / 10} EGP).\nTier Status: *${m.tier} Member*\n\n🎁 Special Reward: Use coupon code *PROCARE10* for 10% off your next purchase.\nWishing you excellent health! - ProCare Pharmacy`}
                          </pre>
                          <p className="text-emerald-500 font-bold text-right pt-1 flex items-center justify-end gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-vitality"></span>
                            DISPATCH_SUCCESS_CODE_200_OK
                          </p>
                        </div>
                      );
                    })()
                  ) : (
                    <p className="text-slate-600">// No outbound requests sent yet. Click "Send Alert" on the left panel to trigger a WhatsApp payload dispatch.</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between font-semibold">
                <span>API Channel: automated-loyalty</span>
                <span>Active Link: local-workbench-payload</span>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
