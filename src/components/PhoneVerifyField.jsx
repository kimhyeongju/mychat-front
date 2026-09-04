import { useEffect, useRef, useState } from 'react';
import { sendPhoneCode, verifyPhoneCode } from '../api/auth';

const CODE_TTL_SECONDS = 5 * 60;
const RESEND_COOLDOWN_SECONDS = 60;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * @param {string} phoneNumber - 상위 컴포넌트가 들고 있는 휴대폰 번호 상태
 * @param {(value: string) => void} onChangePhoneNumber
 * @param {boolean} verified - 인증 완료 여부 (상위에서 관리)
 * @param {() => void} onVerified - 인증 성공 시 호출
 */
export default function PhoneVerifyField({
  phoneNumber,
  onChangePhoneNumber,
  verified,
  onVerified,
}) {
  const [step, setStep] = useState('idle'); // idle | sent
  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [sendLoading, setSendLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const startTimer = () => {
    clearInterval(timerRef.current);
    setSecondsLeft(CODE_TTL_SECONDS);
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const isValidPhone = /^01[0-9]{8,9}$/.test(phoneNumber);

  // 인증번호 자체는 5분간 유효하지만, 재전송 버튼은 스팸 방지를 위해 60초만 잠가둔다.
  // (전체 5분 내내 막아두면 문자를 못 받았을 때 재전송할 방법이 없어짐)
  const elapsedSeconds = CODE_TTL_SECONDS - secondsLeft;
  const resendLocked =
    step === 'sent' && elapsedSeconds < RESEND_COOLDOWN_SECONDS;
  const resendSecondsLeft = RESEND_COOLDOWN_SECONDS - elapsedSeconds;

  const handleSendCode = async () => {
    if (!isValidPhone) {
      setError('휴대폰 번호를 하이픈 없이 정확히 입력해주세요.');
      return;
    }
    setError('');
    setSendLoading(true);
    try {
      await sendPhoneCode(phoneNumber);
      setStep('sent');
      setCode('');
      startTimer();
    } catch (err) {
      setError(err.message);
    } finally {
      setSendLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      setError('인증번호 6자리를 입력해주세요.');
      return;
    }
    setError('');
    setVerifyLoading(true);
    try {
      await verifyPhoneCode(phoneNumber, code);
      clearInterval(timerRef.current);
      onVerified();
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifyLoading(false);
    }
  };

  if (verified) {
    return (
      <div className='field'>
        <label htmlFor='phoneNumber'>휴대폰 번호</label>
        <input
          id='phoneNumber'
          className='text-input'
          value={phoneNumber}
          disabled
        />
        <span className='verify-status verified'>✓ 인증 완료</span>
      </div>
    );
  }

  return (
    <div className='field'>
      <label htmlFor='phoneNumber'>휴대폰 번호</label>
      <div className='verify-row'>
        <input
          id='phoneNumber'
          className='text-input'
          placeholder='01012345678'
          inputMode='numeric'
          value={phoneNumber}
          disabled={step === 'sent'}
          onChange={(e) =>
            onChangePhoneNumber(e.target.value.replace(/[^0-9]/g, ''))
          }
        />
        <button
          type='button'
          className='btn btn-secondary'
          disabled={sendLoading || resendLocked}
          onClick={handleSendCode}
        >
          {step === 'idle'
            ? '인증번호 받기'
            : resendLocked
              ? `재전송 (${resendSecondsLeft}s)`
              : '재전송'}
        </button>
      </div>

      {step === 'sent' && (
        <div className='verify-row' style={{ marginTop: 4 }}>
          <input
            className='text-input'
            placeholder='인증번호 6자리'
            inputMode='numeric'
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
          />
          <span className='verify-timer'>{formatTime(secondsLeft)}</span>
          <button
            type='button'
            className='btn btn-primary'
            disabled={verifyLoading}
            onClick={handleVerifyCode}
          >
            확인
          </button>
        </div>
      )}

      {error && <span className='field-error'>{error}</span>}
      {step === 'sent' && !error && (
        <span className='field-hint'>
          문자로 받은 6자리 인증번호를 입력해주세요.
        </span>
      )}
    </div>
  );
}
