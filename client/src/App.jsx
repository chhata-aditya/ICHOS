import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import PlayerBar from './components/PlayerBar';

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Outlet />
      </main>
      <PlayerBar />
    </div>
  );
}

export default App;
