import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { withdraw } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../context/LanguageContext'

export default function WithdrawPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { markLoggedOut } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmChecked, setConfirmChecked] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!confirmChecked) {
      setError(t('withdraw.needAgree'))
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
    <AuthLayout title={t('withdraw.title')} subtitle={t('withdraw.subtitle')}>
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="banner banner-error">{error}</div>}

        <div className="field">
          <label htmlFor="password">{t('withdraw.password')}</label>
          <input
            id="password"
            type="password"
            className="text-input"
            placeholder={t('withdraw.passwordPlaceholder')}
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
          {t('withdraw.agree')}
        </label>

        <button type="submit" className="btn btn-danger btn-block" disabled={loading}>
          {loading ? t('withdraw.submitting') : t('withdraw.submit')}
        </button>
      </form>

      <div className="auth-footer">
        <Link to="/" className="link">{t('withdraw.cancel')}</Link>
      </div>
    </AuthLayout>
  )
}
