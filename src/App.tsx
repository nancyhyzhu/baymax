import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { UserProvider } from './context/UserProvider';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { DailySession } from './pages/DailySession';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { CreateAccount } from './pages/CreateAccount';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Onboarding } from './pages/Onboarding';

function AppContent() {
    const location = useLocation();
    const isAuthPage = ['/login', '/create-account', '/forgot-password', '/reset-password'].includes(location.pathname);

    return (
        <div style={{ position: 'relative', minHeight: '100vh', paddingBottom: isAuthPage ? 0 : '2rem' }}>
            {!isAuthPage && <Header />}

            {/* Main Route Content */}
            <Routes>
                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/create-account" element={<CreateAccount />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/onboarding" element={<Onboarding />} />

                {/* Dashboard Routes */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/session" element={<DailySession />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
}

function App() {
    return (
        <Router>
            <UserProvider>
                <AppContent />
            </UserProvider>
        </Router>
    );
}

export default App;
