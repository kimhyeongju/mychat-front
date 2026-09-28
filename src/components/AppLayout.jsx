import { Outlet } from 'react-router-dom';
import '../styles/home.css';
import AppHeader from './AppHeader';

export default function AppLayout() {
  return (
    <div className='home'>
      <AppHeader />
      <Outlet />
    </div>
  );
}
