import { useRef, useState } from 'react';

const MAX_LENGTH = 2000;

export default function MessageInput({ onSend, disabled, placeholder }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const textareaRef = useRef(null);

  const send = () => {
    const content = value.trim();
    if (!content || disabled) return;

    try {
      onSend(content);
      setValue('');
      setError('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (err) {
      setError(err.message);
    }
  };

  const handleKeyDown = (e) => {
    // Enter로 전송, Shift+Enter로 줄바꿈
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  const handleChange = (e) => {
    setValue(e.target.value);
    // 입력 길이에 따라 높이를 늘린다.
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  return (
    <div className='message-input'>
      {error && <p className='message-input__error'>{error}</p>}

      <div className='message-input__row'>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={MAX_LENGTH}
          rows={1}
          disabled={disabled}
        />
        <button
          type='button'
          className='btn btn-solid'
          onClick={send}
          disabled={disabled || !value.trim()}
        >
          전송
        </button>
      </div>
    </div>
  );
}
