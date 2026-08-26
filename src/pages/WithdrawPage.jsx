import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { withdraw } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function WithdrawPage() {
  const navigate = useNavigate()
  const { markLoggedOut } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmChecked, setConfirmChecked] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!confirmChecked) {
      setError('안내 사항을 확인하고 체크해주세요.')
      return
    }

    setLoading(true)
    try {
      await withdraw(password)
      markLoggedOut()
      navigate('/login', { state: { withdrawn: true } })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="회원 탈퇴" subtitle="탈퇴하면 채팅 기록과 계정 정보가 모두 삭제되며, 되돌릴 수 없어요.">
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="banner banner-error">{error}</div>}

        <div className="field">
          <label htmlFor="password">비밀번호 확인</label>
          <input
            id="password"
            type="password"
            className="text-input"
            placeholder="본인 확인을 위해 비밀번호를 입력해주세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
          <input
            type="checkbox"
            checked={confirmChecked}
            onChange={(e) => setConfirmChecked(e.target.checked)}
            style={{ marginTop: 2 }}
          />
          탈퇴 시 모든 데이터가 삭제되며 복구할 수 없다는 점을 확인했습니다.
        </label>

        <button type="submit" className="btn btn-danger btn-block" disabled={loading}>
          {loading ? '처리하는 중...' : '탈퇴하기'}
        </button>
      </form>

      <div className="auth-footer">
        <Link to="/" className="link">취소하고 돌아가기</Link>
      </div>
    </AuthLayout>
  )
}
