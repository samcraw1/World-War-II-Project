import { Route, Routes } from 'react-router-dom';
import Index from './components/Index';
import Today from './components/Today';

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/day/:date" element={<Today />} />
            <Route path="/days" element={<Index />} />
            <Route path="*" element={<p className="status">Page not found.</p>} />
        </Routes>
    );
}
