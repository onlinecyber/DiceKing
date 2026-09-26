import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, 
  Search, 
  Check, 
  Shield, 
  Zap, 
  Lock, 
  Sparkles, 
  ChevronRight, 
  Server, 
  Headphones, 
  CheckCircle2, 
  ShoppingCart,
  ArrowRight,
  ExternalLink,
  Star
} from 'lucide-react';
import Navbar from '../components/Common/Navbar';
import BottomNav from '../components/Common/BottomNav';
import GlassCard from '../components/Common/GlassCard';

const DOMAIN_PRICING_DATA = [
  { tld: '.in', price: 865, originalPrice: 1199, isHot: true, category: 'Popular', badge: 'SPECIAL OFFER' },
  { tld: '.com', price: 1290, originalPrice: 1699, isHot: true, category: 'Popular', badge: 'MOST POPULAR' },
  { tld: '.org', price: 1450, originalPrice: 1899, isHot: false, category: 'Popular', badge: null },
  { tld: '.net', price: 1380, originalPrice: 1799, isHot: false, category: 'Popular', badge: null },
  { tld: '.co', price: 2150, originalPrice: 2899, isHot: true, category: 'Business', badge: 'BUSINESS' },
  { tld: '.io', price: 3290, originalPrice: 4299, isHot: true, category: 'Tech', badge: 'TECH CHOICE' },
  { tld: '.ai', price: 5490, originalPrice: 6999, isHot: true, category: 'Tech', badge: 'HOT AI TREND' },
  { tld: '.tech', price: 1850, originalPrice: 2499, isHot: false, category: 'Tech', badge: null },
  { tld: '.app', price: 1790, originalPrice: 2299, isHot: false, category: 'Tech', badge: null },
  { tld: '.dev', price: 1490, originalPrice: 1999, isHot: false, category: 'Tech', badge: null },
  { tld: '.online', price: 1120, originalPrice: 1599, isHot: false, category: 'General', badge: null },
  { tld: '.store', price: 1650, originalPrice: 2199, isHot: false, category: 'Business', badge: null },
  { tld: '.info', price: 1350, originalPrice: 1799, isHot: false, category: 'General', badge: null },
  { tld: '.biz', price: 1580, originalPrice: 2099, isHot: false, category: 'Business', badge: null },
  { tld: '.club', price: 1250, originalPrice: 1699, isHot: false, category: 'General', badge: null },
  { tld: '.xyz', price: 1190, originalPrice: 1599, isHot: false, category: 'General', badge: null },
];

