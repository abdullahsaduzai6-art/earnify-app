import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../components/Layout';
import { api } from '../../lib/api';
import { getToken } from '../../lib/auth';

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [txns, setTxns] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function formatStatus(status) {
    if (status === 'completed') return 'Approved';
    if (status === 'failed') return 'Failed';
    return 'Pending';
  }

  async function load() {
    const [s, t] = await Promise.all([api('/api/admin/stats'), api('/api/admin/transactions')]);
    setStats(s);
    setTxns(t.transactions || []);
  }

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }

    (async () => {
      try {
        setError('');
        await load();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function setStatus(id, status) {
    try {
      setError('');
      await api(`/api/admin/transactions/${id}/status`, { method: 'POST', body: { status } });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Layout>
      <div className="hstack space" style={{ marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0 }}>Admin</h1>
          <div className="small">Access is allowed only for the configured admin email on the server.</div>
        </div>
      </div>

      {loading ? <div className="card">Loading…</div> : null}
      {error ? <div className="card error">{error}</div> : null}

      {stats ? (
        <div className="grid grid3" style={{ marginTop: 16 }}>
          <div className="card"><div className="small">Total deposits (approved)</div><div style={{ fontSize: 26, fontWeight: 800 }}>${stats.totalDeposits.toFixed(2)}</div></div>
          <div className="card"><div className="small">Total withdrawals (approved)</div><div style={{ fontSize: 26, fontWeight: 800 }}>${stats.totalWithdrawals.toFixed(2)}</div></div>
          <div className="card"><div className="small">Users</div><div style={{ fontSize: 26, fontWeight: 800 }}>{stats.activeUsers}</div></div>
        </div>
      ) : null}

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Transactions</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Network</th>
                <th>TXID</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {txns.length ? (
                txns.map((t) => (
                  <tr key={t._id}>
                    <td className="small">{t.userId}</td>
                    <td>{t.type}</td>
                    <td>${t.amount}</td>
                    <td>{t.network}</td>
                    <td className="small" style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.txid || ''}>{t.txid || '-'}</td>
                    <td><span className="badge">{formatStatus(t.status)}</span></td>
                    <td>
                      <div className="hstack">
                        <button className="btn" onClick={() => setStatus(t._id, 'completed')}>Approve</button>
                        <button className="btn btnSecondary" onClick={() => setStatus(t._id, 'failed')}>Fail</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="small">No transactions.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
