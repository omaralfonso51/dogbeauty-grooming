import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import GroomerDashboard from './pages/GroomerDashboard';
import Appointments from './pages/Appointments';
import Pets from './pages/Pets';
import Owners from './pages/Owners';
import Products from './pages/Products';
import Cuts from './pages/Cuts';
import Reminders from './pages/Reminders';
import Profile from './pages/Profile';
import Groomers from './pages/Groomers';

const PrivateRoute = ({ children, adminOnly }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="page-loading">Cargando...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate to="/groomer" />;
  return children;
};

const Layout = ({ children }) => (
  <>
    <Navbar />
    <main>{children}</main>
  </>
);

const HomeRedirect = () => {
  const { isAdmin } = useAuth();
  return isAdmin ? <Navigate to="/dashboard" /> : <Navigate to="/groomer" />;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={user ? <Navigate to="/app" /> : <Login />} />
      <Route path="/app" element={<PrivateRoute><HomeRedirect /></PrivateRoute>} />
      <Route path="/dashboard" element={<PrivateRoute adminOnly><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/groomer" element={<PrivateRoute><Layout><GroomerDashboard /></Layout></PrivateRoute>} />
      <Route path="/appointments" element={<PrivateRoute><Layout><Appointments /></Layout></PrivateRoute>} />
      <Route path="/pets" element={<PrivateRoute><Layout><Pets /></Layout></PrivateRoute>} />
      <Route path="/owners" element={<PrivateRoute><Layout><Owners /></Layout></PrivateRoute>} />
      <Route path="/products" element={<PrivateRoute><Layout><Products /></Layout></PrivateRoute>} />
      <Route path="/cuts" element={<PrivateRoute><Layout><Cuts /></Layout></PrivateRoute>} />
      <Route path="/reminders" element={<PrivateRoute adminOnly><Layout><Reminders /></Layout></PrivateRoute>} />
      <Route path="/groomers" element={<PrivateRoute adminOnly><Layout><Groomers /></Layout></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;