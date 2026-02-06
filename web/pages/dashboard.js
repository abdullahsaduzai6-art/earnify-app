import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../components/Layout';
import { api } from '../lib/api';
import { getToken } from '../lib/auth';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const hourlyEstimate = useMemo(() => {
    if (!data) return 0;
    return (data.stats.dailyEarning || 0) / 24;
  }, [data]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    let timer = null;
    async function load() {
      try {
        setError('');
        const me = await api('/api/me');
        setData(me);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
    timer = setInterval(load, 60_000);
    return () => timer && clearInterval(timer);
  }, [router]);

  return (
    <Layout>
      <div className="hstack space" style={{ marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>Dashboard</h1>
          <div className="small">Auto-refreshes every minute.</div>
        </div>
        <div className="hstack mobile-stack">
          <button className="btn btnSecondary mobile-btn" onClick={() => router.push('/deposit')}>Deposit</button>
          <button className="btn mobile-btn" onClick={() => router.push('/withdraw')}>Withdraw</button>
        </div>
      </div>

      <div className="card heroWrap" style={{ marginBottom: 2, width: '100%' }}>
        <img className="heroImg" src="/dashboard-hero.svg" alt="Dashboard Overview" style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>

      {loading ? <div className="card">Loading…</div> : null}
      {error ? <div className="card error">{error}</div> : null}

      {data ? (
        <>
          <div style={{ marginTop: 16 }}>
            <div className="card mobile-card" style={{ width: '100%', marginBottom: 12 }}>
              <div className="small">Total balance</div>
              <div style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 800 }}>${Number(data.stats.totalBalance || 0).toFixed(4)}</div>
            </div>
            <div className="card mobile-card" style={{ width: '100%', marginBottom: 12 }}>
              <div className="small">Daily earning (active plans)</div>
              <div style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 800 }}>${Number(data.stats.dailyEarning || 0).toFixed(4)}/day</div>
              <div className="small">~ ${hourlyEstimate.toFixed(4)}/hour</div>
            </div>
            <div className="card mobile-card" style={{ width: '100%', marginBottom: 16 }}>
              <div className="small">Invested amount</div>
              <div style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 800 }}>${Number(data.stats.investedAmount || 0).toFixed(2)}</div>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="card mobile-card" style={{ width: '100%', marginBottom: 16 }}>
              <div className="hstack space mobile-stack">
                <h2 style={{ margin: 0, fontSize: 'clamp(1.25rem, 3vw, 1.5rem)' }}>Recent transactions</h2>
                <span className="badge">Last 10</span>
              </div>
              <div className="mobile-table-container" style={{ overflowX: 'auto', marginTop: 10 }}>
                <table className="table mobile-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Network</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentTransactions?.length ? (
                      data.recentTransactions.map((t) => (
                        <tr key={t._id}>
                          <td>{t.type}</td>
                          <td>${t.amount}</td>
                          <td>{t.network}</td>
                          <td><span className="badge">{t.status}</span></td>
                          <td className="small mobile-date">{new Date(t.createdAt).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="small">No transactions yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card mobile-card" style={{ width: '100%' }}>
              <h2 style={{ marginTop: 0, fontSize: 'clamp(1.25rem, 3vw, 1.5rem)' }}>Referral</h2>
              <div className="small">Your code</div>
              <div style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.375rem)', fontWeight: 800, wordBreak: 'break-all' }}>{data.user.referralCode}</div>
            </div>
          </div>
        </>
      ) : null}
    </Layout>
  );
}
