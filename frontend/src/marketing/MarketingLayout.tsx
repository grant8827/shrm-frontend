import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
// base.css must load before tailwind.css: it's a reset "base" layer, and
// Tailwind's utilities need to win cascade ties (e.g. its .px-4 vs a bare
// ".shrm-site *" padding reset) — that only happens if utilities load last.
import './styles/base.css';
import './styles/Header.css';
import './styles/Footer.css';
import './styles/tailwind.css';

export function MarketingLayout() {
  return (
    <div className="shrm-site App">
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
