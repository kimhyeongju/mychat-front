import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import PhoneVerifyField from '../components/PhoneVerifyField'
import { resetPassword } from '../api/auth'
import PasswordRules from '../components/PasswordRules'
import { useI18n } from '../context/LanguageContext'
import { validatePassword } from '../utils/password'

export default function FindPasswordPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
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
      setError(t('phone.needVerify'))
      return
    }
    if (newPassword !== newPasswordConfirm) {
      setError(t('findPw.mismatch'))
      return
    }
    const passwordError = validatePassword(newPassword, t)
    if (passwordError) {
      setError(passwordError)
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
    <AuthLayout title={t('findPw.title')} subtitle={t('findPw.subtitle')}>
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="banner banner-error">{error}</div>}

        <div className="field">
          <label htmlFor="username">{t('findPw.username')}</label>
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
              <label htmlFor="newPassword">{t('findPw.newPassword')}</label>
              <input
                id="newPassword"
                type="password"
                className="text-input"
                placeholder={t('pw.hint')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <PasswordRules password={newPassword} />
            </div>
            <div className="field">
              <label htmlFor="newPasswordConfirm">{t('findPw.newPasswordConfirm')}</label>
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
          {loading ? t('findPw.submitting') : t('findPw.submit')}
        </button>
      </form>

      <div className="auth-footer">
        <Link to="/login" className="link">{t('common.backToLogin')}</Link>
      </div>
    </AuthLayout>
  )
}
