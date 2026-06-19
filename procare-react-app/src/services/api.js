const API_BASE_URL = 'http://localhost:5000/api';

async function apiFetch(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return null;
  }
}

// ── Dashboard / Summary ──────────────────────────────
export const fetchSummary = (range = 'today', branch = 'all') =>
  apiFetch(`/summary?range=${range}&branch=${branch}`);

export const fetchBranches = () => apiFetch('/branches');
export const fetchWeekly = () => apiFetch('/weekly');
export const fetchHealth = () => apiFetch('/health');

// ── Inventory & Products ─────────────────────────────
export const fetchProducts = () => apiFetch('/products');
export const fetchExpiry = () => apiFetch('/expiry');
export const fetchWarehouses = () => apiFetch('/warehouses');

// ── Purchasing ───────────────────────────────────────
export const fetchPurchases = () => apiFetch('/purchases');
export const fetchSuppliers = () => apiFetch('/suppliers');
export const fetchSmartOrders = () => apiFetch('/smart_order');

// ── Accounting & Treasury ────────────────────────────
export const fetchTreasury = () => apiFetch('/treasury');
export const fetchDailyAccounts = () => apiFetch('/daily_accounts');
export const fetchGeneralAccounts = () => apiFetch('/general_accounts');

// ── HR & Staff ───────────────────────────────────────
export const fetchStaff = () => apiFetch('/staff');

// ── CRM / Customers ─────────────────────────────────
export const fetchCustomers = () => apiFetch('/customers');
export const fetchSalesIntelligence = () => apiFetch('/sales_intelligence');
export const fetchTopProducts = (date = 'yesterday', limit = 10) =>
  apiFetch(`/top_products?date=${date}&limit=${limit}`);

// ── Slack Actions ────────────────────────────────────
export const testSlack = () => apiFetch('/slack/test');

export const sendDailyReport = (data) =>
  apiFetch('/slack/daily-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

export const sendExpiryAlert = (data) =>
  apiFetch('/slack/expiry-alert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

export const triggerFullReport = () =>
  apiFetch('/send_alert', { method: 'POST' });
