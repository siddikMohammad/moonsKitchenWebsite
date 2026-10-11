// Sends a notification email through Brevo. Failures are logged, never
// thrown — an email problem must not lose a customer's order.

async function sendMail({ to, subject, html }) {
  const apiKey = process.env.BREVO_API_KEY;
  const sender = process.env.BREVO_SENDER_EMAIL;
  if (!apiKey || !sender || !to || !to.length) return;
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json", "api-key": apiKey },
      body: JSON.stringify({
        sender: { name: "Moon's Kitchen", email: sender },
        to: to.map((email) => ({ email })),
        subject,
        htmlContent: html,
      }),
    });
    if (!res.ok) console.error("mail: Brevo returned", res.status, (await res.text()).slice(0, 200));
  } catch (err) {
    console.error("mail: failed:", err.message);
  }
}

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
}

module.exports = { sendMail, escapeHtml };
