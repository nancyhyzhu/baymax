import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { Header } from './components/Header';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { DailySession } from './pages/DailySession';
import { Settings } from './pages/Settings';
import { Onboarding } from './pages/Onboarding';

function App() {
    return (
        <AuthProvider>
            <Router>
                <div style={{ position: 'relative', minHeight: '100vh', paddingBottom: '2rem' }}>

                    <Routes>
                        <Route path="/login" element={<Login />} />

                        <Route path="/" element={
                            <PrivateRoute>
                                <Header />
                                <Dashboard />
                            </PrivateRoute>
                        } />

                        <Route path="/session" element={
                            <PrivateRoute>
                                <Header />
                                <DailySession />
                            </PrivateRoute>
                        } />

                        <Route path="/onboarding" element={
                            <PrivateRoute>
                                <Onboarding />
                            </PrivateRoute>
                        } />

                        <Route path="/settings" element={
                            <PrivateRoute>
                                <Header />
                                <Settings />
                            </PrivateRoute>
                        } />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
