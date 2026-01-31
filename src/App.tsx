import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { DailySession } from './pages/DailySession';
import { Settings } from './pages/Settings';

function App() {
    return (
        <Router>
            <div style={{ position: 'relative', minHeight: '100vh', paddingBottom: '2rem' }}>
                <Header />

                {/* Main Route Content */}
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/session" element={<DailySession />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
