import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { EMAIL_ERROR_MSG, isValidEmail } from '../../utils/format'
import '../AuthPages/AuthPages.css'

export default function LoginPage() {
  const { login, logout } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [asAdmin, setAsAdmin] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Vui lòng nhập email.')
      return
    }
    if (!isValidEmail(trimmedEmail)) {
      setError(EMAIL_ERROR_MSG)
      return
    }

    setLoading(true)
    try {
      const u = await login(trimmedEmail, password)

      if (asAdmin) {
        if (u.role !== 'admin') {
          await logout()
          setError('Tài khoản này không có quyền quản trị viên.')
          return
        }
        navigate('/admin')
        return
      }

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
        <h1 className="auth-title">Đăng nhập</h1>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && <p className="auth-error">{error}</p>}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Mật khẩu
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <label className="auth-check">
            <input
              type="checkbox"
              checked={asAdmin}
              onChange={(e) => setAsAdmin(e.target.checked)}
            />
            <span>Đăng nhập với quyền quản trị viên</span>
          </label>
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        <p className="auth-switch">
          Chưa có tài khoản? <Link to="/dang-ky">Đăng ký</Link>
        </p>
        <p className="auth-switch">
          <Link to="/cua-hang">Tiếp tục mua không đăng nhập</Link>
        </p>
      </div>
    </div>
  )
}