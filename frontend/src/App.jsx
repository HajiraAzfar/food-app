import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Login from './pages/Login';
import Outlets from './pages/Outlets';
import OutletDetail from './pages/OutletDetail';
import Basket from './pages/Basket';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerOrders from './pages/OwnerOrders';
import OwnerMenu from './pages/OwnerMenu';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mist">
        <p className="text-sm text-muted">Load ho raha hai...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

 if (user.role === 'owner') {
  return (
    <Routes>
      <Route path="/owner" element={<OwnerDashboard />} />
      <Route path="/owner/:outletId/orders" element={<OwnerOrders />} />
      <Route path="/owner/:outletId/menu" element={<OwnerMenu />} />
      <Route path="*" element={<Navigate to="/owner" replace />} />
    </Routes>
  );
}

  return (
    <Routes>
      <Route path="/" element={<Outlets />} />
      <Route path="/outlets/:id" element={<OutletDetail />} />
      <Route path="/basket" element={<Basket />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/orders/:id" element={<OrderDetail />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
