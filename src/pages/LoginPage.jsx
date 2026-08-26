import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { login } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { markLoggedIn } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      markLoggedIn()
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="로그인" subtitle="근처 사람들과의 대화가 기다리고 있어요.">
      <form className="auth-form" onSubmit={handleSubmit}>
        {location.state?.signedUp && (
          <div className="banner banner-success">회원가입이 완료됐어요. 로그인해주세요.</div>
        )}
        {error && <div className="banner banner-error">{error}</div>}

        <div className="field">
          <label htmlFor="username">아이디</label>
          <input
            id="username"
            className="text-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            required
          />
        </div>

        <div className="field">
          <label htmlFor="password">비밀번호</label>
          <input
            id="password"
            type="password"
            className="text-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? '로그인하는 중...' : '로그인'}
        </button>
      </form>

      <div className="auth-links">
        <Link to="/find-id">아이디 찾기</Link>
        <Link to="/find-password">비밀번호 찾기</Link>
      </div>

      <div className="auth-footer">
        아직 계정이 없으신가요? <Link to="/signup" className="link">회원가입</Link>
      </div>
    </AuthLayout>
  )
}
