import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { EMAIL_ERROR_MSG, isValidEmail } from '../../utils/format'
import '../AuthPages/AuthPages.css'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()

    if (!trimmedName) {
      setError('Vui lòng nhập tên người dùng.')
      return
    }
    if (!trimmedEmail) {
      setError('Vui lòng nhập email.')
      return
    }
    if (!isValidEmail(trimmedEmail)) {
      setError(EMAIL_ERROR_MSG)
      return
    }
    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.')
      return
    }
    if (password !== passwordConfirmation) {
      setError('Mật khẩu nhập lại không khớp.')
      return
    }

    setLoading(true)
    try {
      await register({
        name: trimmedName,
        email: trimmedEmail,
        password,
        password_confirmation: passwordConfirmation,
      })
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Đăng ký</h1>
        <p className="auth-hint">
          Tạo tài khoản khách hàng. Không bắt buộc để mua hàng.
        </p>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && <p className="auth-error">{error}</p>}
          <label>
            Tên người dùng 
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="ten@gmail.com"
              title={EMAIL_ERROR_MSG}
              required
            />
          </label>
          <label>
            Mật khẩu (tối thiểu 8 ký tự)
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </label>
          <label>
            Nhập lại mật khẩu
            <input
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>
        <p className="auth-switch">
          Đã có tài khoản? <Link to="/dang-nhap">Đăng nhập</Link>
        </p>
        <p className="auth-switch">
          <Link to="/cua-hang">Tiếp tục mua không đăng ký</Link>
        </p>
      </div>
    </div>
  )
}