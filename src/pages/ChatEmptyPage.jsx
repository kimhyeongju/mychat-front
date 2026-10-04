export default function ChatEmptyPage() {
  return (
    <div className='chat-empty'>
      <span className='chat-empty__emoji' aria-hidden='true'>
        💬
      </span>
      <p className='chat-empty__text'>왼쪽에서 대화를 선택하세요.</p>
    </div>
  );
}
