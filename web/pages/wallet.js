import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../components/Layout';
import { api } from '../lib/api';
import { getToken } from '../lib/auth';

export default function WalletPage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [m, t] = await Promise.all([api('/api/me'), api('/api/transactions')]);
    setMe(m);
    setTransactions(t.transactions || []);
  }

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }

    (async () => {
      try {
        setError('');
        await refresh();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  function formatStatus(status) {
    if (status === 'completed') return 'Approved';
    if (status === 'failed') return 'Failed';
    return 'Pending';
  }

  return (
    <Layout>
      <div className="hstack space" style={{ marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>Wallet</h1>
          <div className="small">TRC20 (starts with T) and BEP20 (0x...) only.</div>
        </div>
        <div className="hstack mobile-stack">
          <button className="btn btnSecondary mobile-btn" onClick={() => router.push('/deposit')}>Deposit</button>
          <button className="btn mobile-btn" onClick={() => router.push('/withdraw')}>Withdraw</button>
          {me ? <div className="badge mobile-badge">Balance: ${Number(me.stats.totalBalance || 0).toFixed(4)}</div> : null}
        </div>
      </div>

      {loading ? <div className="card">Loading…</div> : null}
      {error ? <div className="card error">{error}</div> : null}

      <div className="card mobile-card" style={{ marginTop: 16 }}>
        <div className="hstack space mobile-stack">
          <h2 style={{ margin: 0, fontSize: 'clamp(1.25rem, 3vw, 1.5rem)' }}>Transactions</h2>
          <span className="badge">Latest</span>
        </div>
        <div className="mobile-table-container" style={{ overflowX: 'auto', marginTop: 10 }}>
          <table className="table mobile-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Amount</th>
                <th>Network</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length ? (
                transactions.map((t) => (
                  <tr key={t._id}>
                    <td>{t.type}</td>
                    <td>${t.amount}</td>
                    <td>{t.network}</td>
                    <td><span className="badge">{formatStatus(t.status)}</span></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="small">No transactions yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
