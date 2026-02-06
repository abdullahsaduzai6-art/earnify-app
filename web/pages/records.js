import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../components/Layout';
import { api } from '../lib/api';
import { getToken } from '../lib/auth';

export default function RecordsPage() {
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

  function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
  }

  return (
    <Layout>
      <div className="hstack space" style={{ marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0 }}>Transaction Records</h1>
          <div className="small">View all your deposit and withdrawal history</div>
        </div>
        {me ? <div className="badge">Balance: ${Number(me.stats.totalBalance || 0).toFixed(4)}</div> : null}
      </div>

      {loading ? <div className="card">Loading…</div> : null}
      {error ? <div className="card error">{error}</div> : null}

      <div className="card">
        <h2 style={{ marginTop: 0 }}>All Transactions</h2>
        <div className="mobile-table-container">
          <table className="table mobile-table">
            <thead>
              <tr>
                <th>Date</th>
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
                    <td className="mobile-date">{formatDate(t.createdAt)}</td>
                    <td>{t.type}</td>
                    <td>${t.amount}</td>
                    <td>{t.network || '-'}</td>
                    <td><span className="badge mobile-badge">{formatStatus(t.status)}</span></td>
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

      <div className="hstack" style={{ marginTop: 16 }}>
        <button className="btn btnSecondary" onClick={() => router.push('/deposit')}>Back to Deposit</button>
        <button className="btn btnSecondary" onClick={() => router.push('/wallet')}>Back to Wallet</button>
      </div>
    </Layout>
  );
}