const DomainPricing = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [registrationYears, setRegistrationYears] = useState(1);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Handle live domain search simulation
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setSearching(true);
    setSearchResult(null);

    setTimeout(() => {
      setSearching(false);
      let cleanDomain = searchTerm.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
      let hasExtension = cleanDomain.includes('.');
      
      let domainName = hasExtension ? cleanDomain.substring(0, cleanDomain.lastIndexOf('.')) : cleanDomain;
      let extension = hasExtension ? cleanDomain.substring(cleanDomain.lastIndexOf('.')) : '.in';

      // Match extension pricing or default to .in (865) or .com (1290)
      const matchedTld = DOMAIN_PRICING_DATA.find(d => d.tld === extension) || { tld: extension, price: 1290, originalPrice: 1699 };

      setSearchResult({
        fullDomain: `${domainName}${matchedTld.tld}`,
        name: domainName,
        tld: matchedTld.tld,
        price: matchedTld.price,
        originalPrice: matchedTld.originalPrice,
        isAvailable: true,
        alternatives: DOMAIN_PRICING_DATA.filter(d => d.tld !== matchedTld.tld).slice(0, 4).map(d => ({
          fullDomain: `${domainName}${d.tld}`,
          tld: d.tld,
          price: d.price,
          originalPrice: d.originalPrice
        }))
      });
    }, 600);
  };

  const addToCart = (domainObj) => {
    if (!cart.some(item => item.fullDomain === domainObj.fullDomain)) {
      setCart([...cart, domainObj]);
    }
    setShowCheckoutModal(true);
  };

  const removeFromCart = (fullDomain) => {
    setCart(cart.filter(item => item.fullDomain !== fullDomain));
  };

  const totalCartPrice = cart.reduce((sum, item) => sum + item.price * registrationYears, 0);

  const categories = ['All', 'Popular', 'Tech', 'Business', 'General'];

  const filteredDomains = DOMAIN_PRICING_DATA.filter(item => {
    if (selectedCategory === 'All') return true;
    return item.category === selectedCategory;
  });

  return (
    <div className="app-container" style={{ paddingBottom: '90px', background: '#0b0914' }}>
      <Navbar />

      <div className="content-container" style={{ gap: '20px', paddingTop: '10px' }}>

        {/* Hero Section Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.25) 0%, rgba(245, 158, 11, 0.15) 50%, rgba(11, 9, 20, 0.95) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '24px',
          padding: '28px 20px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)'
        }}>
          {/* Background Glows */}
          <div style={{
            position: 'absolute',
            top: '-40px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.7rem',
            fontWeight: '800',
            color: 'var(--accent-gold)',
            marginBottom: '12px'
          }}>
            <Sparkles size={14} /> OFFICIAL DOMAIN REGISTRATION PROVIDER
          </div>

          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '900',
            color: '#fff',
            lineHeight: '1.2',
            marginBottom: '10px',
            letterSpacing: '-0.5px'
          }}>
            Search & Register Your <span style={{
              background: 'linear-gradient(135deg, var(--accent-gold), #fbbf24)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Ideal Domain Name</span>
          </h1>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 20px' }}>
            Instant Domain Registration with Free WHOIS Privacy Guard, DNS Management, and Free SSL Integration.
          </p>

          {/* Interactive Search Bar */}
          <form onSubmit={handleSearch} style={{ maxWidth: '520px', margin: '0 auto', position: 'relative' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1.5px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '4px 6px 4px 14px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(10px)'
            }}>
              <Globe size={18} color="var(--accent-gold)" style={{ flexShrink: 0, marginRight: '8px' }} />
              <input 
                type="text"
                placeholder="Type your domain name (e.g. mybrand.in)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              />
              <button
                type="submit"
                disabled={searching}
                style={{
                  background: 'linear-gradient(135deg, var(--accent-gold), #d97706)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  color: '#000',
                  fontWeight: '900',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
                }}
              >
                {searching ? (
                  <span>Checking...</span>
                ) : (
                  <>
                    <Search size={16} />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Special Hot Deal Banner for .IN */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '16px',
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '12px',
            padding: '6px 14px',
            fontSize: '0.75rem',
            color: '#4ade80'
          }}>
            <Star size={14} color="#4ade80" />
            <span>🔥 <strong>.IN Domain Deal:</strong> Only <strong>₹865/yr</strong> (Limited Time Offer!)</span>
          </div>
        </div>

        {/* Domain Search Result Box */}
        {searchResult && (
          <GlassCard style={{ padding: '18px', borderRadius: '20px', border: '1px solid rgba(34, 197, 94, 0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#fff' }}>
                    {searchResult.fullDomain}
                  </span>
                  <span style={{
                    background: 'rgba(34, 197, 94, 0.2)',
                    border: '1px solid #22c55e',
                    color: '#4ade80',
                    fontSize: '0.62rem',
                    fontWeight: '900',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    AVAILABLE
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Congratulations! This domain is available for instant registration.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--accent-gold)' }}>
                    ₹{searchResult.price} <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>/1st yr</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#ef4444', textDecoration: 'line-through' }}>
                    ₹{searchResult.originalPrice}
                  </div>
                </div>

                <button
                  onClick={() => addToCart({ fullDomain: searchResult.fullDomain, price: searchResult.price, tld: searchResult.tld })}
                  style={{
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '10px 18px',
                    color: '#fff',
                    fontWeight: '900',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)'
                  }}
                >
                  <ShoppingCart size={16} />
                  <span>Register Now</span>
                </button>
              </div>
            </div>

            {/* Alternatives */}
            {searchResult.alternatives && searchResult.alternatives.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '8px' }}>
                  OTHER AVAILABLE EXTENSIONS FOR "{searchResult.name}":
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                  {searchResult.alternatives.map((alt) => (
                    <div 
                      key={alt.fullDomain}
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#fff' }}>{alt.fullDomain}</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--accent-gold)' }}>₹{alt.price}</div>
                      </div>
                      <button
                        onClick={() => addToCart({ fullDomain: alt.fullDomain, price: alt.price, tld: alt.tld })}
                        style={{
                          background: 'rgba(245, 158, 11, 0.2)',
                          border: '1px solid var(--accent-gold)',
                          color: 'var(--accent-gold)',
                          borderRadius: '8px',
                          padding: '4px 8px',
                          fontSize: '0.68rem',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>
        )}

        {/* Feature Highlights Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          {[
            { icon: Shield, title: 'WHOIS Privacy', desc: 'Free Identity Protection' },
            { icon: Zap, title: 'Instant Setup', desc: 'Active within 60s' },
            { icon: Lock, title: 'DNS Security', desc: 'Domain Lock Protection' },
            { icon: Server, title: 'Free Nameservers', desc: 'High-speed Cloud DNS' }
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <GlassCard key={index} style={{ padding: '12px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={18} color="var(--accent-gold)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#fff' }}>{item.title}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Domain Pricing Catalog Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '1px' }}>
                LIVE DOMAIN PRICING CATALOG
              </div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff', margin: 0 }}>
                Transparent Extension Rates
              </h2>
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    background: selectedCategory === cat ? 'linear-gradient(135deg, var(--accent-gold), #d97706)' : 'rgba(255, 255, 255, 0.05)',
                    border: selectedCategory === cat ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: selectedCategory === cat ? '#000' : 'var(--text-secondary)',
                    fontWeight: selectedCategory === cat ? '800' : '600',
                    fontSize: '0.68rem',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Table Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {filteredDomains.map((item) => (
              <GlassCard 
                key={item.tld}
                style={{
                  padding: '16px',
                  borderRadius: '18px',
                  position: 'relative',
                  border: item.tld === '.in' ? '1.5px solid rgba(34, 197, 94, 0.5)' : (item.isHot ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)'),
                  boxShadow: item.tld === '.in' ? '0 4px 20px rgba(34, 197, 94, 0.15)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                {/* Top Badge */}
                {item.badge && (
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    fontSize: '0.55rem',
                    fontWeight: '900',
                    background: item.tld === '.in' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    border: item.tld === '.in' ? '1px solid #22c55e' : '1px solid var(--accent-gold)',
                    color: item.tld === '.in' ? '#4ade80' : 'var(--accent-gold)',
                    padding: '2px 6px',
                    borderRadius: '6px'
                  }}>
                    {item.badge}
                  </span>
                )}

                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fff', marginBottom: '4px' }}>
                    {item.tld}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                    Ideal for {item.category.toLowerCase()} websites & brand registration.
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '10px' }}>
                    <span style={{
                      fontSize: '1.4rem',
                      fontWeight: '900',
                      color: item.tld === '.in' ? '#4ade80' : 'var(--accent-gold)'
                    }}>
                      ₹{item.price}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>/yr</span>
                    <span style={{ fontSize: '0.68rem', color: '#ef4444', textDecoration: 'line-through', marginLeft: 'auto' }}>
                      ₹{item.originalPrice}
                    </span>
                  </div>

                  <button
                    onClick={() => addToCart({ fullDomain: `yourdomain${item.tld}`, price: item.price, tld: item.tld })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '10px',
                      background: item.tld === '.in' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'rgba(255, 255, 255, 0.08)',
                      border: item.tld === '.in' ? 'none' : '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#fff',
                      fontWeight: '800',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>Register Domain</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Why Choose Us Features */}
        <GlassCard style={{ padding: '20px', borderRadius: '20px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '900', color: '#fff', marginBottom: '12px' }}>
            🔒 Included Free With Every Domain Registration:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {[
              'Full WHOIS Privacy Guard',
              'Auto NameServer Management',
              'Domain Theft Protection Lock',
              'Free SSL Certificate Integration',
              '24/7 Technical Support',
              'Instant DNS Record Sync'
            ].map((feature, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <CheckCircle2 size={16} color="#4ade80" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </GlassCard>

      </div>

      {/* Checkout Drawer / Modal */}
      {showCheckoutModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <GlassCard style={{
            maxWidth: '420px',
            width: '100%',
            padding: '24px',
            borderRadius: '24px',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff' }}>
                🛒 Domain Order Summary
              </div>
              <button 
                onClick={() => { setShowCheckoutModal(false); setOrderPlaced(false); }}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            {orderPlaced ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎉</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--accent-gold)', marginBottom: '6px' }}>
                  Domain Order Reserved!
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Your domain registration request has been locked. Check your email for DNS configuration details.
                </div>
                <button
                  onClick={() => { setShowCheckoutModal(false); setOrderPlaced(false); setCart([]); }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, var(--accent-gold), #d97706)',
                    border: 'none',
                    color: '#000',
                    fontWeight: '900',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {cart.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '12px' }}>
                      Your domain cart is currently empty.
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div 
                        key={item.fullDomain}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '10px 12px',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: '900', color: '#fff' }}>{item.fullDomain}</div>
                          <div style={{ fontSize: '0.65rem', color: '#4ade80' }}>Includes Privacy Protection</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: '900', color: 'var(--accent-gold)' }}>
                            ₹{item.price * registrationYears}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.fullDomain)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Registration Term Selector */}
                {cart.length > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Registration Period:</span>
                      <select
                        value={registrationYears}
                        onChange={(e) => setRegistrationYears(Number(e.target.value))}
                        style={{
                          background: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          color: '#fff',
                          padding: '4px 8px',
                          fontWeight: '700',
                          outline: 'none'
                        }}
                      >
                        <option value={1} style={{ background: '#1a162b', color: '#fff' }}>1 Year</option>
                        <option value={2} style={{ background: '#1a162b', color: '#fff' }}>2 Years</option>
                        <option value={3} style={{ background: '#1a162b', color: '#fff' }}>3 Years</option>
                        <option value={5} style={{ background: '#1a162b', color: '#fff' }}>5 Years</option>
                      </select>
                    </div>

                    <div style={{
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                      paddingTop: '12px',
                      marginBottom: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.85rem' }}>Total Amount:</span>
                      <span style={{ color: '#4ade80', fontWeight: '900', fontSize: '1.3rem' }}>₹{totalCartPrice}</span>
                    </div>

                    <button
                      onClick={() => setOrderPlaced(true)}
                      style={{
                        width: '100%',
                        padding: '13px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, var(--accent-gold), #d97706)',
                        border: 'none',
                        color: '#000',
                        fontWeight: '900',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(245, 158, 11, 0.35)'
                      }}
                    >
                      Proceed to Register (₹{totalCartPrice})
                    </button>
                  </>
                )}
              </>
            )}
          </GlassCard>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default DomainPricing;
