import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import {
  About,
  Compare,
  Monitor,
  Overview,
  RepositoryDetail,
  RiskCenter,
  SavedRepos,
  Search,
} from './pages';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Overview />} />
        <Route path="/search" element={<Search />} />
        <Route path="/repo/:owner/:repo" element={<RepositoryDetail />} />
        <Route path="/saved" element={<SavedRepos />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/risk" element={<RiskCenter />} />
        <Route path="/monitor" element={<Monitor />} />
        <Route path="/about" element={<About />} />
      </Route>
    </Routes>
  );
}
