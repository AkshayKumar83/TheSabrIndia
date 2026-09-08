import { useState } from 'react'
import Login from './components/Login.jsx'
import Register from './components/Register.jsx'
import ForgotPassword from './components/ForgotPassword.jsx'
import Home from './components/Home.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'
import './App.css'

function App() {
  const [page, setPage] = useState('home')
  const [mode, setMode] = useState('login')

  function navigate(nextPage) {
    if (nextPage === 'login' || nextPage === 'register' || nextPage === 'forgot') {
      setMode(nextPage)
      setPage('account')
    } else {
      setPage(nextPage)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (page === 'home' || page === 'shop') return <><Home onNavigate={navigate} /><Contact /><Footer onNavigate={navigate} /></>
  if (page === 'contact') return <><Contact /><Footer onNavigate={navigate} /></>

  return (
    <main className="auth-shell">
      <section className="brand-panel">
        <div className="brand-mark" aria-hidden="true">S</div>
        <div className="brand-copy">
          <p className="eyebrow">THE SABR INDIA</p>
          <h1>Thoughtful goods.<br /><em>Patiently made.</em></h1>
          <p className="brand-description">A considered collection of everyday pieces, made to stay with you.</p>
        </div>
        <p className="brand-footer">Crafted with intention since 2026</p>
      </section>

      <section className="form-panel">
        <div className="form-wrap">
          <div className="mobile-brand">THE SABR INDIA</div>
          <div className="form-heading">
            <p className="eyebrow">YOUR ACCOUNT</p>
            <h2>{mode === 'register' ? 'Create your account' : mode === 'forgot' ? 'Reset your password' : 'Welcome back'}</h2>
            <p>{mode === 'register' ? 'Join a slower, more thoughtful way to shop.' : mode === 'forgot' ? 'We will help you get back into your account.' : 'Sign in to continue your journey with us.'}</p>
          </div>

          {mode !== 'forgot' && <div className="mode-switch" role="tablist" aria-label="Account action">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => navigate('login')} type="button">Sign in</button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => navigate('register')} type="button">Create account</button>
          </div>}
          {mode === 'register' ? <Register /> : mode === 'forgot' ? <ForgotPassword onBack={() => navigate('login')} /> : <Login onForgot={() => navigate('forgot')} />}
          <p className="legal-copy">By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</p>
        </div>
      </section>
    </main>
  )
}

export default App
