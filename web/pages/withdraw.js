import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../components/Layout';
import { api } from '../lib/api';
import { getToken } from '../lib/auth';

export default function WithdrawPage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [network, setNetwork] = useState('TRC20');
  const [walletAddress, setWalletAddress] = useState('');
  const [amount, setAmount] = useState(20);

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

  async function createWithdraw() {
    try {
      setError('');
      setSubmitting(true);
      await api('/api/transactions/withdraw', {
        method: 'POST',
        body: { amount: Number(amount), network, walletAddress },
      });
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function formatStatus(status) {
    if (status === 'completed') return 'Approved';
    if (status === 'failed') return 'Failed';
    return 'Pending';
  }

  return (
    <Layout>
      <div className="hstack space" style={{ marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0 }}>Withdraw</h1>
          <div className="small">Create a withdrawal request. Admin will process and approve.</div>
        </div>
        {me ? <div className="badge">Balance: ${Number(me.stats.totalBalance || 0).toFixed(4)}</div> : null}
      </div>

      {loading ? <div className="card">Loading…</div> : null}
      {error ? <div className="card error">{error}</div> : null}

      <div className="grid grid2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="formRow">
            <label className="label">Network</label>
            <select className="input" value={network} onChange={(e) => setNetwork(e.target.value)}>
              <option value="TRC20">TRC20</option>
              <option value="BEP20">BEP20</option>
            </select>
          </div>

          <div className="formRow">
            <label className="label">Your wallet address</label>
            <input className="input" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} />
          </div>

          <div className="formRow">
            <label className="label">Amount (USD)</label>
            <input className="input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>

          <div className="hstack">
            <button className="btn" onClick={createWithdraw} disabled={submitting}>
              {submitting ? 'Confirming…' : 'Confirm Withdraw'}
            </button>
            <button className="btn btnSecondary" onClick={() => router.push('/wallet')}>Back to Wallet</button>
          </div>

          <div className="small" style={{ marginTop: 10 }}>
            Withdrawals start as pending. Admin marks as approved after payment.
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>Recent transactions</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
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
      </div>
    </Layout>
  );
}
