import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { CreatePage } from './pages/CreatePage';
import { VotePage } from './pages/VotePage';
import { ResultsPage } from './pages/ResultsPage';
import { TrendingPage } from './pages/TrendingPage';
import { AdminPage } from './pages/AdminPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
        <Navbar />
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 sm:px-6">
          <Routes>
            <Route path="/" element={<CreatePage />} />
            <Route path="/p/:id" element={<VotePage />} />
            <Route path="/p/:id/results" element={<ResultsPage />} />
            <Route path="/trending" element={<TrendingPage />} />
            <Route path="/manage/:id" element={<AdminPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
          <p>QuickPoll &bull; Real-time, instant polling platform</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
