import nodemailer from 'nodemailer';

export function getMailer() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  const secure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

export async function sendAdminDepositEmail({
  transaction,
  user,
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  const transporter = getMailer();
  if (!transporter || !adminEmail || !from) return;

  const subject = `Earnify: Deposit verification required ($${transaction.amount} ${transaction.network})`;

  const text = [
    'A new deposit request was created and needs verification.',
    '',
    `User: ${user.email} (${user._id})`,
    `Amount: $${transaction.amount} ${transaction.currency}`,
    `Network: ${transaction.network}`,
    `Address: ${transaction.walletAddress}`,
    `TXID: ${transaction.txid || ''}`,
    `Status: ${transaction.status}`,
    `Transaction ID: ${transaction._id}`,
    '',
    'To approve: open Admin panel and mark this transaction as completed (Approved).',
  ].join('\n');

  await transporter.sendMail({
    from,
    to: adminEmail,
    subject,
    text,
  });
}

export async function sendAdminWithdrawEmail({
  transaction,
  user,
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  const transporter = getMailer();
  if (!transporter || !adminEmail || !from) return;

  const subject = `Earnify: Withdraw request ($${transaction.amount} ${transaction.network})`;

  const text = [
    'A new withdrawal request was created and needs processing.',
    '',
    `User: ${user.email} (${user._id})`,
    `Amount: $${transaction.amount} ${transaction.currency}`,
    `Network: ${transaction.network}`,
    `Address: ${transaction.walletAddress}`,
    `Status: ${transaction.status}`,
    `Transaction ID: ${transaction._id}`,
    '',
    'After sending payment, open Admin panel and mark this transaction as completed (Approved).',
  ].join('\n');

  await transporter.sendMail({
    from,
    to: adminEmail,
    subject,
    text,
  });
}
