import { useState } from 'react';

/**
 * @param {string} id
 * @param {string} label
 * @param {string} placeholder
 * @param {string} value
 * @param {(value: string) => void} onChange
 * @param {(value: string) => Promise<boolean>} checkAvailable - true면 사용 가능
 * @param {(available: boolean) => void} onAvailabilityChange - 부모가 제출 가능 여부를 추적하도록 알림
 */
export default function DuplicateCheckField({
  id,
  label,
  placeholder,
  value,
  onChange,
  checkAvailable,
  onAvailabilityChange,
}) {
  // idle: 아직 확인 안 함 | checking: 확인 중 | available: 사용 가능 | taken: 이미 사용 중
  const [status, setStatus] = useState('idle');
  const [checkedValue, setCheckedValue] = useState('');

  const handleChange = (e) => {
    onChange(e.target.value);
    // 값이 바뀌면 이전 확인 결과는 더 이상 유효하지 않다.
    if (status !== 'idle') {
      setStatus('idle');
      onAvailabilityChange(false);
    }
  };

  const handleCheck = async () => {
    if (!value.trim()) return;
    setStatus('checking');
    try {
      const available = await checkAvailable(value);
      setStatus(available ? 'available' : 'taken');
      setCheckedValue(value);
      onAvailabilityChange(available);
    } catch {
      setStatus('idle');
      onAvailabilityChange(false);
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
          {status === 'checking' ? '확인 중...' : '중복확인'}
        </button>
      </div>
      {isChecked && status === 'available' && (
        <span className='verify-status verified'>
          ✓ 사용 가능한 {label}입니다.
        </span>
      )}
      {isChecked && status === 'taken' && (
        <span className='field-error'>이미 사용 중인 {label}입니다.</span>
      )}
    </div>
  );
}
