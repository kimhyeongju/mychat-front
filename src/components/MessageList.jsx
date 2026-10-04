function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

function isSameDay(a, b) {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export default function MessageList({ messages, myId }) {
  return (
    <ul className='messages'>
      {messages.map((message, index) => {
        const previous = messages[index - 1];
        const showDate =
          !previous || !isSameDay(previous.createdAt, message.createdAt);
        // 같은 사람이 연속으로 보내면 닉네임을 반복해서 보여주지 않는다.
        const showSender =
          showDate || !previous || previous.senderId !== message.senderId;

        const mine = myId != null && message.senderId === myId;

        return (
          <li key={message.id}>
            {showDate && (
              <div className='messages__date'>
                {formatDate(message.createdAt)}
              </div>
            )}

            <div className={`message ${mine ? 'message--mine' : ''}`}>
              {showSender && !mine && (
                <span className='message__sender'>
                  {message.senderNickname}
                  {message.senderType === 'ANONYMOUS' && (
                    <span className='message__tag'>익명</span>
                  )}
                </span>
              )}

              <div className='message__row'>
                {/* 사용자 입력은 React가 자동으로 이스케이프하므로 XSS가 발생하지 않는다.
                    dangerouslySetInnerHTML을 쓰지 않는 것이 중요하다. */}
                <div className='message__bubble'>{message.content}</div>
                <span className='message__time'>
                  {formatTime(message.createdAt)}
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
