import { useState, type FormEvent } from 'react'

type LoginModalProps = {
  onLogin: (email: string) => void
}

function LoginModal({ onLogin }: LoginModalProps) {
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [message, setMessage] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    onLogin(email)
  }

  return (
    <main className="login-page">
      <section className="login-brand" aria-label="Fastcart">
        <div className="login-brand-content">
          <p className="login-welcome">Welcome to admin panel</p>
          <div className="fastcart-logo" aria-label="Fastcart">
            <svg viewBox="0 0 64 48" fill="none" aria-hidden="true">
              <path
                d="M2 4h9l11 28h34"
                stroke="#FFB900"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 8h30l5 17H24L20 8Z"
                fill="#FFB900"
                stroke="#FFB900"
                strokeLinejoin="round"
              />
              <path d="M29 13h12M27 19h17M25 25h20" stroke="#202B40" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="30" cy="41" r="3.5" stroke="#FFB900" strokeWidth="2.5" />
              <circle cx="47" cy="41" r="3.5" stroke="#FFB900" strokeWidth="2.5" />
            </svg>
            <span className="fastcart-wordmark">fastcart</span>
          </div>
        </div>
      </section>

      <section className="login-panel" aria-labelledby="login-title">
        <form className="login-form-wrap" onSubmit={handleSubmit}>
          <h1 className="login-title" id="login-title">Log in</h1>
          <div className="login-field">
            <label className="sr-only" htmlFor="login-email">Email</label>
            <input
              className="login-input"
              id="login-email"
              name="email"
              type="email"
              placeholder="Email"
              autoComplete="username"
              required
            />
          </div>
          <div className="login-field password-field">
            <label className="sr-only" htmlFor="login-password">Password</label>
            <input
              className="login-input"
              id="login-password"
              name="password"
              type={passwordVisible ? 'text' : 'password'}
              placeholder="Password"
              autoComplete="current-password"
              required
            />
            <button
              className="password-toggle"
              type="button"
              aria-label={passwordVisible ? 'Hide password' : 'Show password'}
              aria-pressed={passwordVisible}
              onClick={() => setPasswordVisible((visible) => !visible)}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="2.7" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </button>
          </div>
          <button
            className="forgot-password"
            type="button"
            onClick={() => setMessage('Password recovery is not connected yet.')}
          >
            Forgot password?
          </button>
          <button className="login-submit" type="submit">Log in</button>
          <p className="login-message" role="status">{message || 'Demo mode: enter any email and password.'}</p>
        </form>
      </section>
    </main>
  )
}

export default LoginModal










