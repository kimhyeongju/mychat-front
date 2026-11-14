import { Outlet } from 'react-router-dom';
import { CurrencyProvider } from '../context/CurrencyContext';
import '../styles/invest.css';

/** 투자 화면 공통. 통화 선택과 환율을 하위 페이지가 공유한다. */
export default function InvestLayout() {
  return (
    <CurrencyProvider>
      <Outlet />
    </CurrencyProvider>
  );
}
