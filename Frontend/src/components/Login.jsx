import { useState } from 'react'
import { Eye, EyeOff, Mail } from 'lucide-react'
import API_BASE_URL, { API_ROUTES } from '../config/api.js'

function Login({ onForgot }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState(null)

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setMessage(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage(null)
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}${API_ROUTES.login}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to login')
      localStorage.setItem('sabrIndiaToken', data.token)
      setMessage({ type: 'success', text: data.message })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>Email address<span className="input-with-icon"><Mail size={16} aria-hidden="true" /><input name="email" type="email" value={form.email} onChange={updateField} placeholder="you@example.com" autoComplete="email" required /></span></label>
      <label>Password<span className="password-field"><input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={updateField} placeholder="At least 6 characters" minLength="6" autoComplete="current-password" required /><button className="icon-button" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
      <div className="form-options"><label className="check-label"><input type="checkbox" /> <span>Remember me</span></label><button type="button" className="text-button" onClick={onForgot}>Forgot password?</button></div>
      {message && <p className={`form-message ${message.type}`} role="alert">{message.text}</p>}
      <button className="submit-button" type="submit" disabled={isLoading}>{isLoading ? 'Please wait...' : 'Sign in'} <span aria-hidden="true">-&gt;</span></button>
    </form>
  )
}

export default Login
