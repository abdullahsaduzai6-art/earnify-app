import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { clearToken, getToken } from '../lib/auth';

export function Layout({ children }) {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setAuthed(Boolean(getToken()));
  }, []);

  useEffect(() => {
    if (authed) {
      (async () => {
        try {
          const res = await fetch('/api/me/is-admin');
          const data = await res.json();
          setIsAdmin(data.isAdmin);
        } catch (err) {
          console.error('Failed to check admin status:', err);
        }
      })();
    }
  }, [authed]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && !event.target.closest('.navLinks') && !event.target.closest('.hamburger')) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [mobileMenuOpen]);

  return (
    <>
      <div className="nav">
        <div className="navInner">
          <div className="hstack">
            <Link href="/dashboard"><strong>Earnify</strong></Link>
            <span className="badge">MVP</span>
          </div>
          
          <button 
            className="hamburger" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className={`navLinks ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            {authed ? (
              <>
                {router.pathname !== '/dashboard' && <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>}
                {router.pathname !== '/plans' && <Link href="/plans" onClick={() => setMobileMenuOpen(false)}>Plans</Link>}
                {router.pathname !== '/wallet' && <Link href="/wallet" onClick={() => setMobileMenuOpen(false)}>Wallet</Link>}
                {isAdmin && router.pathname !== '/admin' && <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>Admin</Link>}
                <button
                  className="btn btnSecondary"
                  onClick={() => {
                    clearToken();
                    setAuthed(false);
                    router.push('/login');
                    setMobileMenuOpen(false);
                  }}
                >
                  Logout
                </button>
                <a 
                  href="https://t.me/+923000118970" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="telegram-support-btn"
                  title="Contact Support on Telegram"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#0088cc',
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    marginLeft: '12px'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#0077b3';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#0088cc';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <img src="/telegram-icon.svg" alt="Telegram" style={{ width: '18px', height: '18px' }} />
                  <span className="support-text">Support</span>
                </a>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>Signup</Link>
                <a 
                  href="https://t.me/+923000118970" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="telegram-support-btn"
                  title="Contact Support on Telegram"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#0088cc',
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    marginLeft: '12px'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#0077b3';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#0088cc';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <img src="/telegram-icon.svg" alt="Telegram" style={{ width: '18px', height: '18px' }} />
                  <span className="support-text">Support</span>
                </a>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="container">{children}</div>
    </>
  );
}
