import { useState } from 'react'
import { ArrowLeft, Mail } from 'lucide-react'

function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="forgot-copy">Enter your email and we will send instructions to reset your password.</p>
      {submitted ? (
        <p className="form-message success" role="status">If an account exists for this email, reset instructions will be sent shortly.</p>
      ) : (
        <>
          <label>Email address<span className="input-with-icon"><Mail size={16} aria-hidden="true" /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></span></label>
          <button className="submit-button" type="submit">Send reset link <span aria-hidden="true">-&gt;</span></button>
        </>
      )}
      <button className="back-button" type="button" onClick={onBack}><ArrowLeft size={15} aria-hidden="true" /> Back to sign in</button>
    </form>
  )
}

export default ForgotPassword
