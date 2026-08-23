import { useEffect, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

function App() {
  const [status, setStatus] = useState('checking...')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/hello`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setStatus('connected')
        setMessage(data.message)
      })
      .catch((err) => {
        setStatus('disconnected')
        setMessage(err.message)
      })
  }, [])

  return (
    <div className="app">
      <h1>mychat</h1>
      <p>프론트엔드 스캐폴드가 정상적으로 서비스되고 있습니다.</p>
      <div className={`status status--${status}`}>
        <strong>backend status:</strong> {status}
        {message && <div className="status__message">{message}</div>}
      </div>
    </div>
  )
}

export default App
