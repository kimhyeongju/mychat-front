import { useEffect, useRef, useState } from 'react';
import { useCurrency } from '../context/CurrencyContext';

const kst = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Seoul',
});

/** 작은 "?" 버튼. 누르면 주간 대회 규칙을 보여준다. week 는 GET /api/invest/week 응답. */
export default function RulesHelp({ week }) {
  const { money } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const points = week?.points ?? [3, 2, 1];

  return (
    <span className='rules-help' ref={ref}>
      <button
        type='button'
        className='rules-help__btn'
        aria-label='주간 대회 규칙 보기'
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        ?
      </button>
      {open && (
        <div className='rules-help__panel' role='dialog' aria-label='주간 대회 규칙'>
          <h3>주간 대회 규칙</h3>
          <ul>
            <li>
              매주 <b>미국 정규장 마지막 거래일 폐장 시각</b>(보통 금요일 16:00
              ET, 한국 시간 토요일 새벽)에 한 주를 마감합니다.
              {week?.settlesAt &&
                ` 이번 주 마감: ${kst.format(new Date(week.settlesAt))} (한국 시간)`}
            </li>
            <li>
              마감 시점 <b>수익률</b>이 높은 순으로 1~3위를 뽑아{' '}
              {points.map((p, i) => `${i + 1}위 ${p}점`).join(', ')}을
              드립니다. 수익률이 소수점까지 같으면 같은 순위, 같은 점수입니다.
            </li>
            <li>그 주에 <b>거래를 1회 이상</b> 한 사용자만 순위와 포인트 대상입니다.</li>
            <li>
              마감하면 보유 종목이 모두 사라지고 현금이{' '}
              <b>{money(week?.seedMoney ?? 100000)}</b>로 초기화됩니다. 거래
              내역은 남습니다.
            </li>
            <li>누적 포인트는 리더보드와 프로필에서 볼 수 있습니다.</li>
            <li>
              휴장일이나 조기 폐장일에는 그 주의 마지막 거래일 폐장 시각에
              마감합니다.
            </li>
          </ul>
        </div>
      )}
    </span>
  );
}
