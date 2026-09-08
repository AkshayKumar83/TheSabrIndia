import { Camera, Mail, MapPin, Phone } from 'lucide-react'

function Footer({ onNavigate }) {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <div className="footer-mark">S</div>
          <p className="footer-title">The Sabr India</p>
          <p>Handpicked sarees for the rituals, celebrations, and quiet moments of life.</p>
          <a className="social-link" href="https://instagram.com" target="_blank" rel="noreferrer"><Camera size={16} /> Follow our drape diary</a>
        </div>
        <div className="footer-column"><p className="footer-heading">Explore</p><button onClick={() => onNavigate('home')}>Home</button><button onClick={() => onNavigate('shop')}>Shop sarees</button><button onClick={() => onNavigate('contact')}>Contact us</button></div>
        <div className="footer-column"><p className="footer-heading">Help</p><button>Shipping & returns</button><button>Care guide</button><button onClick={() => onNavigate('login')}>My account</button></div>
        <div className="footer-column contact-column"><p className="footer-heading">Come say hello</p><p><MapPin size={15} /> Jaipur, Rajasthan</p><p><Phone size={15} /> +91 98765 43210</p><p><Mail size={15} /> hello@thesabrindia.com</p></div>
      </div>
      <div className="footer-bottom"><span>© 2026 The Sabr India</span><span>Made slowly, worn often.</span></div>
    </footer>
  )
}

export default Footer
