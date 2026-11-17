import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import PhoneVerifyField from '../components/PhoneVerifyField'
import { findId } from '../api/auth'
import { useI18n } from '../context/LanguageContext'

export default function FindIdPage() {
  const { t } = useI18n()
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
    <AuthLayout title={t('findId.title')} subtitle={t('findId.subtitle')}>
      {foundUsername ? (
        <div className="auth-form">
          <span className="field-hint">{t('findId.yourId')}</span>
          <div className="result-value">{foundUsername}</div>
          <Link to="/login" className="btn btn-primary btn-block" style={{ textAlign: 'center', textDecoration: 'none' }}>
            {t('findId.goLogin')}
          </Link>
        </div>
      ) : (
        <div className="auth-form">
          {error && <div className="banner banner-error">{error}</div>}
          {loading && <div className="banner banner-success">{t('findId.loading')}</div>}

          <PhoneVerifyField
            phoneNumber={phoneNumber}
            onChangePhoneNumber={setPhoneNumber}
            verified={phoneVerified && !error}
            onVerified={handleVerified}
          />
        </div>
      )}

      <div className="auth-footer">
        <Link to="/login" className="link">{t('common.backToLogin')}</Link>
      </div>
    </AuthLayout>
  )
}
