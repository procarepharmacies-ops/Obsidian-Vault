import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Calculator, ShoppingCart, Users, HeartHandshake, 
  Bell, Search, Activity, Replace, ScanLine, Scale, Sparkles, DollarSign, 
  KanbanSquare, Stethoscope, ChevronDown, ActivitySquare, Video 
} from 'lucide-react';
import HermesChat from './HermesChat';
import './Layout.css';

const Layout = () => {
  const erpItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { path: '/inventory', label: 'Inventory & Stock', icon: <Package size={18} /> },
    { path: '/accounting', label: 'Accounting', icon: <Calculator size={18} /> },
    { path: '/purchasing', label: 'Purchasing', icon: <ShoppingCart size={18} /> },
    { path: '/hr', label: 'HR & Employees', icon: <Users size={18} /> },
    { path: '/crm', label: 'CRM & Loyalty', icon: <HeartHandshake size={18} /> },
    { path: '/operations-kanban', label: 'Operations Kanban', icon: <KanbanSquare size={18} /> },
  ];

  const aiItems = [
    { path: '/orchestration', label: 'Agent Orchestration', icon: <Activity size={18} /> },
    { path: '/sales', label: 'Point of Sale (POS)', icon: <DollarSign size={18} /> },
    { path: '/substitution', label: 'Drug Substitution', icon: <Replace size={18} /> },
    { path: '/prescription', label: 'Prescription Reader', icon: <ScanLine size={18} /> },
    { path: '/weight-control', label: 'Weight Program', icon: <Scale size={18} /> },
    { path: '/ai-otc', label: 'AI OTC Assistant', icon: <Sparkles size={18} /> },
    { path: '/doctor-analytics', label: 'Doctor Analytics', icon: <Stethoscope size={18} /> },
    { path: '/nvr-cameras', label: 'NVR Cameras (AI)', icon: <Video size={18} /> },
  ];

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="topbar-nav">
        {/* Brand/Logo */}
        <div className="brand-section">
          <div className="logo-wrapper">
            <div className="logo-bg"></div>
            <div className="logo-cross"></div>
          </div>
          <span>ProCare <span style={{ color: 'var(--procare-teal)' }}>OS</span></span>
        </div>

        {/* Top Menus */}
        <nav className="nav-menu">
          {/* Dropdown 1: Core ERP */}
          <div className="nav-dropdown">
            <button className="dropdown-trigger">
              <ActivitySquare size={18} color="var(--procare-blue)" />
              Core Operations
              <ChevronDown size={14} />
            </button>
            <div className="dropdown-content">
              {erpItems.map((item) => (
                <NavLink key={item.path} to={item.path} className="dropdown-item">
                  <span className="icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Dropdown 2: AI & Clinical Tools */}
          <div className="nav-dropdown">
            <button className="dropdown-trigger">
              <Sparkles size={18} color="var(--procare-teal)" />
              AI Medical Suite
              <ChevronDown size={14} />
            </button>
            <div className="dropdown-content">
              {aiItems.map((item) => (
                <NavLink key={item.path} to={item.path} className="dropdown-item">
                  <span className="icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        {/* Actions & Profile */}
        <div className="right-actions">
          <div className="search-trigger" title="Search branches (Ctrl+K)">
            <Search size={20} />
          </div>
          <div className="bell-icon" title="Notifications">
            <Bell size={20} />
            <div className="bell-badge"></div>
          </div>
          <div className="profile-avatar">
            PR
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="page-content">
        <Outlet />
      </main>
      
      {/* Hermes AI Chat Widget */}
      <HermesChat />
    </div>
  );
};

export default Layout;
