import { ArrowRight, Heart, Search, ShoppingBag, Sparkles } from 'lucide-react'

const products = [
  { name: 'Gulnaar Silk Saree', price: '₹8,900', detail: 'Handwoven tussar silk', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=85', tag: 'New arrival' },
  { name: 'Neelambari Cotton', price: '₹3,600', detail: 'Soft kala cotton', image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=900&q=85', tag: 'Everyday edit' },
  { name: 'Mogra Organza', price: '₹6,200', detail: 'Lightweight silk organza', image: 'https://images.unsplash.com/photo-1610189012906-7c6a6e2d5b83?auto=format&fit=crop&w=900&q=85', tag: 'Bestseller' },
]

function Home({ onNavigate }) {
  return <>
    <header className="store-header"><button className="store-logo" onClick={() => onNavigate('home')}><span>S</span> THE SABR INDIA</button><nav><button className="active" onClick={() => onNavigate('home')}>Home</button><button onClick={() => onNavigate('shop')}>Shop</button><button onClick={() => onNavigate('contact')}>Contact</button></nav><div className="header-actions"><button aria-label="Search"><Search size={19} /></button><button aria-label="Shopping bag"><ShoppingBag size={19} /></button><button className="account-link" onClick={() => onNavigate('login')}>Account</button></div></header>
    <main className="storefront">
      <section className="hero-section"><div className="hero-copy"><p className="section-kicker">THE FESTIVE EDIT · 2026</p><h1>Sarees with a<br /><em>story to tell.</em></h1><p>Beautifully woven drapes for the moments you will remember, chosen with patience and made to be lived in.</p><button className="dark-button" onClick={() => onNavigate('shop')}>Explore the collection <ArrowRight size={16} /></button></div><div className="hero-image"><img src="https://images.unsplash.com/photo-1610030469668-8e9f641aaf4b?auto=format&fit=crop&w=1300&q=88" alt="Woman wearing a pink saree" /><div className="hero-note"><Sparkles size={16} /><span>Made for your<br /><strong>special moments</strong></span></div></div></section>
      <section className="promise-strip"><div><span>01</span><strong>Thoughtfully sourced</strong><p>Every weave has a maker and a story.</p></div><div><span>02</span><strong>Easy, considered shopping</strong><p>Personal help whenever you need it.</p></div><div><span>03</span><strong>Made to last</strong><p>Pieces to pass from one celebration to the next.</p></div></section>
      <section className="product-section" id="shop"><div className="section-header"><div><p className="section-kicker">THE COLLECTION</p><h2>Find your <em>forever drape.</em></h2></div><button className="text-arrow" onClick={() => onNavigate('shop')}>View all sarees <ArrowRight size={15} /></button></div><div className="product-grid">{products.map((product) => <article className="product-card" key={product.name}><div className="product-image"><img src={product.image} alt={product.name} /><span>{product.tag}</span><button aria-label={`Save ${product.name}`}><Heart size={17} /></button></div><div className="product-info"><div><h3>{product.name}</h3><p>{product.detail}</p></div><strong>{product.price}</strong></div></article>)}</div></section>
      <section className="story-section"><div className="story-image"><img src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85" alt="Detail of a handwoven saree" /></div><div className="story-copy"><p className="section-kicker">OUR POINT OF VIEW</p><h2>More than a<br /><em>piece of cloth.</em></h2><p>We believe getting dressed can be a small act of joy. Our sarees are selected for their feel, their fall, and the hands behind them, so they become part of your story.</p><button className="text-arrow">Read our story <ArrowRight size={15} /></button></div></section>
    </main>
  </>
}

export default Home
