import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import PhoneVerifyField from '../components/PhoneVerifyField'
import { resetPassword } from '../api/auth'

export default function FindPasswordPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!phoneVerified) {
      setError('휴대폰 인증을 먼저 완료해주세요.')
      return
    }
    if (newPassword !== newPasswordConfirm) {
      setError('새 비밀번호가 일치하지 않습니다.')
      return
    }
    if (newPassword.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      return
    }

    setLoading(true)
    try {
      await resetPassword({ username, phoneNumber, newPassword })
      navigate('/login', { state: { passwordReset: true } })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="비밀번호 찾기" subtitle="아이디와 휴대폰 인증으로 새 비밀번호를 설정해요.">
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="banner banner-error">{error}</div>}

        <div className="field">
          <label htmlFor="username">아이디</label>
          <input
            id="username"
            className="text-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <PhoneVerifyField
          phoneNumber={phoneNumber}
          onChangePhoneNumber={setPhoneNumber}
          verified={phoneVerified}
          onVerified={() => setPhoneVerified(true)}
        />

        {phoneVerified && (
          <>
            <div className="field">
              <label htmlFor="newPassword">새 비밀번호</label>
              <input
                id="newPassword"
                type="password"
                className="text-input"
                placeholder="8자 이상"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="newPasswordConfirm">새 비밀번호 확인</label>
              <input
                id="newPasswordConfirm"
                type="password"
                className="text-input"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                required
              />
            </div>
          </>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? '변경하는 중...' : '비밀번호 변경'}
        </button>
      </form>

      <div className="auth-footer">
        <Link to="/login" className="link">로그인으로 돌아가기</Link>
      </div>
    </AuthLayout>
  )
}
