import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../api/client'
import { logout } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import '../App.css'

export default function HomePage() {
  const [status, setStatus] = useState('checking...')
  const [message, setMessage] = useState('')
  const { isAuthenticated, markLoggedOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    apiRequest('/api/hello')
      .then((data) => {
        setStatus('connected')
        setMessage(data.message)
      })
      .catch((err) => {
        setStatus('disconnected')
        setMessage(err.message)
      })
  }, [])

  const handleLogout = async () => {
    await logout()
    markLoggedOut()
    navigate('/login')
  }

  return (
    <div className="app">
      <h1>mychat</h1>
      <p>프론트엔드 스캐폴드가 정상적으로 서비스되고 있습니다.</p>
      <div className={`status status--${status}`}>
        <strong>backend status:</strong> {status}
        {message && <div className="status__message">{message}</div>}
      </div>

      <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
        {isAuthenticated ? (
          <>
            <button className="btn btn-secondary" onClick={handleLogout}>로그아웃</button>
            <Link to="/withdraw" className="btn btn-secondary" style={{ textDecoration: 'none' }}>회원 탈퇴</Link>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>로그인</Link>
            <Link to="/signup" className="btn btn-secondary" style={{ textDecoration: 'none' }}>회원가입</Link>
          </>
        )}
      </div>
    </div>
  )
}
