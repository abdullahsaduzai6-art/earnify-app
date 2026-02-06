import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Layout } from '../components/Layout';
import { api } from '../lib/api';
import { setToken } from '../lib/auth';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api('/api/auth/signup', {
        method: 'POST',
        body: { name, email, password, phone: phone || undefined, referralCode: referralCode || undefined },
      });
      setToken(data.token);
      router.push('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="card heroWrap" style={{ marginBottom: 2, width: '100%' }}>
        <img className="heroImg" src="/auth-hero.svg" alt="Welcome to Earnify - Signup" style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>

      <div className="grid auth-form-container" style={{ maxWidth: 520, margin: '0 auto', width: '100%', padding: '0 2px' }}>
        <div className="card auth-card">
          <h1 style={{ marginTop: 0 }}>Create account</h1>
          <p className="small">Password must be 8+ chars and include 1 special character.</p>
          <form onSubmit={onSubmit}>
            <div className="formRow">
              <label className="label">Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="formRow">
              <label className="label">Email</label>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="formRow">
              <label className="label">Phone (optional)</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="formRow">
              <label className="label">Password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="formRow">
              <label className="label">Referral code (optional)</label>
              <input className="input" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} />
            </div>
            {error ? <div className="error" style={{ marginBottom: 12 }}>{error}</div> : null}
            <div className="hstack space">
              <button className="btn" disabled={loading}>Signup</button>
              <Link className="small" href="/login">Have an account?</Link>
            </div>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <p className="small">Need help? <a href="https://t.me/+923000118970" target="_blank" rel="noopener noreferrer" style={{ color: '#0088cc', textDecoration: 'none' }}>
                💬 Contact Support on Telegram
              </a></p>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
