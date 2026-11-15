import { Outlet } from 'react-router-dom';
import { CurrencyProvider } from '../context/CurrencyContext';
import { WatchlistProvider } from '../context/WatchlistContext';
import '../styles/invest.css';

/** 투자 화면 공통. 통화 선택·환율·관심 종목을 하위 페이지가 공유한다. */
export default function InvestLayout() {
  return (
    <CurrencyProvider>
      <WatchlistProvider>
        <Outlet />
      </WatchlistProvider>
    </CurrencyProvider>
  );
}
