import { Link } from 'react-router-dom'

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-shell">
      <div className="radar" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="auth-card">
        <Link to="/login" className="auth-wordmark">
          mychat
        </Link>
        <h1 className="auth-title">{title}</h1>
        {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}
