import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../components/Layout';
import { api } from '../lib/api';
import { getToken } from '../lib/auth';

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [me, setMe] = useState(null);
  const [amount, setAmount] = useState(20);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [investing, setInvesting] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }

    async function load() {
      try {
        setError('');
        const [p, m] = await Promise.all([api('/api/plans'), api('/api/me')]);
        setPlans(p.plans || []);
        setMe(m);
        if (p.plans?.length) setAmount(p.plans[0].amount);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  async function invest() {
    setInvesting(true);
    setError('');
    try {
      router.push(`/deposit?amount=${encodeURIComponent(amount)}&network=TRC20`);
    } finally {
      setInvesting(false);
    }
  }

  return (
    <Layout>
      <div className="hstack space" style={{ marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>Investment plans</h1>
          <div className="small">Invest using your Earnify balance.</div>
        </div>
        {me ? <div className="badge mobile-badge">Balance: ${Number(me.stats.totalBalance || 0).toFixed(4)}</div> : null}
      </div>

      <div className="card" style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
        <img
          src="/earnings-hero.svg"
          alt="Earnings"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </div>

      {loading ? <div className="card">Loading…</div> : null}
      {error ? <div className="card error">{error}</div> : null}

      <div className="grid grid2 mobile-grid" style={{ marginTop: 16 }}>
        <div className="card mobile-card">
          <h2 style={{ marginTop: 0, fontSize: 'clamp(1.25rem, 3vw, 1.5rem)' }}>Available plans</h2>
          <div className="mobile-table-container" style={{ overflowX: 'auto' }}>
            <table className="table mobile-table">
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Daily earning</th>
                  <th>Hourly earning</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p._id}>
                    <td>${p.amount}</td>
                    <td>${Number(p.dailyEarning).toFixed(4)}/day</td>
                    <td>${(Number(p.dailyEarning) / 24).toFixed(4)}/hour</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card mobile-card">
          <h2 style={{ marginTop: 0, fontSize: 'clamp(1.25rem, 3vw, 1.5rem)' }}>Invest</h2>
          <div className="formRow">
            <label className="label">Select amount</label>
            <select className="input mobile-input" value={amount} onChange={(e) => setAmount(e.target.value)}>
              {plans.map((p) => (
                <option key={p._id} value={p.amount}>{`$${p.amount} plan`}</option>
              ))}
            </select>
          </div>
          <button className="btn mobile-btn" onClick={invest} disabled={investing || !plans.length}>Invest now</button>
          <div className="small" style={{ marginTop: 10 }}>
            Earnings are credited hourly by the server scheduler.
          </div>
        </div>
      </div>
    </Layout>
  );
}
