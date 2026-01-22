import { Routes, Route, Link } from 'react-router-dom';
import { Container, Header, Nav, NavLink } from './components/styled';
import Dashboard from './pages/Dashboard';
import BondList from './pages/BondList';
import BondForm from './pages/BondForm';
import BondDetails from './pages/BondDetails';
import PurchaseList from './pages/PurchaseList';
import PurchaseForm from './pages/PurchaseForm';
import CalendarPage from './pages/CalendarPage';
import PaymentHistory from './pages/PaymentHistory';
import MonthlyTargetPage from './pages/MonthlyTarget';

function App() {
  return (
    <Container>
      <Header>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1>Bond Tracker</h1>
        </Link>
        <Nav>
          <NavLink to="/">Дашборд</NavLink>
          <NavLink to="/calendar">Календарь</NavLink>
          <NavLink to="/history">История</NavLink>
          <NavLink to="/bonds">Облигации</NavLink>
          <NavLink to="/purchases">Покупки</NavLink>
          <NavLink to="/targets">Цели</NavLink>
        </Nav>
      </Header>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/history" element={<PaymentHistory />} />
        <Route path="/bonds" element={<BondList />} />
        <Route path="/bonds/new" element={<BondForm />} />
        <Route path="/bonds/:id" element={<BondDetails />} />
        <Route path="/bonds/:id/edit" element={<BondForm />} />
        <Route path="/purchases" element={<PurchaseList />} />
        <Route path="/purchases/new" element={<PurchaseForm />} />
        <Route path="/purchases/:id/edit" element={<PurchaseForm />} />
        <Route path="/targets" element={<MonthlyTargetPage />} />
      </Routes>
    </Container>
  );
}

export default App;
