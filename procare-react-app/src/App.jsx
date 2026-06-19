import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Accounting from './pages/Accounting';
import Purchasing from './pages/Purchasing';
import HR from './pages/HR';
import CRM from './pages/CRM';
import Orchestration from './pages/Orchestration';
import Sales from './pages/Sales';
import Substitution from './pages/Substitution';
import PrescriptionReader from './pages/PrescriptionReader';
import WeightControl from './pages/WeightControl';
import AiOtc from './pages/AiOtc';
import OperationsKanban from './pages/OperationsKanban';
import DoctorAnalytics from './pages/DoctorAnalytics';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="accounting" element={<Accounting />} />
          <Route path="purchasing" element={<Purchasing />} />
          <Route path="hr" element={<HR />} />
          <Route path="crm" element={<CRM />} />
          <Route path="orchestration" element={<Orchestration />} />
          <Route path="sales" element={<Sales />} />
          <Route path="substitution" element={<Substitution />} />
          <Route path="prescription" element={<PrescriptionReader />} />
          <Route path="weight-control" element={<WeightControl />} />
          <Route path="ai-otc" element={<AiOtc />} />
          <Route path="operations-kanban" element={<OperationsKanban />} />
          <Route path="doctor-analytics" element={<DoctorAnalytics />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
