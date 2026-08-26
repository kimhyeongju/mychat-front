import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import PhoneVerifyField from '../components/PhoneVerifyField'
import { findId } from '../api/auth'

export default function FindIdPage() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [foundUsername, setFoundUsername] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleVerified = async () => {
    setPhoneVerified(true)
    setError('')
    setLoading(true)
    try {
      const result = await findId(phoneNumber)
      setFoundUsername(result.username)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="아이디 찾기" subtitle="가입할 때 인증한 휴대폰 번호로 확인해드릴게요.">
      {foundUsername ? (
        <div className="auth-form">
          <span className="field-hint">회원님의 아이디입니다.</span>
          <div className="result-value">{foundUsername}</div>
          <Link to="/login" className="btn btn-primary btn-block" style={{ textAlign: 'center', textDecoration: 'none' }}>
            로그인하러 가기
          </Link>
        </div>
      ) : (
        <div className="auth-form">
          {error && <div className="banner banner-error">{error}</div>}
          {loading && <div className="banner banner-success">아이디를 조회하는 중...</div>}

          <PhoneVerifyField
            phoneNumber={phoneNumber}
            onChangePhoneNumber={setPhoneNumber}
            verified={phoneVerified && !error}
            onVerified={handleVerified}
          />
        </div>
      )}

      <div className="auth-footer">
        <Link to="/login" className="link">로그인으로 돌아가기</Link>
      </div>
    </AuthLayout>
  )
}
