import { NavLink } from 'react-router-dom';
import { Home as HomeIcon, Search as SearchIcon, Sparkles, Disc3, Activity } from 'lucide-react';
import usePlayer from '../hooks/usePlayer';
import './Navbar.css';

const links = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/search', label: 'Search', icon: SearchIcon },
  { to: '/vibe', label: 'Vibe', icon: Sparkles },
  { to: '/player', label: 'Player', icon: Disc3 },
  { to: '/visualizer', label: 'Cinema', icon: Activity },
];

function Navbar() {
  const { isPlaying } = usePlayer();

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <NavLink to="/" className="navbar__brand brand-wordmark" end>
          <span className="navbar__brand-glyph">◈</span> ICHOS
        </NavLink>
        <nav className="navbar__links" aria-label="Main">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `navbar__link${isActive ? ' is-active' : ''}`
              }
            >
              <Icon size={16} className={label === 'Player' && isPlaying ? 'spin-slow' : ''} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
