import { useState } from 'react';
import { useI18n } from '../context/LanguageContext';

/**
 * @param {string} id
 * @param {string} label
 * @param {string} placeholder
 * @param {string} value
 * @param {(value: string) => void} onChange
 * @param {(value: string) => Promise<boolean>} checkAvailable - true면 사용 가능
 * @param {(available: boolean) => void} onAvailabilityChange - 부모가 제출 가능 여부를 추적하도록 알림
 * @param {(value: string) => string} [validate] - 형식 검사. 문제가 있으면 안내 문구를 돌려주고,
 *   이 경우 서버에는 요청하지 않는다. 중복확인 버튼을 누를 때 함께 실행된다.
 */
export default function DuplicateCheckField({
  id,
  label,
  placeholder,
  value,
  onChange,
  checkAvailable,
  onAvailabilityChange,
  validate,
}) {
  const { t } = useI18n();
  // idle | checking | available | taken | error(형식 오류·서버 오류, message 표시)
  const [status, setStatus] = useState('idle');
  const [checkedValue, setCheckedValue] = useState('');
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    onChange(e.target.value);
    // 값이 바뀌면 이전 확인 결과는 더 이상 유효하지 않다.
    if (status !== 'idle') {
      setStatus('idle');
      setMessage('');
      onAvailabilityChange(false);
    }
  };

  const fail = (text) => {
    setStatus('error');
    setMessage(text);
    setCheckedValue(value);
    onAvailabilityChange(false);
  };

  const handleCheck = async () => {
    if (!value.trim()) return;

    const formatError = validate?.(value);
    if (formatError) {
      fail(formatError);
      return;
    }

    setStatus('checking');
    try {
      const available = await checkAvailable(value);
      setStatus(available ? 'available' : 'taken');
      setCheckedValue(value);
      onAvailabilityChange(available);
    } catch (err) {
      fail(err.message);
    }
  };

  const isChecked =
    status !== 'idle' && status !== 'checking' && checkedValue === value;

  return (
    <div className='field'>
      <label htmlFor={id}>{label}</label>
      <div className='verify-row'>
        <input
          id={id}
          className='text-input'
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          required
        />
        <button
          type='button'
          className='btn btn-secondary'
          disabled={!value.trim() || status === 'checking'}
          onClick={handleCheck}
        >
          {status === 'checking' ? t('dup.checking') : t('dup.check')}
        </button>
      </div>
      {isChecked && status === 'available' && (
        <span className='verify-status verified'>
          {t('dup.available', { label })}
        </span>
      )}
      {isChecked && status === 'taken' && (
        <span className='field-error'>{t('dup.taken', { label })}</span>
      )}
      {isChecked && status === 'error' && (
        <span className='field-error'>{message}</span>
      )}
    </div>
  );
}
