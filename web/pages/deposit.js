import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../components/Layout';
import { api } from '../lib/api';
import { getToken } from '../lib/auth';

export default function DepositPage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);

  const EARNIFY_DEPOSIT_ADDRESSES = {
    BEP20: process.env.NEXT_PUBLIC_EARNIFY_BEP20 || '0x213d033c96922a9f633262e7825f75dc53c2b2fe',
    TRC20: process.env.NEXT_PUBLIC_EARNIFY_TRC20 || 'TQMe2k3XAtq3ZqYe1gDSasV3tcxvwdnaR3',
  };

  const [network, setNetwork] = useState('TRC20');
  const [walletAddress, setWalletAddress] = useState('');
  const [amount, setAmount] = useState(20);
  const [txid, setTxid] = useState('');

  const [depositDeadline, setDepositDeadline] = useState(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const [copied, setCopied] = useState(false);

  const earnifyAddress = EARNIFY_DEPOSIT_ADDRESSES[network] || '';


  useEffect(() => {
    if (depositDeadline) return;
    setDepositDeadline(Date.now() + 15 * 60 * 1000);
  }, [depositDeadline]);

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

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

  useEffect(() => {
    const qAmount = router.query.amount;
    const qNetwork = router.query.network;

    if (typeof qAmount === 'string' && qAmount.trim() !== '') {
      const n = Number(qAmount);
      if (!Number.isNaN(n) && n > 0) setAmount(n);
    }

    if (qNetwork === 'TRC20' || qNetwork === 'BEP20') {
      setNetwork(qNetwork);
    }
  }, [router.query.amount, router.query.network]);

  async function createDeposit() {
    try {
      setError('');
      setSubmitting(true);
      setShowSpinner(true);
      await api('/api/transactions/deposit', {
        method: 'POST',
        body: { amount: Number(amount), network, walletAddress, txid },
      });
      await refresh();
      setTxid('');
      setDepositDeadline(Date.now() + 15 * 60 * 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
      setTimeout(() => setShowSpinner(false), 2000);
    }
  }

  const remainingMs = depositDeadline ? Math.max(0, depositDeadline - nowMs) : 0;
  const depositExpired = Boolean(depositDeadline) && remainingMs <= 0;

  function formatRemaining(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
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
          <h1 style={{ margin: 0 }}>Deposit</h1>
          <div className="small">Send funds then submit your TXID within 15 minutes.</div>
        </div>
        <div className="hstack" style={{ gap: '8px' }}>
          {me ? <div className="badge">Balance: ${Number(me.stats.totalBalance || 0).toFixed(4)}</div> : null}
          <button className="btn btnSecondary" onClick={() => router.push('/records')}>Records</button>
        </div>
      </div>

      {loading ? <div className="card">Loading…</div> : null}
      {error ? <div className="card error">{error}</div> : null}

      <div className="card" style={{ marginTop: 16 }}>
        <div className="badge" style={{ marginBottom: 12 }}>
          Time left: {formatRemaining(remainingMs)}
        </div>

        <div className="formRow">
          <label className="label">Network</label>
          <select className="input" value={network} onChange={(e) => setNetwork(e.target.value)}>
            <option value="TRC20">TRC20</option>
            <option value="BEP20">BEP20</option>
          </select>
        </div>

        <div className="formRow">
          <label className="label">Earnify deposit address (destination)</label>
          <input className="input" value={earnifyAddress} readOnly />
          <div className="small" style={{ marginTop: 8 }}>
            <button
              type="button"
              className="btn btnSecondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(earnifyAddress);
                  setCopied(true);
                  setAmount(''); // Clear amount field
                  setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
                } catch {
                  // ignore
                }
              }}
            >
              {copied ? 'Copied!' : 'Copy address'}
            </button>
          </div>
        </div>

        <div className="formRow">
          <label className="label">Your wallet address</label>
          <input className="input" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} />
        </div>

        <div className="formRow">
          <label className="label">Amount (USD)</label>
          <input className="input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>

        <div className="formRow">
          <label className="label">Binance TXID / Transaction Hash</label>
          <input className="input" value={txid} onChange={(e) => setTxid(e.target.value)} placeholder="Paste TXID here" />
        </div>

        <div className="hstack">
          <button
            className="btn"
            onClick={createDeposit}
            disabled={depositExpired || !txid.trim() || submitting}
          >
            {showSpinner && <div className="spinner"></div>}
            {submitting ? 'Confirming…' : 'Confirm Deposit'}
          </button>
          <button className="btn btnSecondary" onClick={() => router.push('/wallet')}>Back to Wallet</button>
        </div>

        {depositExpired ? (
          <div className="small" style={{ marginTop: 10, color: '#ffd0d0' }}>
            Deposit session expired. Please refresh the page to start a new 15 minute window.
          </div>
        ) : null}

        <div className="small" style={{ marginTop: 10 }}>
          Deposits start as pending and must be approved by admin to credit balance.
        </div>
      </div>
    </Layout>
  );
}
