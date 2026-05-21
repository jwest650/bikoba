export const DOCS_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Bikoba Marketplace API</title>
<style>
  :root {
    --bg: #ffffff;
    --bg-soft: #f7f8fa;
    --bg-code: #0f172a;
    --fg: #0f172a;
    --fg-muted: #64748b;
    --border: #e4e7ec;
    --border-strong: #cdd2da;
    --accent: #4f46e5;
    --accent-soft: #eef2ff;
    --post: #1d4ed8;
    --post-bg: #dbeafe;
    --get: #15803d;
    --get-bg: #dcfce7;
    --delete: #b91c1c;
    --delete-bg: #fee2e2;
    --shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06);
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: var(--bg);
    color: var(--fg);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 15px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  code, pre, .mono {
    font-family: ui-monospace, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 13px;
  }

  .layout {
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr);
    min-height: 100vh;
  }

  /* Sidebar */
  .sidebar {
    position: sticky;
    top: 0;
    align-self: start;
    height: 100vh;
    overflow-y: auto;
    background: var(--bg-soft);
    border-right: 1px solid var(--border);
    padding: 28px 20px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 28px;
    font-weight: 600;
    font-size: 15px;
    letter-spacing: -0.01em;
  }
  .brand .logo {
    width: 28px;
    height: 28px;
    border-radius: 7px;
    background: var(--accent);
    color: white;
    display: grid;
    place-items: center;
    font-weight: 700;
    font-size: 14px;
  }
  .sidebar nav { display: flex; flex-direction: column; gap: 2px; }
  .sidebar nav a {
    color: var(--fg-muted);
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 14px;
    transition: background 0.12s ease, color 0.12s ease;
  }
  .sidebar nav a:hover {
    background: white;
    color: var(--fg);
    text-decoration: none;
  }
  .sidebar nav a.primary {
    font-weight: 600;
    color: var(--fg);
  }
  .nav-group {
    margin: 18px 0 6px;
    padding: 0 10px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #94a3b8;
  }

  /* Active link styling — overview is the default view */
  body:not(:has(:target)) .sidebar a[href="#overview-page"],
  body:has(#overview-page:target) .sidebar a[href="#overview-page"],
  body:has(#auth-page:target) .sidebar a[href="#auth-page"],
  body:has(#auth-page :target) .sidebar a[href="#auth-page"],
  body:has(#stores-page:target) .sidebar a[href="#stores-page"],
  body:has(#stores-page :target) .sidebar a[href="#stores-page"],
  body:has(#categories-page:target) .sidebar a[href="#categories-page"],
  body:has(#categories-page :target) .sidebar a[href="#categories-page"],
  body:has(#products-page:target) .sidebar a[href="#products-page"],
  body:has(#products-page :target) .sidebar a[href="#products-page"],
  body:has(#media-page:target) .sidebar a[href="#media-page"],
  body:has(#media-page :target) .sidebar a[href="#media-page"],
  body:has(#seller-applications-page:target) .sidebar a[href="#seller-applications-page"],
  body:has(#seller-applications-page :target) .sidebar a[href="#seller-applications-page"],
  body:has(#sms-page:target) .sidebar a[href="#sms-page"],
  body:has(#sms-page :target) .sidebar a[href="#sms-page"],
  body:has(#orders-page:target) .sidebar a[href="#orders-page"],
  body:has(#orders-page :target) .sidebar a[href="#orders-page"],
  body:has(#payments-page:target) .sidebar a[href="#payments-page"],
  body:has(#payments-page :target) .sidebar a[href="#payments-page"] {
    background: white;
    color: var(--fg);
    font-weight: 600;
    box-shadow: inset 0 0 0 1px var(--border);
  }

  /* Main column */
  main {
    padding: 56px 64px 96px;
    max-width: 880px;
  }

  /* Page routing — show only the targeted page (or overview by default) */
  .page { display: none; }
  .page:target,
  .page:has(:target) { display: block; }
  body:not(:has(:target)) #overview-page { display: block; }

  .hero {
    margin-bottom: 48px;
    padding-bottom: 28px;
    border-bottom: 1px solid var(--border);
  }
  .hero .eyebrow {
    color: var(--accent);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-bottom: 10px;
  }
  h1 {
    font-size: 36px;
    line-height: 1.15;
    letter-spacing: -0.02em;
    margin: 0 0 12px;
    font-weight: 700;
  }
  .hero p {
    font-size: 17px;
    color: var(--fg-muted);
    margin: 0;
    max-width: 640px;
  }
  h2 {
    font-size: 22px;
    margin: 56px 0 16px;
    letter-spacing: -0.01em;
    font-weight: 650;
  }
  h2:first-of-type { margin-top: 0; }
  h3 {
    font-size: 11px;
    margin: 22px 0 8px;
    color: var(--fg-muted);
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
  p { margin: 0 0 14px; }
  ul { padding-left: 22px; margin: 0 0 14px; }
  li { margin-bottom: 4px; }

  /* Module grid (overview) */
  .modules {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    margin: 14px 0 24px;
  }
  .module {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 18px 20px;
    background: white;
    box-shadow: var(--shadow);
  }
  .module .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .module h4 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.005em;
  }
  .module p { color: var(--fg-muted); margin: 0; font-size: 13.5px; }
  .status {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.06em;
    padding: 2px 7px;
    border-radius: 999px;
    text-transform: uppercase;
  }
  .status.shipped { background: #dcfce7; color: #15803d; }
  .status.planned { background: var(--bg-soft); color: var(--fg-muted); border: 1px solid var(--border); }

  /* Cards / endpoints */
  .endpoint {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 22px 24px;
    margin-bottom: 20px;
    background: white;
    box-shadow: var(--shadow);
  }
  .endpoint header {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 6px;
  }
  .method {
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    padding: 3px 8px;
    border-radius: 5px;
    text-transform: uppercase;
  }
  .method.post { background: var(--post-bg); color: var(--post); }
  .method.get { background: var(--get-bg); color: var(--get); }
  .method.delete { background: var(--delete-bg); color: var(--delete); }
  .path {
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 14px;
    font-weight: 600;
    color: var(--fg);
  }
  .auth-pill {
    margin-left: auto;
    font-size: 12px;
    padding: 3px 9px;
    border-radius: 999px;
    background: var(--bg-soft);
    color: var(--fg-muted);
    border: 1px solid var(--border);
  }
  .auth-pill.required { background: var(--accent-soft); color: var(--accent); border-color: transparent; }
  .endpoint p.desc { color: var(--fg-muted); margin: 0 0 14px; }

  /* Code */
  pre {
    background: var(--bg-code);
    color: #e2e8f0;
    border-radius: 8px;
    padding: 14px 16px;
    overflow-x: auto;
    margin: 0 0 12px;
    line-height: 1.55;
  }
  pre .k { color: #c4b5fd; }
  pre .s { color: #86efac; }
  pre .n { color: #fbbf24; }
  pre .c { color: #64748b; font-style: italic; }
  code:not(pre code) {
    background: var(--bg-soft);
    border: 1px solid var(--border);
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 12.5px;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 20px;
    font-size: 14px;
  }
  th, td {
    text-align: left;
    padding: 10px 12px;
    border-bottom: 1px solid var(--border);
  }
  th {
    font-weight: 600;
    color: var(--fg-muted);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: var(--bg-soft);
  }
  tr:last-child td { border-bottom: none; }

  /* Role chips */
  .role {
    display: inline-block;
    font-family: ui-monospace, monospace;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 4px;
    margin-right: 4px;
  }
  .role.buyer { background: #fef3c7; color: #92400e; }
  .role.seller { background: #cffafe; color: #155e75; }
  .role.admin { background: #fce7f3; color: #9d174d; }

  /* Callout */
  .callout {
    border-left: 3px solid var(--accent);
    background: var(--accent-soft);
    border-radius: 0 8px 8px 0;
    padding: 12px 16px;
    margin: 14px 0 20px;
    font-size: 14px;
    color: #312e81;
  }

  /* Button-link */
  .btn-link {
    display: inline-block;
    background: var(--accent);
    color: white;
    padding: 10px 18px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    margin-top: 4px;
  }
  .btn-link:hover { text-decoration: none; background: #4338ca; color: white; }

  .footer {
    margin-top: 80px;
    padding-top: 24px;
    border-top: 1px solid var(--border);
    color: var(--fg-muted);
    font-size: 13px;
  }

  @media (max-width: 900px) {
    .layout { grid-template-columns: 1fr; }
    .sidebar { position: static; height: auto; border-right: none; border-bottom: 1px solid var(--border); }
    main { padding: 32px 24px 64px; }
    h1 { font-size: 28px; }
    .modules { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
<div class="layout">
  <aside class="sidebar">
    <div class="brand"><span class="logo">B</span><span>Bikoba</span></div>
    <nav>
      <a class="primary" href="#overview-page">Overview</a>
      <a class="primary" href="#auth-page">Auth</a>
      <a class="primary" href="#sms-page">SMS &amp; OTP</a>
      <a class="primary" href="#seller-applications-page">Seller applications</a>
      <a class="primary" href="#stores-page">Stores</a>
      <a class="primary" href="#categories-page">Categories</a>
      <a class="primary" href="#products-page">Products</a>
      <a class="primary" href="#orders-page">Orders</a>
      <a class="primary" href="#payments-page">Payments</a>
      <a class="primary" href="#media-page">Media</a>

      <div class="nav-group">Auth · Guide</div>
      <a href="#setup">Setup</a>
      <a href="#flow">Auth flow</a>
      <a href="#email-verification">Email verification</a>
      <a href="#errors">Errors</a>

      <div class="nav-group">Auth · Endpoints</div>
      <a href="#register">POST /auth/register</a>
      <a href="#login">POST /auth/login</a>
      <a href="#refresh">POST /auth/refresh</a>
      <a href="#logout">POST /auth/logout</a>
      <a href="#logout-all">POST /auth/logout-all</a>
      <a href="#me">POST /auth/me</a>
      <a href="#verify-email">GET /auth/verify-email</a>
      <a href="#resend-verification">POST /auth/resend-verification</a>
      <a href="#change-password">POST /auth/password</a>
      <a href="#role-gated">Role-gated examples</a>

      <div class="nav-group">SMS &amp; OTP · Endpoints</div>
      <a href="#sms-set-phone">POST /users/me/phone</a>
      <a href="#otp-send">POST /auth/otp/send</a>
      <a href="#otp-verify">POST /auth/otp/verify</a>

      <div class="nav-group">Seller applications · Endpoints</div>
      <a href="#sa-submit">POST /seller-applications</a>
      <a href="#sa-me">GET /seller-applications/me</a>
      <a href="#sa-cancel">POST /seller-applications/me/cancel</a>
      <a href="#sa-admin-list">GET /admin/seller-applications</a>
      <a href="#sa-admin-get">GET /admin/seller-applications/:id</a>
      <a href="#sa-admin-approve">POST /admin/seller-applications/:id/approve</a>
      <a href="#sa-admin-reject">POST /admin/seller-applications/:id/reject</a>

      <div class="nav-group">Stores · Endpoints</div>
      <a href="#stores-create">POST /stores</a>
      <a href="#stores-list">GET /stores</a>
      <a href="#stores-me">GET /stores/me</a>
      <a href="#stores-by-slug">GET /stores/:slug</a>
      <a href="#stores-products">GET /stores/:slug/products</a>
      <a href="#stores-update">PATCH /stores/:id</a>
      <a href="#stores-delete">DELETE /stores/:id</a>

      <div class="nav-group">Categories · Endpoints</div>
      <a href="#categories-create">POST /categories</a>
      <a href="#categories-list">GET /categories</a>
      <a href="#categories-by-slug">GET /categories/:slug</a>

      <div class="nav-group">Products · Endpoints</div>
      <a href="#products-create">POST /products</a>
      <a href="#products-list">GET /products</a>
      <a href="#products-get">GET /products/:id</a>
      <a href="#products-update">PATCH /products/:id</a>
      <a href="#products-delete">DELETE /products/:id</a>

      <div class="nav-group">Orders · Endpoints</div>
      <a href="#orders-create">POST /orders</a>
      <a href="#orders-mine">GET /orders/me</a>
      <a href="#orders-for-store">GET /orders/store/:storeId</a>
      <a href="#orders-get">GET /orders/:id</a>
      <a href="#orders-ship">POST /orders/:id/ship</a>
      <a href="#orders-ofd">POST /orders/:id/out-for-delivery</a>
      <a href="#orders-deliver">POST /orders/:id/deliver</a>
      <a href="#orders-cancel">POST /orders/:id/cancel</a>

      <div class="nav-group">Payments · Endpoints</div>
      <a href="#payments-init">POST /payments/init</a>
      <a href="#payments-verify">GET /payments/verify</a>
      <a href="#payments-webhook">POST /payments/webhook/:provider</a>
      <a href="#payments-refund">POST /payments/:id/refund</a>
      <a href="#reconcile-list">GET /admin/reconciliations</a>
      <a href="#reconcile-get">GET /admin/reconciliations/:id</a>
      <a href="#reconcile-run">POST /admin/reconciliations/run</a>

      <div class="nav-group">Media · Endpoints</div>
      <a href="#media-upload">POST /media/images</a>
    </nav>
  </aside>

  <main>
    <!-- ──────────── OVERVIEW PAGE (default) ──────────── -->
    <article class="page" id="overview-page">
      <header class="hero">
        <div class="eyebrow">Marketplace</div>
        <h1>Bikoba</h1>
        <p>An online marketplace where buyers shop, sellers list and fulfil orders, and admins keep the platform healthy.</p>
      </header>

      <section>
        <h2>What is Bikoba?</h2>
        <p>
          Bikoba is the server behind the Bikoba marketplace. It will eventually run everything a marketplace
          needs — accounts, listings, search, cart and checkout, orders, payouts to sellers, and platform moderation —
          behind a single typed API.
        </p>
        <p>
          The codebase is built on <strong>NestJS 11</strong>, <strong>Prisma 6</strong>, and <strong>PostgreSQL</strong>.
          Authentication is the first module shipped and gates every other surface; the rest are wired in module-by-module.
        </p>
      </section>

      <section>
        <h2>Who uses it</h2>
        <table>
          <thead><tr><th>Role</th><th>What they do</th></tr></thead>
          <tbody>
            <tr>
              <td><span class="role buyer">BUYER</span></td>
              <td>Browses listings, places orders, manages their own profile and order history.</td>
            </tr>
            <tr>
              <td><span class="role seller">SELLER</span></td>
              <td>Creates and maintains listings, fulfils orders, receives payouts.</td>
            </tr>
            <tr>
              <td><span class="role admin">ADMIN</span></td>
              <td>Moderates accounts and listings, resolves disputes, operates the platform.</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>Modules</h2>
        <div class="modules">
          <div class="module">
            <div class="top"><h4>Auth</h4><span class="status shipped">Shipped</span></div>
            <p>Register, login, JWT access + rotating refresh tokens, per-device sessions, email verification, role-based gating.</p>
          </div>
          <div class="module">
            <div class="top"><h4>Categories</h4><span class="status shipped">Shipped</span></div>
            <p>Hierarchical product categories with parent/child nesting, slugs, featured flags, and ordering. Admin-managed, readable by every authenticated role.</p>
          </div>
          <div class="module">
            <div class="top"><h4>SMS &amp; OTP</h4><span class="status shipped">Shipped</span></div>
            <p>Africa's Talking integration. Phone verification, KYC + password-change transactional SMS. Falls back to console logging when AT creds aren't set.</p>
          </div>
          <div class="module">
            <div class="top"><h4>Seller applications</h4><span class="status shipped">Shipped</span></div>
            <p>BUYER submits Ghana Card + selfie. ADMIN approves or rejects with a reason. On approval the user's role flips to SELLER, unlocking store creation.</p>
          </div>
          <div class="module">
            <div class="top"><h4>Stores</h4><span class="status shipped">Shipped</span></div>
            <p>Seller storefronts: a user can own multiple stores, each with their own slug, logo, banner, and product catalog. Creating a store requires SELLER or ADMIN role.</p>
          </div>
          <div class="module">
            <div class="top"><h4>Products</h4><span class="status shipped">Shipped</span></div>
            <p>Products belong to a store. Create, update, delete, list with filters. Store owners manage their own; admins manage any; everyone can read.</p>
          </div>
          <div class="module">
            <div class="top"><h4>Media</h4><span class="status shipped">Shipped</span></div>
            <p>Image uploads via multipart form. Streams to Cloudflare R2, returns a public CDN URL ready to drop into store logos, banners, or product image arrays.</p>
          </div>
          <div class="module">
            <div class="top"><h4>Redis cache</h4><span class="status shipped">Shipped</span></div>
            <p>Transparent read-cache for categories and products. Cache-aside via <code>RedisService.wrap</code>; mutations invalidate by namespace. Falls back to the DB if Redis is unreachable.</p>
          </div>
          <div class="module">
            <div class="top"><h4>Cart &amp; Checkout</h4><span class="status planned">Planned</span></div>
            <p>Buyer carts, address management, order creation and checkout flow.</p>
          </div>
          <div class="module">
            <div class="top"><h4>Orders &amp; Fulfilment</h4><span class="status shipped">Shipped</span></div>
            <p>One order = one store. Status flow CONFIRMED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED, plus CANCELLED. Item snapshots keep history stable. SMS triggers on placed / shipped / out-for-delivery.</p>
          </div>
          <div class="module">
            <div class="top"><h4>Payments</h4><span class="status shipped">Shipped</span></div>
            <p>Hosted-redirect checkout via Paystack and Flutterwave. Card / MTN MoMo / Vodafone Cash / AirtelTigo Money / bank transfer / USSD. Webhooks + idempotent verify; orders flip from PENDING_PAYMENT to CONFIRMED on success.</p>
          </div>
          <div class="module">
            <div class="top"><h4>Moderation</h4><span class="status planned">Planned</span></div>
            <p>Admin tools for reviewing accounts, listings, and disputes.</p>
          </div>
        </div>
      </section>

      <section>
        <h2>Get started</h2>
        <p>Authentication is the foundation — every other module assumes a valid bearer token. Start with the auth guide.</p>
        <p><a class="btn-link" href="#auth-page">Read the Auth documentation →</a></p>
      </section>

      <div class="footer">
        Bikoba marketplace — NestJS 11, Prisma 6, PostgreSQL, Passport-JWT.
      </div>
    </article>

    <!-- ──────────── AUTH PAGE ──────────── -->
    <article class="page" id="auth-page">
      <header class="hero">
        <div class="eyebrow">Auth · API Reference</div>
        <h1>Authentication</h1>
        <p>JWT access tokens, rotating refresh tokens stored as per-device sessions, email verification, and role-based gating. Every non-public route requires a valid bearer token.</p>
      </header>

      <section>
        <h2>How it works</h2>
        <p>
          Bikoba issues short-lived <strong>access tokens</strong> (default 15 minutes) and longer-lived
          <strong>refresh tokens</strong> (default 7 days). Refresh tokens are bound to a server-side
          <code>Session</code> row so they can be revoked per device; each refresh rotates the token
          and re-issues a new access token.
        </p>
        <ul>
          <li>Passwords are hashed with bcrypt.</li>
          <li>Refresh tokens are stored only as hashes — raw tokens never leave the issuing response.</li>
          <li>Detected refresh-token reuse revokes <em>every</em> active session for that user.</li>
          <li>Account activation is re-checked on every request, so disabling a user takes effect immediately.</li>
          <li>Email verification is decoupled from login — users can sign in but are blocked from sensitive actions until verified.</li>
        </ul>
      </section>

      <section id="setup">
        <h2>Setup</h2>
        <h3>1. Environment</h3>
        <p>Copy <code>.env.example</code> to <code>.env</code> and fill in real values.</p>
<pre><span class="c"># .env</span>
<span class="k">DATABASE_URL</span>=<span class="s">"postgresql://user:password@localhost:5432/bikoba?schema=public"</span>
<span class="k">JWT_ACCESS_SECRET</span>=<span class="s">"&lt;long random string&gt;"</span>
<span class="k">JWT_ACCESS_TTL</span>=<span class="s">15m</span>
<span class="k">JWT_REFRESH_SECRET</span>=<span class="s">"&lt;different long random string&gt;"</span>
<span class="k">JWT_REFRESH_TTL</span>=<span class="s">7d</span>
<span class="k">BCRYPT_SALT_ROUNDS</span>=<span class="n">12</span>
<span class="k">APP_URL</span>=<span class="s">http://localhost:3000</span>
<span class="c"># SMTP — leave SMTP_HOST blank in dev to log links to the console</span>
<span class="k">SMTP_HOST</span>=
<span class="k">SMTP_PORT</span>=<span class="n">587</span>
<span class="k">SMTP_USER</span>=
<span class="k">SMTP_PASS</span>=
<span class="k">SMTP_FROM</span>=<span class="s">"Bikoba &lt;no-reply@bikoba.local&gt;"</span>
<span class="c"># Redis — used for read-caching categories &amp; products. Optional; if unreachable the app falls back to the DB.</span>
<span class="k">REDIS_URL</span>=<span class="s">redis://localhost:6379</span></pre>

        <h3>2. Migrate the database</h3>
<pre>yarn prisma migrate dev --name init</pre>

        <h3>3. Run the server</h3>
<pre>yarn start:dev</pre>

        <div class="callout">
          Admin accounts cannot self-register. Seed one by inserting a user with <code>role: 'ADMIN'</code>
          directly, or promote an existing user via SQL or a Prisma script.
        </div>
      </section>

      <section id="flow">
        <h2>Auth flow</h2>
        <ol>
          <li><strong>Register or log in.</strong> The server returns an access token, a refresh token, and the user.</li>
          <li><strong>Call protected endpoints</strong> with <code>Authorization: Bearer &lt;accessToken&gt;</code>.</li>
          <li><strong>When the access token expires</strong>, POST the refresh token to <code>/auth/refresh</code>. The server validates, rotates the refresh token, and returns new tokens.</li>
          <li><strong>Logout</strong> revokes that one session. <strong>Logout-all</strong> revokes every active session for the user.</li>
        </ol>
      </section>

      <section id="email-verification">
        <h2>Email verification</h2>
        <p>
          On register, the server issues a one-time token (32 random bytes, SHA-256 hashed in the database, 24h expiry)
          and emails a link of the form <code>${'$'}{APP_URL}/auth/verify-email?token=…</code>. Clicking the link
          flips <code>user.isEmailVerified</code> to <code>true</code> and consumes the token.
        </p>
        <p>
          Login still works for unverified users, but routes decorated with <code>@RequireVerified()</code> +
          <code>EmailVerifiedGuard</code> return <code>403</code> until they verify.
        </p>
        <div class="callout">
          In dev with no SMTP configured, the verification link is logged to the server console — copy it
          into your browser to complete the flow without setting up a real SMTP provider.
        </div>
      </section>

      <section id="errors">
        <h2>Errors</h2>
        <table>
          <thead><tr><th>Status</th><th>When</th></tr></thead>
          <tbody>
            <tr><td><code>400</code></td><td>Validation failed on the request body, or expired/invalid verification token</td></tr>
            <tr><td><code>401</code></td><td>Missing / invalid / expired access or refresh token, or wrong password</td></tr>
            <tr><td><code>403</code></td><td>Authenticated, but the user's role isn't allowed or their email isn't verified</td></tr>
            <tr><td><code>404</code></td><td>Verification link is invalid or already used</td></tr>
            <tr><td><code>409</code></td><td>Email already registered</td></tr>
          </tbody>
        </table>
      </section>

      <h2>Endpoints</h2>

      <article class="endpoint" id="register">
        <header>
          <span class="method post">POST</span>
          <span class="path">/auth/register</span>
          <span class="auth-pill">Public</span>
        </header>
        <p class="desc">Create a new BUYER or SELLER account, send a verification email, and return an initial token pair.</p>
        <h3>Request</h3>
<pre>{
  <span class="k">"email"</span>: <span class="s">"jane@example.com"</span>,
  <span class="k">"password"</span>: <span class="s">"correct horse battery"</span>,
  <span class="k">"fullName"</span>: <span class="s">"Jane Doe"</span>,
  <span class="k">"role"</span>: <span class="s">"SELLER"</span>          <span class="c">// optional, defaults to BUYER. ADMIN rejected.</span>
}</pre>
        <h3>Response 201</h3>
<pre>{
  <span class="k">"user"</span>: { <span class="k">"id"</span>: <span class="s">"…"</span>, <span class="k">"email"</span>: <span class="s">"jane@example.com"</span>, <span class="k">"role"</span>: <span class="s">"SELLER"</span>, <span class="k">"isEmailVerified"</span>: <span class="k">false</span> },
  <span class="k">"tokens"</span>: {
    <span class="k">"accessToken"</span>: <span class="s">"eyJhbGciOi…"</span>,
    <span class="k">"refreshToken"</span>: <span class="s">"eyJhbGciOi…"</span>,
    <span class="k">"expiresIn"</span>: <span class="n">900</span>
  }
}</pre>
      </article>

      <article class="endpoint" id="login">
        <header>
          <span class="method post">POST</span>
          <span class="path">/auth/login</span>
          <span class="auth-pill">Public</span>
        </header>
        <p class="desc">Exchange email + password for a new token pair. Opens a new session row. The server computes a coarse <code>browser|os|deviceType</code> fingerprint via <code>ua-parser-js</code> (version-agnostic — browser updates don't trip it). If that fingerprint hasn't been seen on a previous session for this user and they have a verified phone, a <code>new-device-login</code> SMS is queued as a security canary.</p>
        <h3>Request</h3>
<pre>{
  <span class="k">"email"</span>: <span class="s">"jane@example.com"</span>,
  <span class="k">"password"</span>: <span class="s">"correct horse battery"</span>
}</pre>
        <h3>Response 200</h3>
<pre>{
  <span class="k">"user"</span>: { <span class="k">"id"</span>: <span class="s">"…"</span>, <span class="k">"email"</span>: <span class="s">"…"</span>, <span class="k">"role"</span>: <span class="s">"BUYER"</span>, <span class="k">"isEmailVerified"</span>: <span class="k">true</span> },
  <span class="k">"tokens"</span>: { <span class="k">"accessToken"</span>: <span class="s">"…"</span>, <span class="k">"refreshToken"</span>: <span class="s">"…"</span>, <span class="k">"expiresIn"</span>: <span class="n">900</span> }
}</pre>
      </article>

      <article class="endpoint" id="refresh">
        <header>
          <span class="method post">POST</span>
          <span class="path">/auth/refresh</span>
          <span class="auth-pill">Public</span>
        </header>
        <p class="desc">Rotate the refresh token and get a fresh access token. The old refresh token is invalidated.</p>
        <h3>Request</h3>
<pre>{ <span class="k">"refreshToken"</span>: <span class="s">"eyJhbGciOi…"</span> }</pre>
        <h3>Response 200</h3>
<pre>{
  <span class="k">"accessToken"</span>: <span class="s">"…"</span>,
  <span class="k">"refreshToken"</span>: <span class="s">"…"</span>,
  <span class="k">"expiresIn"</span>: <span class="n">900</span>
}</pre>
        <div class="callout">
          If the presented refresh token doesn't match the stored hash for that session, the server treats it as
          reuse and revokes <em>every</em> active session for the user. Force the user to log in again on all devices.
        </div>
      </article>

      <article class="endpoint" id="logout">
        <header>
          <span class="method post">POST</span>
          <span class="path">/auth/logout</span>
          <span class="auth-pill required">Refresh token</span>
        </header>
        <p class="desc">Revoke the session bound to the supplied refresh token. Returns 204.</p>
        <h3>Request</h3>
<pre>{ <span class="k">"refreshToken"</span>: <span class="s">"eyJhbGciOi…"</span> }</pre>
      </article>

      <article class="endpoint" id="logout-all">
        <header>
          <span class="method post">POST</span>
          <span class="path">/auth/logout-all</span>
          <span class="auth-pill required">Bearer token</span>
        </header>
        <p class="desc">Revoke every active session for the current user. Returns 204.</p>
        <h3>Request headers</h3>
<pre>Authorization: Bearer &lt;accessToken&gt;</pre>
      </article>

      <article class="endpoint" id="me">
        <header>
          <span class="method post">POST</span>
          <span class="path">/auth/me</span>
          <span class="auth-pill required">Bearer token</span>
        </header>
        <p class="desc">Return the authenticated user's id, email, role, and verification status.</p>
        <h3>Response 200</h3>
<pre>{ <span class="k">"id"</span>: <span class="s">"…"</span>, <span class="k">"email"</span>: <span class="s">"…"</span>, <span class="k">"role"</span>: <span class="s">"BUYER"</span>, <span class="k">"isEmailVerified"</span>: <span class="k">true</span> }</pre>
      </article>

      <article class="endpoint" id="verify-email">
        <header>
          <span class="method get">GET</span>
          <span class="path">/auth/verify-email?token=…</span>
          <span class="auth-pill">Public</span>
        </header>
        <p class="desc">
          Endpoint behind the email verification link. Validates the token, marks the user verified,
          and returns a small HTML confirmation page. Designed to be opened directly from email clients.
        </p>
      </article>

      <article class="endpoint" id="resend-verification">
        <header>
          <span class="method post">POST</span>
          <span class="path">/auth/resend-verification</span>
          <span class="auth-pill required">Bearer token</span>
        </header>
        <p class="desc">
          Issue a fresh verification email for the authenticated user. Any previous unused tokens are invalidated.
          Returns <code>202</code> with <code>{ "ok": true }</code>, or <code>400</code> if the email is already verified.
        </p>
      </article>

      <article class="endpoint" id="change-password">
        <header>
          <span class="method post">POST</span>
          <span class="path">/auth/password</span>
          <span class="auth-pill required">Bearer token</span>
        </header>
        <p class="desc">
          Change the caller's password. Verifies the current password, rehashes the new one, <strong>revokes every active session</strong>, and issues a fresh token pair for the calling device. If the user has a verified phone, queues a <code>password-changed</code> SMS as a security canary.
        </p>
        <h3>Request</h3>
<pre>{
  <span class="k">"currentPassword"</span>: <span class="s">"correct horse battery"</span>,
  <span class="k">"newPassword"</span>: <span class="s">"a much longer phrase"</span>
}</pre>
        <h3>Response 200</h3>
<pre>{
  <span class="k">"accessToken"</span>: <span class="s">"…"</span>,
  <span class="k">"refreshToken"</span>: <span class="s">"…"</span>,
  <span class="k">"expiresIn"</span>: <span class="n">900</span>
}</pre>
        <h3>Errors</h3>
        <ul>
          <li><code>400</code> — validation failed (length, complexity)</li>
          <li><code>401</code> — current password incorrect</li>
          <li><code>409</code> — new password matches current</li>
        </ul>
      </article>

      <section id="role-gated">
        <h2>Role-gated examples</h2>
        <p>How <code>@Roles(...)</code> + <code>RolesGuard</code> compose with the global JWT guard. The global <code>JwtAuthGuard</code> protects every route unless you mark it <code>@Public()</code>.</p>

        <article class="endpoint">
          <header>
            <span class="method post">POST</span>
            <span class="path">/auth/seller/ping</span>
            <span class="auth-pill required"><span class="role seller">SELLER</span> or <span class="role admin">ADMIN</span></span>
          </header>
          <p class="desc">Returns <code>{ "ok": true }</code> when the caller's role is SELLER or ADMIN.</p>
        </article>

        <article class="endpoint">
          <header>
            <span class="method post">POST</span>
            <span class="path">/auth/admin/ping</span>
            <span class="auth-pill required"><span class="role admin">ADMIN</span> only</span>
          </header>
          <p class="desc">Returns <code>{ "ok": true }</code> when the caller's role is ADMIN.</p>
        </article>

        <article class="endpoint">
          <header>
            <span class="method post">POST</span>
            <span class="path">/auth/verified/ping</span>
            <span class="auth-pill required">Verified email</span>
          </header>
          <p class="desc">Returns <code>{ "ok": true }</code> only when <code>isEmailVerified</code> is true. 403 otherwise.</p>
        </article>

        <h3>Wiring your own route</h3>
<pre><span class="k">@UseGuards</span>(RolesGuard, EmailVerifiedGuard)
<span class="k">@Roles</span>(Role.SELLER, Role.ADMIN)
<span class="k">@RequireVerified</span>()
<span class="k">@Post</span>(<span class="s">'listings'</span>)
createListing(<span class="k">@CurrentUser</span>() user: AuthenticatedUser, <span class="k">@Body</span>() dto: CreateListingDto) {
  <span class="k">return</span> <span class="k">this</span>.listings.create(user.id, dto);
}</pre>
      </section>

      <div class="footer">
        Bikoba marketplace — NestJS 11, Prisma 6, Passport-JWT.
      </div>
    </article>

    <!-- ──────────── SELLER APPLICATIONS PAGE ──────────── -->
    <article class="page" id="seller-applications-page">
      <header class="hero">
        <div class="eyebrow">Seller applications · API Reference</div>
        <h1>Seller applications</h1>
        <p>Gate to becoming a seller. A BUYER submits Ghana Card details + a selfie; an ADMIN approves or rejects. On approval the user's role flips to SELLER, unlocking store creation and product listing.</p>
      </header>

      <section>
        <h2>Flow</h2>
        <ol>
          <li>BUYER uploads <strong>Ghana Card front</strong>, <strong>Ghana Card back</strong>, and a <strong>selfie</strong> via <code>POST /media/images</code> — three calls, three URLs.</li>
          <li>BUYER posts the URLs plus <code>fullName</code>, <code>phone</code>, and <code>ghanaCardNumber</code> to <code>POST /seller-applications</code>.</li>
          <li>Application status starts as <code>PENDING</code>. The applicant can <strong>cancel</strong> at any time before review, then re-submit.</li>
          <li>An ADMIN reviews via <code>GET /admin/seller-applications?status=PENDING</code>, opens the detail, and calls <code>approve</code> or <code>reject</code>.</li>
          <li>On <strong>approve</strong>: status → <code>APPROVED</code>, user role → <code>SELLER</code>, <code>approvedAt = now</code>, <code>expiresAt = now + KYC_VERIFICATION_TTL_MONTHS</code>. An approval email is queued. User can now <code>POST /stores</code>.</li>
          <li>On <strong>reject</strong>: status → <code>REJECTED</code> with a <code>rejectionReason</code>. A rejection email is queued. User may re-submit.</li>
          <li>Approaching <code>expiresAt</code>: a separate daily sweep at <strong>03:30 UTC</strong> walks the configured <code>KYC_REMINDER_OFFSET_DAYS</code> (default <code>30, 7, 1</code>) and queues a reminder email when the seller crosses each milestone. <code>lastReminderAt</code> dedupes so each milestone fires once.</li>
          <li>At <code>expiresAt</code>: the expiry sweep at <strong>03:00 UTC</strong> flips the row to <code>EXPIRED</code>, demotes the user back to <code>BUYER</code>, deactivates their stores, and emails them. Re-submission restarts the cycle.</li>
        </ol>
        <div class="callout">
          The user's existing access token still reports their old role until they call <code>POST /auth/refresh</code>. <code>JwtStrategy</code> re-reads the role on every request, so the next request after refresh sees the new one.
        </div>
      </section>

      <section>
        <h2>States</h2>
        <table>
          <thead><tr><th>Status</th><th>Meaning</th><th>Resubmit allowed?</th></tr></thead>
          <tbody>
            <tr><td><code>PENDING</code></td><td>Awaiting admin review</td><td>No — cancel first</td></tr>
            <tr><td><code>APPROVED</code></td><td>Active SELLER. Valid until <code>expiresAt</code></td><td>No — already approved</td></tr>
            <tr><td><code>REJECTED</code></td><td>Admin rejected with a <code>rejectionReason</code></td><td>Yes</td></tr>
            <tr><td><code>CANCELLED</code></td><td>Applicant withdrew before review</td><td>Yes</td></tr>
            <tr><td><code>EXPIRED</code></td><td>Approval lapsed; user demoted, stores deactivated</td><td>Yes</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>Email notifications</h2>
        <p>Every state transition that affects the seller enqueues an email through the <code>email</code> BullMQ queue. In dev without SMTP configured, the body is printed to the server console (see the Mail module).</p>
        <table>
          <thead><tr><th>Trigger</th><th>Email subject</th></tr></thead>
          <tbody>
            <tr><td>Admin approves application</td><td>Your Bikoba seller application is approved</td></tr>
            <tr><td>Admin rejects application</td><td>Your Bikoba seller application needs changes</td></tr>
            <tr><td>Approaching expiry (per offset)</td><td>Your Bikoba verification expires in N days</td></tr>
            <tr><td>Verification expired</td><td>Your Bikoba verification has expired</td></tr>
          </tbody>
        </table>
        <p>Reminder offsets come from <code>KYC_REMINDER_OFFSET_DAYS</code> (default <code>30,7,1</code>). Each milestone sends once per approval cycle, deduplicated via <code>lastReminderAt</code>. Resetting via re-submit or re-approval clears the dedupe state.</p>
      </section>

      <h2>Endpoints — applicant</h2>

      <article class="endpoint" id="sa-submit">
        <header>
          <span class="method post">POST</span>
          <span class="path">/seller-applications</span>
          <span class="auth-pill required">Verified BUYER</span>
        </header>
        <p class="desc">Submit (or re-submit after rejection) the application. Returns the application row.</p>
        <h3>Request</h3>
<pre>{
  <span class="k">"fullName"</span>: <span class="s">"Jane Doe"</span>,
  <span class="k">"phone"</span>: <span class="s">"+233241234567"</span>,
  <span class="k">"ghanaCardNumber"</span>: <span class="s">"GHA-123456789-0"</span>,
  <span class="k">"ghanaCardFront"</span>: <span class="s">"https://cdn.bikoba.com/images/2026/05/abc.jpg"</span>,
  <span class="k">"ghanaCardBack"</span>:  <span class="s">"https://cdn.bikoba.com/images/2026/05/def.jpg"</span>,
  <span class="k">"selfieUrl"</span>:      <span class="s">"https://cdn.bikoba.com/images/2026/05/ghi.jpg"</span>
}</pre>
        <h3>Response 201</h3>
<pre>{
  <span class="k">"id"</span>: <span class="s">"…"</span>,
  <span class="k">"userId"</span>: <span class="s">"…"</span>,
  <span class="k">"fullName"</span>: <span class="s">"Jane Doe"</span>,
  <span class="k">"phone"</span>: <span class="s">"+233241234567"</span>,
  <span class="k">"ghanaCardNumber"</span>: <span class="s">"GHA-123456789-0"</span>,
  <span class="k">"ghanaCardFront"</span>: <span class="s">"…"</span>,
  <span class="k">"ghanaCardBack"</span>:  <span class="s">"…"</span>,
  <span class="k">"selfieUrl"</span>:      <span class="s">"…"</span>,
  <span class="k">"status"</span>: <span class="s">"PENDING"</span>,
  <span class="k">"rejectionReason"</span>: <span class="k">null</span>,
  <span class="k">"reviewedById"</span>: <span class="k">null</span>,
  <span class="k">"reviewedAt"</span>: <span class="k">null</span>,
  <span class="k">"createdAt"</span>: <span class="s">"…"</span>,
  <span class="k">"updatedAt"</span>: <span class="s">"…"</span>
}</pre>
        <h3>Errors</h3>
        <ul>
          <li><code>400</code> — validation failed (e.g. Ghana Card format), or caller's role is already SELLER / ADMIN</li>
          <li><code>403</code> — email not verified</li>
          <li><code>409</code> — application already <code>PENDING</code> or <code>APPROVED</code></li>
        </ul>
      </article>

      <article class="endpoint" id="sa-me">
        <header>
          <span class="method get">GET</span>
          <span class="path">/seller-applications/me</span>
          <span class="auth-pill required">Bearer token</span>
        </header>
        <p class="desc">Return the caller's application, or <code>null</code> if they haven't submitted one.</p>
      </article>

      <article class="endpoint" id="sa-cancel">
        <header>
          <span class="method post">POST</span>
          <span class="path">/seller-applications/me/cancel</span>
          <span class="auth-pill required">Bearer token</span>
        </header>
        <p class="desc">Withdraw a <code>PENDING</code> application. Status moves to <code>CANCELLED</code>; the applicant may re-submit later via <code>POST /seller-applications</code>.</p>
        <h3>Errors</h3>
        <ul>
          <li><code>404</code> — caller has no application</li>
          <li><code>409</code> — application is not in <code>PENDING</code> state (e.g. already approved, rejected, cancelled, or expired)</li>
        </ul>
      </article>

      <h2>Endpoints — admin</h2>

      <article class="endpoint" id="sa-admin-list">
        <header>
          <span class="method get">GET</span>
          <span class="path">/admin/seller-applications</span>
          <span class="auth-pill required"><span class="role admin">ADMIN</span> only</span>
        </header>
        <p class="desc">Paginated list with applicant + reviewer joins. Filter by <code>status</code>.</p>
        <h3>Query parameters</h3>
        <table>
          <thead><tr><th>Name</th><th>Type</th><th>Default</th><th>Notes</th></tr></thead>
          <tbody>
            <tr><td><code>status</code></td><td>enum</td><td>—</td><td><code>PENDING</code> / <code>APPROVED</code> / <code>REJECTED</code></td></tr>
            <tr><td><code>take</code></td><td>int</td><td>20</td><td>Clamped to 1–100</td></tr>
            <tr><td><code>skip</code></td><td>int</td><td>0</td><td>Offset pagination</td></tr>
          </tbody>
        </table>
      </article>

      <article class="endpoint" id="sa-admin-get">
        <header>
          <span class="method get">GET</span>
          <span class="path">/admin/seller-applications/:id</span>
          <span class="auth-pill required"><span class="role admin">ADMIN</span> only</span>
        </header>
        <p class="desc">Fetch a single application by id, with applicant and reviewer summary.</p>
      </article>

      <article class="endpoint" id="sa-admin-approve">
        <header>
          <span class="method post">POST</span>
          <span class="path">/admin/seller-applications/:id/approve</span>
          <span class="auth-pill required"><span class="role admin">ADMIN</span> only</span>
        </header>
        <p class="desc">Approve a <code>PENDING</code> application. Inside one transaction: sets <code>status = APPROVED</code>, <code>reviewedById</code> / <code>reviewedAt</code>, <code>approvedAt = now</code>, <code>expiresAt = now + KYC_VERIFICATION_TTL_MONTHS</code> (default 12 months), and updates the applicant's <code>role</code> to <code>SELLER</code>. An approval email is queued.</p>
        <h3>Errors</h3>
        <ul>
          <li><code>403</code> — caller isn't ADMIN</li>
          <li><code>404</code> — application not found</li>
          <li><code>409</code> — application is not in <code>PENDING</code> state</li>
        </ul>
      </article>

      <article class="endpoint" id="sa-admin-reject">
        <header>
          <span class="method post">POST</span>
          <span class="path">/admin/seller-applications/:id/reject</span>
          <span class="auth-pill required"><span class="role admin">ADMIN</span> only</span>
        </header>
        <p class="desc">Reject a <code>PENDING</code> application with a reason. A rejection email is queued with the reason in the body. The user may resubmit afterwards.</p>
        <h3>Request</h3>
<pre>{ <span class="k">"reason"</span>: <span class="s">"Selfie did not match Ghana Card photo."</span> }</pre>
        <h3>Errors</h3>
        <ul>
          <li><code>400</code> — reason missing or too short</li>
          <li><code>403</code> — caller isn't ADMIN</li>
          <li><code>404</code> — application not found</li>
          <li><code>409</code> — application is not in <code>PENDING</code> state</li>
        </ul>
      </article>

      <div class="footer">
        Bikoba marketplace — Seller applications module.
      </div>
    </article>

    <!-- ──────────── SMS & OTP PAGE ──────────── -->
    <article class="page" id="sms-page">
      <header class="hero">
        <div class="eyebrow">SMS &amp; OTP · API Reference</div>
        <h1>SMS &amp; OTP</h1>
        <p>Africa's Talking integration for phone verification (the primary OTP use case today) and transactional SMS for KYC + password-change events. When AT credentials aren't configured, messages are logged to the server console — the rest of the system works unchanged.</p>
      </header>

      <section>
        <h2>How it works</h2>
        <ul>
          <li><strong>OTP send</strong> is synchronous with graceful fallback: the API issues the code, persists the hash (SHA-256 of <code>phone:code</code>), then tries the SMS provider. If AT or Redis is down, the token still exists and the caller gets a clean response — they can retry with <code>POST /auth/otp/send</code>.</li>
          <li><strong>Transactional SMS</strong> (KYC events, password-changed) goes through the <code>sms</code> BullMQ queue. Producers enqueue and return; the worker delivers asynchronously with retries.</li>
          <li>SMS for KYC events only fires when the user has a <strong>verified phone</strong> (<code>phoneVerifiedAt</code> is non-null). Emails always send; SMS layers on top.</li>
          <li>Phone numbers are validated as <strong>E.164</strong> (e.g. <code>+233241234567</code>). The DB has a unique constraint, so the same number can't be linked to two accounts.</li>
          <li>Rate limit: <code>OTP_RATE_LIMIT_PER_HOUR</code> sends per phone (default 3), tracked in Redis. Fails open if Redis is unreachable.</li>
          <li>Attempt limit: <code>OTP_MAX_ATTEMPTS</code> failed verifies (default 5) invalidates the token — caller must request a new code.</li>
        </ul>
        <div class="callout">
          In dev with <code>AT_USERNAME</code> blank, the OTP code appears in the server log (<code>[dev] would send SMS to=...</code>). Copy it into the verify endpoint to complete the flow without setting up AT.
        </div>
      </section>

      <section>
        <h2>Configuration</h2>
<pre><span class="c"># .env</span>
<span class="k">AT_USERNAME</span>=<span class="s">sandbox</span>             <span class="c"># or your production username</span>
<span class="k">AT_API_KEY</span>=<span class="s">&lt;from AT dashboard&gt;</span>
<span class="k">AT_SENDER_ID</span>=                <span class="c"># optional; blank uses shared short code</span>
<span class="k">AT_ENVIRONMENT</span>=<span class="s">sandbox</span>          <span class="c"># sandbox | production</span>
<span class="k">OTP_TTL_MINUTES</span>=<span class="n">5</span>
<span class="k">OTP_MAX_ATTEMPTS</span>=<span class="n">5</span>
<span class="k">OTP_RATE_LIMIT_PER_HOUR</span>=<span class="n">3</span></pre>
      </section>

      <h2>Endpoints</h2>

      <article class="endpoint" id="sms-set-phone">
        <header>
          <span class="method post">POST</span>
          <span class="path">/users/me/phone</span>
          <span class="auth-pill required">Verified email</span>
        </header>
        <p class="desc">Set or change the authenticated user's phone number. The number is stored unverified; a <code>PHONE_VERIFY</code> OTP is sent immediately. Returns <code>202</code>.</p>
        <h3>Request</h3>
<pre>{ <span class="k">"phoneNumber"</span>: <span class="s">"+233241234567"</span> }</pre>
        <h3>Errors</h3>
        <ul>
          <li><code>400</code> — phone not E.164</li>
          <li><code>403</code> — email not verified</li>
          <li><code>409</code> — phone already linked to another account</li>
          <li><code>429</code> — OTP rate limit exceeded for this phone</li>
        </ul>
      </article>

      <article class="endpoint" id="otp-send">
        <header>
          <span class="method post">POST</span>
          <span class="path">/auth/otp/send</span>
          <span class="auth-pill">Public</span>
        </header>
        <p class="desc">Issue a fresh 6-digit code to a phone for a given purpose. Previous unused codes for the same (phone, purpose) are invalidated. Returns <code>202</code>.</p>
        <h3>Request</h3>
<pre>{
  <span class="k">"phoneNumber"</span>: <span class="s">"+233241234567"</span>,
  <span class="k">"purpose"</span>: <span class="s">"PHONE_VERIFY"</span>   <span class="c">// PHONE_VERIFY | LOGIN | PASSWORD_RESET | CHECKOUT_CONFIRM</span>
}</pre>
        <h3>Errors</h3>
        <ul>
          <li><code>400</code> — validation failed</li>
          <li><code>429</code> — rate limit exceeded (max <code>OTP_RATE_LIMIT_PER_HOUR</code> per phone per hour)</li>
        </ul>
      </article>

      <article class="endpoint" id="otp-verify">
        <header>
          <span class="method post">POST</span>
          <span class="path">/auth/otp/verify</span>
          <span class="auth-pill">Public</span>
        </header>
        <p class="desc">Verify a 6-digit code. On the <code>PHONE_VERIFY</code> purpose, also sets <code>phoneVerifiedAt</code> on the linked user. Returns <code>200</code> with <code>{ "ok": true }</code>.</p>
        <h3>Request</h3>
<pre>{
  <span class="k">"phoneNumber"</span>: <span class="s">"+233241234567"</span>,
  <span class="k">"code"</span>: <span class="s">"123456"</span>,
  <span class="k">"purpose"</span>: <span class="s">"PHONE_VERIFY"</span>
}</pre>
        <h3>Errors</h3>
        <ul>
          <li><code>400</code> — no active code for this phone/purpose</li>
          <li><code>401</code> — code expired, incorrect, or attempts exhausted</li>
        </ul>
      </article>

      <section>
        <h2>What triggers an SMS automatically</h2>
        <table>
          <thead><tr><th>Event</th><th>Job name</th><th>Condition</th></tr></thead>
          <tbody>
            <tr><td>Phone number set / changed</td><td>(direct send)</td><td>Always</td></tr>
            <tr><td>KYC application approved</td><td><code>kyc-approved</code></td><td>User has verified phone</td></tr>
            <tr><td>KYC application rejected</td><td><code>kyc-rejected</code></td><td>User has verified phone</td></tr>
            <tr><td>KYC approaching expiry</td><td><code>kyc-expiry-reminder</code></td><td>User has verified phone</td></tr>
            <tr><td>KYC expired</td><td><code>kyc-expired</code></td><td>User has verified phone</td></tr>
            <tr><td>Password changed</td><td><code>password-changed</code></td><td>User has verified phone</td></tr>
            <tr><td>Login from an unrecognised device</td><td><code>new-device-login</code></td><td>User has verified phone; <code>userAgent</code> not seen before</td></tr>
            <tr><td>New order placed</td><td><code>order-placed</code></td><td>Store owner has verified phone</td></tr>
            <tr><td>Order shipped</td><td><code>order-shipped</code></td><td>Buyer has verified phone</td></tr>
            <tr><td>Order out for delivery</td><td><code>order-out-for-delivery</code></td><td>Buyer has verified phone</td></tr>
          </tbody>
        </table>
      </section>

      <div class="footer">
        Bikoba marketplace — SMS &amp; OTP module.
      </div>
    </article>

    <!-- ──────────── STORES PAGE ──────────── -->
    <article class="page" id="stores-page">
      <header class="hero">
        <div class="eyebrow">Stores · API Reference</div>
        <h1>Stores</h1>
        <p>Sellers run their own storefronts. A user can own multiple stores; each store has a public slug, a logo and banner, and a catalog of products. Creating a store auto-promotes a BUYER to SELLER.</p>
      </header>

      <section>
        <h2>How stores work</h2>
        <ul>
          <li>A <code>Store</code> belongs to exactly one user (<code>ownerId</code>). One user can own many stores.</li>
          <li>Products belong to a store — not directly to a user. The seller is derived as <code>store.owner</code>.</li>
          <li>Slugs are globally unique and used for public URLs: <code>/stores/:slug</code>.</li>
          <li>Deleting a store cascades to every product in it (<code>onDelete: Cascade</code>). If that's risky for your data, switch the relation to <code>Restrict</code> at the schema level.</li>
        </ul>
      </section>

      <section>
        <h2>Ownership &amp; auto-promotion</h2>
        <p>
          <code>POST /stores</code> is open to <strong>any verified user</strong>. If a BUYER creates their first store,
          the same transaction promotes them to SELLER — so they get a storefront <em>and</em> permission to manage
          products in one round-trip.
        </p>
        <div class="callout">
          The promotion is committed atomically with the store row, but it doesn't retroactively update existing access
          tokens. Clients should call <code>POST /auth/refresh</code> after creating their first store to pick up the
          new role. The next access token will reflect <code>role: "SELLER"</code>.
        </div>
        <p>
          Mutations (<code>PATCH</code>, <code>DELETE</code>) require either the store's owner or an ADMIN. Trying to
          touch someone else's store returns <code>403</code>.
        </p>
      </section>

      <h2>Endpoints</h2>

      <article class="endpoint" id="stores-create">
        <header>
          <span class="method post">POST</span>
          <span class="path">/stores</span>
          <span class="auth-pill required">Verified email</span>
        </header>
        <p class="desc">Create a new store owned by the caller. Promotes BUYER → SELLER on first store.</p>
        <h3>Request</h3>
<pre>{
  <span class="k">"name"</span>: <span class="s">"Sunset Bakery"</span>,
  <span class="k">"slug"</span>: <span class="s">"sunset-bakery"</span>,
  <span class="k">"description"</span>: <span class="s">"Fresh sourdough, daily."</span>,
  <span class="k">"logoUrl"</span>: <span class="s">"https://cdn.example.com/sunset/logo.png"</span>,    <span class="c">// optional</span>
  <span class="k">"bannerUrl"</span>: <span class="s">"https://cdn.example.com/sunset/banner.jpg"</span>, <span class="c">// optional</span>
  <span class="k">"isActive"</span>: <span class="k">true</span>,                               <span class="c">// optional, defaults true</span>
  <span class="k">"currency"</span>: <span class="s">"GHS"</span>                                <span class="c">// optional 3-letter ISO; defaults USD. IMMUTABLE after creation.</span>
}</pre>
        <div class="callout">
          The store's <code>currency</code> is set once on creation and cannot be changed via <code>PATCH /stores/:id</code>. Every product in the store and every order placed against it is denominated in this currency.
        </div>
        <h3>Response 201</h3>
<pre>{
  <span class="k">"id"</span>: <span class="s">"…"</span>,
  <span class="k">"name"</span>: <span class="s">"Sunset Bakery"</span>,
  <span class="k">"slug"</span>: <span class="s">"sunset-bakery"</span>,
  <span class="k">"description"</span>: <span class="s">"Fresh sourdough, daily."</span>,
  <span class="k">"logoUrl"</span>: <span class="s">"…"</span>,
  <span class="k">"bannerUrl"</span>: <span class="s">"…"</span>,
  <span class="k">"isActive"</span>: <span class="k">true</span>,
  <span class="k">"ownerId"</span>: <span class="s">"…"</span>,
  <span class="k">"createdAt"</span>: <span class="s">"2026-05-14T…Z"</span>,
  <span class="k">"updatedAt"</span>: <span class="s">"2026-05-14T…Z"</span>
}</pre>
        <h3>Errors</h3>
        <ul>
          <li><code>400</code> — validation failed (e.g. malformed slug, invalid URL)</li>
          <li><code>403</code> — caller's email isn't verified</li>
          <li><code>409</code> — slug already taken</li>
        </ul>
      </article>

      <article class="endpoint" id="stores-list">
        <header>
          <span class="method get">GET</span>
          <span class="path">/stores</span>
          <span class="auth-pill required">Bearer token</span>
        </header>
        <p class="desc">Paginated list of stores. Filter by owner, active flag, or free-text search across name + description.</p>
        <h3>Query parameters</h3>
        <table>
          <thead><tr><th>Name</th><th>Type</th><th>Default</th><th>Notes</th></tr></thead>
          <tbody>
            <tr><td><code>ownerId</code></td><td>UUID</td><td>—</td><td>Only stores owned by this user</td></tr>
            <tr><td><code>isActive</code></td><td>boolean</td><td>—</td><td><code>true</code> / <code>false</code></td></tr>
            <tr><td><code>search</code></td><td>string</td><td>—</td><td>Case-insensitive match on name or description</td></tr>
            <tr><td><code>take</code></td><td>int</td><td>20</td><td>Clamped to 1–100</td></tr>
            <tr><td><code>skip</code></td><td>int</td><td>0</td><td>For offset pagination</td></tr>
          </tbody>
        </table>
        <h3>Response 200</h3>
<pre>[
  { <span class="k">"id"</span>: <span class="s">"…"</span>, <span class="k">"name"</span>: <span class="s">"Sunset Bakery"</span>, <span class="k">"slug"</span>: <span class="s">"sunset-bakery"</span>, <span class="k">"isActive"</span>: <span class="k">true</span>, <span class="k">"ownerId"</span>: <span class="s">"…"</span>, … },
  { <span class="k">"id"</span>: <span class="s">"…"</span>, <span class="k">"name"</span>: <span class="s">"Ridge Coffee"</span>,    <span class="k">"slug"</span>: <span class="s">"ridge-coffee"</span>,    <span class="k">"isActive"</span>: <span class="k">true</span>, <span class="k">"ownerId"</span>: <span class="s">"…"</span>, … }
]</pre>
      </article>

      <article class="endpoint" id="stores-me">
        <header>
          <span class="method get">GET</span>
          <span class="path">/stores/me</span>
          <span class="auth-pill required">Bearer token</span>
        </header>
        <p class="desc">Every store owned by the current user, newest first. Returns an empty array if they haven't created one yet.</p>
      </article>

      <article class="endpoint" id="stores-by-slug">
        <header>
          <span class="method get">GET</span>
          <span class="path">/stores/:slug</span>
          <span class="auth-pill required">Bearer token</span>
        </header>
        <p class="desc">Fetch a single store by its public slug. Includes the owner's id + display name and a count of products.</p>
        <h3>Response 200</h3>
<pre>{
  <span class="k">"id"</span>: <span class="s">"…"</span>,
  <span class="k">"name"</span>: <span class="s">"Sunset Bakery"</span>,
  <span class="k">"slug"</span>: <span class="s">"sunset-bakery"</span>,
  <span class="k">"description"</span>: <span class="s">"…"</span>,
  <span class="k">"logoUrl"</span>: <span class="s">"…"</span>,
  <span class="k">"bannerUrl"</span>: <span class="s">"…"</span>,
  <span class="k">"isActive"</span>: <span class="k">true</span>,
  <span class="k">"owner"</span>: { <span class="k">"id"</span>: <span class="s">"…"</span>, <span class="k">"fullName"</span>: <span class="s">"Jane Doe"</span> },
  <span class="k">"_count"</span>: { <span class="k">"products"</span>: <span class="n">42</span> }
}</pre>
        <h3>Errors</h3>
        <ul><li><code>404</code> — no store with that slug</li></ul>
      </article>

      <article class="endpoint" id="stores-products">
        <header>
          <span class="method get">GET</span>
          <span class="path">/stores/:slug/products</span>
          <span class="auth-pill required">Bearer token</span>
        </header>
        <p class="desc">Active products belonging to a store, newest first. Each item includes its category. Inactive products are filtered out.</p>
        <h3>Response 200</h3>
<pre>[
  {
    <span class="k">"id"</span>: <span class="s">"…"</span>,
    <span class="k">"name"</span>: <span class="s">"Whole-grain loaf"</span>,
    <span class="k">"slug"</span>: <span class="s">"whole-grain-loaf"</span>,
    <span class="k">"price"</span>: <span class="s">"7.50"</span>,
    <span class="k">"currency"</span>: <span class="s">"USD"</span>,
    <span class="k">"stock"</span>: <span class="n">12</span>,
    <span class="k">"category"</span>: { <span class="k">"id"</span>: <span class="s">"…"</span>, <span class="k">"name"</span>: <span class="s">"Bread"</span>, <span class="k">"slug"</span>: <span class="s">"bread"</span> },
    …
  }
]</pre>
      </article>

      <article class="endpoint" id="stores-update">
        <header>
          <span class="method post">PATCH</span>
          <span class="path">/stores/:id</span>
          <span class="auth-pill required">Owner or <span class="role admin">ADMIN</span></span>
        </header>
        <p class="desc">Partially update a store. All fields are optional; send only what changes.</p>
        <h3>Request</h3>
<pre>{
  <span class="k">"name"</span>: <span class="s">"Sunset Bakery &amp; Café"</span>,
  <span class="k">"description"</span>: <span class="s">"Now serving brunch."</span>,
  <span class="k">"isActive"</span>: <span class="k">false</span>
}</pre>
        <h3>Errors</h3>
        <ul>
          <li><code>400</code> — validation failed</li>
          <li><code>403</code> — caller doesn't own this store and isn't ADMIN</li>
          <li><code>404</code> — store not found</li>
          <li><code>409</code> — new slug collides with an existing store</li>
        </ul>
      </article>

      <article class="endpoint" id="stores-delete">
        <header>
          <span class="method delete">DELETE</span>
          <span class="path">/stores/:id</span>
          <span class="auth-pill required">Owner or <span class="role admin">ADMIN</span></span>
        </header>
        <p class="desc">
          Permanently delete the store. <strong>Cascades</strong>: every product in this store is also deleted.
          Returns 204.
        </p>
        <div class="callout">
          There's no undo. If you want a softer deletion model (set <code>isActive: false</code> instead of removing the row),
          use <code>PATCH /stores/:id</code>.
        </div>
      </article>

      <div class="footer">
        Bikoba marketplace — Stores module.
      </div>
    </article>

    <!-- ──────────── CATEGORIES PAGE ──────────── -->
    <article class="page" id="categories-page">
      <header class="hero">
        <div class="eyebrow">Categories · API Reference</div>
        <h1>Categories</h1>
        <p>Hierarchical product categories with parent/child nesting. Admins create and curate them; buyers, sellers, and admins can read them.</p>
      </header>

      <section>
        <h2>How it works</h2>
        <p>
          Categories form a tree. A category with no <code>parentId</code> is a top-level root at <code>level: 0</code>.
          Setting <code>parentId</code> nests it under another category and the server auto-computes <code>level</code>
          as <code>parent.level + 1</code>. Deleting a parent cascades to its children.
        </p>
        <ul>
          <li><code>slug</code> is unique and used in URLs — lowercase letters, digits, and hyphens.</li>
          <li><code>sortOrder</code> + <code>name</code> control list ordering (ascending).</li>
          <li><code>isFeatured</code> and <code>isActive</code> are filterable via query params on the list endpoint.</li>
          <li>Deleting a parent cascades to all descendants via <code>ON DELETE CASCADE</code>.</li>
        </ul>
      </section>

      <section>
        <h2>Access</h2>
        <table>
          <thead><tr><th>Role</th><th>Create</th><th>Read</th></tr></thead>
          <tbody>
            <tr><td><span class="role buyer">BUYER</span></td><td>—</td><td>✓</td></tr>
            <tr><td><span class="role seller">SELLER</span></td><td>—</td><td>✓</td></tr>
            <tr><td><span class="role admin">ADMIN</span></td><td>✓</td><td>✓</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>Caching</h2>
        <p>Read endpoints are cached in Redis with the namespace <code>cat:</code>.</p>
        <ul>
          <li><code>GET /categories</code> → key <code>cat:list:p=…:a=…:f=…</code> · TTL <strong>10 min</strong></li>
          <li><code>GET /categories/:slug</code> → key <code>cat:slug:&lt;slug&gt;</code> · TTL <strong>30 min</strong></li>
          <li><code>POST /categories</code> → invalidates the entire <code>cat:*</code> namespace.</li>
        </ul>
      </section>

      <h2>Endpoints</h2>

      <article class="endpoint" id="categories-create">
        <header>
          <span class="method post">POST</span>
          <span class="path">/categories</span>
          <span class="auth-pill required"><span class="role admin">ADMIN</span> only</span>
        </header>
        <p class="desc">Create a top-level or nested category. <code>level</code> is computed from the parent — clients do not supply it.</p>
        <h3>Request headers</h3>
<pre>Authorization: Bearer &lt;accessToken&gt;</pre>
        <h3>Request body</h3>
<pre>{
  <span class="k">"name"</span>: <span class="s">"Phones"</span>,
  <span class="k">"slug"</span>: <span class="s">"phones"</span>,
  <span class="k">"description"</span>: <span class="s">"Smartphones and accessories"</span>,           <span class="c">// optional</span>
  <span class="k">"imageUrl"</span>: <span class="s">"https://cdn.example.com/phones.jpg"</span>,    <span class="c">// optional</span>
  <span class="k">"icon"</span>: <span class="s">"smartphone"</span>,                              <span class="c">// optional</span>
  <span class="k">"parentId"</span>: <span class="s">"&lt;uuid of parent&gt;"</span>,                  <span class="c">// optional — omit for a root category</span>
  <span class="k">"isFeatured"</span>: <span class="k">false</span>,                              <span class="c">// optional, default false</span>
  <span class="k">"isActive"</span>: <span class="k">true</span>,                                <span class="c">// optional, default true</span>
  <span class="k">"sortOrder"</span>: <span class="n">0</span>,                                  <span class="c">// optional, default 0</span>
  <span class="k">"metaTitle"</span>: <span class="s">"Phones | Bikoba"</span>,                  <span class="c">// optional</span>
  <span class="k">"metaDescription"</span>: <span class="s">"Shop phones on Bikoba"</span>      <span class="c">// optional</span>
}</pre>
        <h3>Response 201</h3>
<pre>{
  <span class="k">"id"</span>: <span class="s">"…"</span>,
  <span class="k">"name"</span>: <span class="s">"Phones"</span>,
  <span class="k">"slug"</span>: <span class="s">"phones"</span>,
  <span class="k">"parentId"</span>: <span class="s">"…"</span>,
  <span class="k">"level"</span>: <span class="n">1</span>,
  <span class="k">"isFeatured"</span>: <span class="k">false</span>,
  <span class="k">"isActive"</span>: <span class="k">true</span>,
  <span class="k">"sortOrder"</span>: <span class="n">0</span>,
  <span class="k">"createdAt"</span>: <span class="s">"…"</span>,
  <span class="k">"updatedAt"</span>: <span class="s">"…"</span>
}</pre>
        <div class="callout">
          Returns <code>400</code> when <code>parentId</code> doesn't exist, <code>409</code> when <code>slug</code> is already taken,
          and <code>403</code> when the caller isn't an admin.
        </div>
      </article>

      <article class="endpoint" id="categories-list">
        <header>
          <span class="method get">GET</span>
          <span class="path">/categories</span>
          <span class="auth-pill required"><span class="role buyer">BUYER</span> <span class="role seller">SELLER</span> <span class="role admin">ADMIN</span></span>
        </header>
        <p class="desc">List categories ordered by <code>sortOrder</code> ascending, then <code>name</code>. Supports filtering by parent, active state, and featured flag.</p>
        <h3>Query parameters</h3>
        <table>
          <thead><tr><th>Param</th><th>Type</th><th>Effect</th></tr></thead>
          <tbody>
            <tr><td><code>parentId</code></td><td>UUID or <code>null</code></td><td>Only return children of this category. Pass the literal <code>null</code> to get top-level roots.</td></tr>
            <tr><td><code>isActive</code></td><td>boolean</td><td>Filter by <code>isActive</code>.</td></tr>
            <tr><td><code>isFeatured</code></td><td>boolean</td><td>Filter by <code>isFeatured</code>.</td></tr>
          </tbody>
        </table>
        <h3>Example</h3>
<pre>GET /categories?parentId=null&amp;isActive=true</pre>
        <h3>Response 200</h3>
<pre>[
  {
    <span class="k">"id"</span>: <span class="s">"…"</span>,
    <span class="k">"name"</span>: <span class="s">"Electronics"</span>,
    <span class="k">"slug"</span>: <span class="s">"electronics"</span>,
    <span class="k">"parentId"</span>: <span class="k">null</span>,
    <span class="k">"level"</span>: <span class="n">0</span>,
    <span class="k">"isActive"</span>: <span class="k">true</span>,
    <span class="k">"isFeatured"</span>: <span class="k">true</span>,
    <span class="k">"sortOrder"</span>: <span class="n">0</span>
  }
]</pre>
      </article>

      <article class="endpoint" id="categories-by-slug">
        <header>
          <span class="method get">GET</span>
          <span class="path">/categories/:slug</span>
          <span class="auth-pill required"><span class="role buyer">BUYER</span> <span class="role seller">SELLER</span> <span class="role admin">ADMIN</span></span>
        </header>
        <p class="desc">Fetch a single category by its slug, with its direct children inlined.</p>
        <h3>Example</h3>
<pre>GET /categories/electronics</pre>
        <h3>Response 200</h3>
<pre>{
  <span class="k">"id"</span>: <span class="s">"…"</span>,
  <span class="k">"name"</span>: <span class="s">"Electronics"</span>,
  <span class="k">"slug"</span>: <span class="s">"electronics"</span>,
  <span class="k">"parentId"</span>: <span class="k">null</span>,
  <span class="k">"level"</span>: <span class="n">0</span>,
  <span class="k">"children"</span>: [
    { <span class="k">"id"</span>: <span class="s">"…"</span>, <span class="k">"name"</span>: <span class="s">"Phones"</span>, <span class="k">"slug"</span>: <span class="s">"phones"</span>, <span class="k">"level"</span>: <span class="n">1</span> }
  ]
}</pre>
        <div class="callout">Returns <code>404</code> if no category with that slug exists.</div>
      </article>

      <div class="footer">
        Bikoba marketplace — NestJS 11, Prisma 6, Passport-JWT.
      </div>
    </article>

    <!-- ──────────── PRODUCTS PAGE ──────────── -->
    <article class="page" id="products-page">
      <header class="hero">
        <div class="eyebrow">Products · API Reference</div>
        <h1>Products</h1>
        <p>Seller-owned product listings, attached to a category. Sellers create and manage their own; admins can manage any; buyers, sellers, and admins can read.</p>
      </header>

      <section>
        <h2>How it works</h2>
        <p>
          Every product belongs to exactly one <code>Category</code> and is owned by exactly one <code>seller</code>
          (the authenticated user who created it). On write endpoints, <code>sellerId</code> is taken from the bearer
          token — clients can not spoof ownership.
        </p>
        <ul>
          <li><code>price</code> is stored as <code>DECIMAL(12, 2)</code> and serialized as a JSON <strong>string</strong> like <code>"12.99"</code>. Send a number (e.g. <code>19.95</code>) on write, read it back as a string.</li>
          <li><code>currency</code> is a 3-letter ISO code, default <code>"USD"</code>.</li>
          <li><code>slug</code> and <code>sku</code> are unique. Conflicts return <code>409</code>.</li>
          <li><code>images</code> is an array of URLs (max 20).</li>
          <li>Deleting a category is restricted while it has products. Deleting a seller cascades and removes their products.</li>
        </ul>
      </section>

      <section>
        <h2>Access</h2>
        <table>
          <thead><tr><th>Role</th><th>Create</th><th>Read</th><th>Update</th><th>Delete</th></tr></thead>
          <tbody>
            <tr><td><span class="role buyer">BUYER</span></td><td>—</td><td>✓</td><td>—</td><td>—</td></tr>
            <tr><td><span class="role seller">SELLER</span></td><td>✓ owns it</td><td>✓</td><td>✓ if owner</td><td>✓ if owner</td></tr>
            <tr><td><span class="role admin">ADMIN</span></td><td>✓ owns it</td><td>✓</td><td>✓ any</td><td>✓ any</td></tr>
          </tbody>
        </table>
        <div class="callout">
          Role gating is enforced by <code>RolesGuard</code>. Ownership (seller can only mutate their own products) is enforced in <code>ProductsService.requireOwnerOrAdmin</code> — admins bypass the owner check.
        </div>
      </section>

      <section>
        <h2>Caching</h2>
        <p>Read endpoints are cached in Redis with the namespace <code>prod:</code>. TTLs are short because product data (especially <code>stock</code>) changes more often than categories.</p>
        <ul>
          <li><code>GET /products</code> → key <code>prod:list:&lt;hash of query&gt;</code> · TTL <strong>60 sec</strong></li>
          <li><code>GET /products/:id</code> → key <code>prod:id:&lt;id&gt;</code> · TTL <strong>5 min</strong></li>
          <li><code>POST /products</code> → invalidates <code>prod:list:*</code></li>
          <li><code>PATCH /products/:id</code> · <code>DELETE /products/:id</code> → invalidates <code>prod:list:*</code> and <code>prod:id:&lt;id&gt;</code></li>
        </ul>
        <div class="callout">
          Up to 60 s of stale <code>stock</code> on cached list responses. If you ever add reservation-at-checkout, that path should bypass the cache and read straight from the DB.
        </div>
      </section>

      <h2>Endpoints</h2>

      <article class="endpoint" id="products-create">
        <header>
          <span class="method post">POST</span>
          <span class="path">/products</span>
          <span class="auth-pill required"><span class="role seller">SELLER</span> or <span class="role admin">ADMIN</span></span>
        </header>
        <p class="desc">Create a new product. The authenticated user becomes the <code>seller</code>.</p>
        <h3>Request headers</h3>
<pre>Authorization: Bearer &lt;accessToken&gt;</pre>
        <h3>Request body</h3>
<pre>{
  <span class="k">"name"</span>: <span class="s">"iPhone 17 Pro"</span>,
  <span class="k">"slug"</span>: <span class="s">"iphone-17-pro"</span>,
  <span class="k">"description"</span>: <span class="s">"Latest flagship"</span>,
  <span class="k">"price"</span>: <span class="n">1199.00</span>,
  <span class="k">"currency"</span>: <span class="s">"USD"</span>,             <span class="c">// optional — inherits from the store. If sent, must match store currency.</span>
  <span class="k">"sku"</span>: <span class="s">"IP17P-256-BLK"</span>,        <span class="c">// optional, unique</span>
  <span class="k">"stock"</span>: <span class="n">25</span>,                  <span class="c">// optional, default 0</span>
  <span class="k">"images"</span>: [<span class="s">"https://cdn.example.com/iphone-1.jpg"</span>], <span class="c">// optional</span>
  <span class="k">"isActive"</span>: <span class="k">true</span>,            <span class="c">// optional, default true</span>
  <span class="k">"isFeatured"</span>: <span class="k">false</span>,         <span class="c">// optional, default false</span>
  <span class="k">"categoryId"</span>: <span class="s">"&lt;uuid of phones category&gt;"</span>
}</pre>
        <h3>Response 201</h3>
<pre>{
  <span class="k">"id"</span>: <span class="s">"…"</span>,
  <span class="k">"name"</span>: <span class="s">"iPhone 17 Pro"</span>,
  <span class="k">"slug"</span>: <span class="s">"iphone-17-pro"</span>,
  <span class="k">"price"</span>: <span class="s">"1199.00"</span>,
  <span class="k">"currency"</span>: <span class="s">"USD"</span>,
  <span class="k">"stock"</span>: <span class="n">25</span>,
  <span class="k">"images"</span>: [<span class="s">"…"</span>],
  <span class="k">"isActive"</span>: <span class="k">true</span>,
  <span class="k">"categoryId"</span>: <span class="s">"…"</span>,
  <span class="k">"sellerId"</span>: <span class="s">"&lt;authenticated user id&gt;"</span>,
  <span class="k">"createdAt"</span>: <span class="s">"…"</span>,
  <span class="k">"updatedAt"</span>: <span class="s">"…"</span>
}</pre>
        <div class="callout">
          <code>400</code> when <code>categoryId</code> doesn't exist.
          <code>409</code> on slug/sku conflict.
          <code>403</code> when the caller isn't a seller or admin.
        </div>
      </article>

      <article class="endpoint" id="products-list">
        <header>
          <span class="method get">GET</span>
          <span class="path">/products</span>
          <span class="auth-pill required"><span class="role buyer">BUYER</span> <span class="role seller">SELLER</span> <span class="role admin">ADMIN</span></span>
        </header>
        <p class="desc">List products with optional filters and pagination. Ordered by <code>createdAt</code> desc.</p>
        <h3>Query parameters</h3>
        <table>
          <thead><tr><th>Param</th><th>Type</th><th>Effect</th></tr></thead>
          <tbody>
            <tr><td><code>categoryId</code></td><td>UUID</td><td>Filter by category.</td></tr>
            <tr><td><code>sellerId</code></td><td>UUID</td><td>Filter by seller.</td></tr>
            <tr><td><code>isActive</code></td><td>boolean</td><td>Filter by active state.</td></tr>
            <tr><td><code>isFeatured</code></td><td>boolean</td><td>Filter by featured flag.</td></tr>
            <tr><td><code>search</code></td><td>string</td><td>Case-insensitive substring match against name + description.</td></tr>
            <tr><td><code>take</code></td><td>int</td><td>Page size 1–100 (default 20).</td></tr>
            <tr><td><code>skip</code></td><td>int</td><td>Offset for pagination (default 0).</td></tr>
          </tbody>
        </table>
        <h3>Example</h3>
<pre>GET /products?categoryId=…&amp;isActive=true&amp;search=iphone&amp;take=10</pre>
      </article>

      <article class="endpoint" id="products-get">
        <header>
          <span class="method get">GET</span>
          <span class="path">/products/:id</span>
          <span class="auth-pill required"><span class="role buyer">BUYER</span> <span class="role seller">SELLER</span> <span class="role admin">ADMIN</span></span>
        </header>
        <p class="desc">Fetch a single product by id, with its category (id/name/slug) and seller (id/fullName) inlined.</p>
        <h3>Response 200</h3>
<pre>{
  <span class="k">"id"</span>: <span class="s">"…"</span>,
  <span class="k">"name"</span>: <span class="s">"iPhone 17 Pro"</span>,
  <span class="k">"price"</span>: <span class="s">"1199.00"</span>,
  <span class="k">"category"</span>: { <span class="k">"id"</span>: <span class="s">"…"</span>, <span class="k">"name"</span>: <span class="s">"Phones"</span>, <span class="k">"slug"</span>: <span class="s">"phones"</span> },
  <span class="k">"seller"</span>:   { <span class="k">"id"</span>: <span class="s">"…"</span>, <span class="k">"fullName"</span>: <span class="s">"Jane Doe"</span> }
}</pre>
        <div class="callout"><code>404</code> if no product with that id exists.</div>
      </article>

      <article class="endpoint" id="products-update">
        <header>
          <span class="method post">PATCH</span>
          <span class="path">/products/:id</span>
          <span class="auth-pill required"><span class="role seller">SELLER</span> (owner) or <span class="role admin">ADMIN</span></span>
        </header>
        <p class="desc">Partial update — send only the fields you want to change. Sellers can only update products they own; admins can update any.</p>
        <h3>Request body</h3>
<pre>{
  <span class="k">"price"</span>: <span class="n">1099.00</span>,
  <span class="k">"stock"</span>: <span class="n">12</span>,
  <span class="k">"isActive"</span>: <span class="k">false</span>
}</pre>
        <div class="callout">
          <code>403</code> if a seller tries to update a product they don't own.
          <code>404</code> if the product doesn't exist.
          <code>409</code> on slug/sku conflict.
        </div>
      </article>

      <article class="endpoint" id="products-delete">
        <header>
          <span class="method delete">DELETE</span>
          <span class="path">/products/:id</span>
          <span class="auth-pill required"><span class="role seller">SELLER</span> (owner) or <span class="role admin">ADMIN</span></span>
        </header>
        <p class="desc">Hard-delete a product. Returns <code>204</code>. Same ownership rules as update.</p>
      </article>

      <div class="footer">
        Bikoba marketplace — NestJS 11, Prisma 6, Passport-JWT.
      </div>
    </article>

    <!-- ──────────── ORDERS PAGE ──────────── -->
    <article class="page" id="orders-page">
      <header class="hero">
        <div class="eyebrow">Orders · API Reference</div>
        <h1>Orders</h1>
        <p>Buyers place orders against a single store at a time. Each order captures price + name snapshots so the historical record stays stable when products change. Status transitions are seller-only; SMS notifications fire automatically when the recipient has a verified phone.</p>
      </header>

      <section>
        <h2>How it works</h2>
        <ul>
          <li>One order = items from one store. To buy from multiple stores, the client places multiple orders.</li>
          <li>Order rows snapshot the product's <code>name</code>, <code>slug</code>, <code>unitPrice</code>, and <code>currency</code> at the moment of purchase. Later product edits don't rewrite history.</li>
          <li>Currency is the <strong>store's</strong> currency — products in a store all share it, so mixed-currency orders can't happen.</li>
          <li>Status flow: <code>CONFIRMED</code> → <code>SHIPPED</code> → <code>OUT_FOR_DELIVERY</code> → <code>DELIVERED</code>. <code>CANCELLED</code> is reachable only from <code>CONFIRMED</code>.</li>
          <li><strong>Stock is decremented atomically</strong> in the same Prisma <code>$transaction</code> that creates the order. The decrement is guarded by <code>WHERE stock &gt;= quantity</code>; if any item fails the check the entire transaction rolls back with a <code>409</code> citing the out-of-stock product. Concurrent orders for the last unit of a product can't both succeed.</li>
          <li><strong>Cancel restores stock</strong> for every item in the same transactional pattern. Only orders in <code>CONFIRMED</code> are cancellable.</li>
          <li>Payment is handled by the <a href="#payments-page">Payments</a> module — orders start in <code>PENDING_PAYMENT</code> and flip to <code>CONFIRMED</code> only when a Paystack or Flutterwave payment succeeds.</li>
        </ul>
        <div class="callout">
          When a buyer creates an order, the store owner gets <strong>both SMS and email</strong> (<code>order-placed</code> / <code>order-placed-seller</code>). When the seller transitions to <code>SHIPPED</code> or <code>OUT_FOR_DELIVERY</code>, the buyer gets both too. SMS is gated on verified phone; email always sends.
        </div>
      </section>

      <section>
        <h2>States</h2>
        <table>
          <thead><tr><th>Status</th><th>Meaning</th><th>Next transitions</th></tr></thead>
          <tbody>
            <tr><td><code>PENDING_PAYMENT</code></td><td>Order created, stock reserved, waiting for the buyer to complete payment</td><td>→ <code>CONFIRMED</code> (via successful payment), <code>cancel</code></td></tr>
            <tr><td><code>CONFIRMED</code></td><td>Payment confirmed; seller can fulfil</td><td><code>ship</code>, <code>cancel</code></td></tr>
            <tr><td><code>SHIPPED</code></td><td>Seller has dispatched</td><td><code>out-for-delivery</code></td></tr>
            <tr><td><code>OUT_FOR_DELIVERY</code></td><td>Courier has it; arriving today</td><td><code>deliver</code></td></tr>
            <tr><td><code>DELIVERED</code></td><td>Received by buyer</td><td>(terminal)</td></tr>
            <tr><td><code>CANCELLED</code></td><td>Cancelled before shipment (with stock restored)</td><td>(terminal)</td></tr>
          </tbody>
        </table>
        <div class="callout">
          New orders start in <code>PENDING_PAYMENT</code>. They flip to <code>CONFIRMED</code> only when <code>POST /payments/init</code> + a successful PSP callback land — see the Payments page. The <code>order-placed</code> SMS + email fire on that transition, not at order creation.
        </div>
      </section>

      <h2>Endpoints</h2>

      <article class="endpoint" id="orders-create">
        <header>
          <span class="method post">POST</span>
          <span class="path">/orders</span>
          <span class="auth-pill required">Verified email</span>
        </header>
        <p class="desc">Place an order against a single store. Items must all belong to that store and share a currency.</p>
        <h3>Request</h3>
<pre>{
  <span class="k">"storeId"</span>: <span class="s">"…"</span>,
  <span class="k">"items"</span>: [
    { <span class="k">"productId"</span>: <span class="s">"…"</span>, <span class="k">"quantity"</span>: <span class="n">2</span> },
    { <span class="k">"productId"</span>: <span class="s">"…"</span>, <span class="k">"quantity"</span>: <span class="n">1</span> }
  ],
  <span class="k">"shippingAddress"</span>: <span class="s">"12 Liberation Rd, Accra"</span>,
  <span class="k">"notes"</span>: <span class="s">"Leave at the gate"</span>     <span class="c">// optional</span>
}</pre>
        <h3>Response 201</h3>
<pre>{
  <span class="k">"id"</span>: <span class="s">"…"</span>,
  <span class="k">"buyerId"</span>: <span class="s">"…"</span>,
  <span class="k">"storeId"</span>: <span class="s">"…"</span>,
  <span class="k">"status"</span>: <span class="s">"CONFIRMED"</span>,
  <span class="k">"totalAmount"</span>: <span class="s">"42.50"</span>,
  <span class="k">"currency"</span>: <span class="s">"GHS"</span>,
  <span class="k">"shippingAddress"</span>: <span class="s">"…"</span>,
  <span class="k">"items"</span>: [
    { <span class="k">"productName"</span>: <span class="s">"Whole-grain loaf"</span>, <span class="k">"unitPrice"</span>: <span class="s">"7.50"</span>, <span class="k">"quantity"</span>: <span class="n">2</span>, … },
    …
  ],
  <span class="k">"createdAt"</span>: <span class="s">"…"</span>
}</pre>
        <h3>Errors</h3>
        <ul>
          <li><code>400</code> — store inactive, or product missing / inactive / from a different store</li>
          <li><code>403</code> — email not verified</li>
          <li><code>409</code> — insufficient stock for one of the items (transaction rolled back, no row created)</li>
        </ul>
      </article>

      <article class="endpoint" id="orders-mine">
        <header>
          <span class="method get">GET</span>
          <span class="path">/orders/me</span>
          <span class="auth-pill required">Bearer token</span>
        </header>
        <p class="desc">Buyer's own order history. Filter by <code>status</code>; paginate via <code>take</code> / <code>skip</code>.</p>
      </article>

      <article class="endpoint" id="orders-for-store">
        <header>
          <span class="method get">GET</span>
          <span class="path">/orders/store/:storeId</span>
          <span class="auth-pill required">Store owner or <span class="role admin">ADMIN</span></span>
        </header>
        <p class="desc">All orders for a store, including the buyer's id, email, and full name. Used by sellers to manage fulfilment.</p>
      </article>

      <article class="endpoint" id="orders-get">
        <header>
          <span class="method get">GET</span>
          <span class="path">/orders/:id</span>
          <span class="auth-pill required">Buyer, store owner, or <span class="role admin">ADMIN</span></span>
        </header>
        <p class="desc">Full order with items, store summary, and buyer summary.</p>
      </article>

      <article class="endpoint" id="orders-ship">
        <header>
          <span class="method post">POST</span>
          <span class="path">/orders/:id/ship</span>
          <span class="auth-pill required">Store owner or <span class="role admin">ADMIN</span></span>
        </header>
        <p class="desc">Transition <code>CONFIRMED → SHIPPED</code>. Sets <code>shippedAt</code>. Queues an <code>order-shipped</code> SMS to the buyer.</p>
        <h3>Errors</h3>
        <ul>
          <li><code>403</code> — caller doesn't own the store</li>
          <li><code>404</code> — order not found</li>
          <li><code>409</code> — order not in <code>CONFIRMED</code> state</li>
        </ul>
      </article>

      <article class="endpoint" id="orders-ofd">
        <header>
          <span class="method post">POST</span>
          <span class="path">/orders/:id/out-for-delivery</span>
          <span class="auth-pill required">Store owner or <span class="role admin">ADMIN</span></span>
        </header>
        <p class="desc">Transition <code>SHIPPED → OUT_FOR_DELIVERY</code>. Sets <code>outForDeliveryAt</code>. Queues an <code>order-out-for-delivery</code> SMS to the buyer.</p>
      </article>

      <article class="endpoint" id="orders-deliver">
        <header>
          <span class="method post">POST</span>
          <span class="path">/orders/:id/deliver</span>
          <span class="auth-pill required">Store owner or <span class="role admin">ADMIN</span></span>
        </header>
        <p class="desc">Transition <code>OUT_FOR_DELIVERY → DELIVERED</code>. Sets <code>deliveredAt</code>. No SMS sent — delivery confirmation is typically a quieter event.</p>
      </article>

      <article class="endpoint" id="orders-cancel">
        <header>
          <span class="method post">POST</span>
          <span class="path">/orders/:id/cancel</span>
          <span class="auth-pill required">Buyer, store owner, or <span class="role admin">ADMIN</span></span>
        </header>
        <p class="desc">Cancel a <code>CONFIRMED</code> order. Both buyer and seller can initiate; either's cancel is final. Records <code>cancelledAt</code> and optional <code>cancellationReason</code>.</p>
        <h3>Request</h3>
<pre>{ <span class="k">"reason"</span>: <span class="s">"Item out of stock"</span> }   <span class="c">// optional</span>
</pre>
        <h3>Errors</h3>
        <ul>
          <li><code>403</code> — caller is neither the buyer nor the store owner</li>
          <li><code>409</code> — order already shipped, delivered, or cancelled</li>
        </ul>
      </article>

      <div class="footer">
        Bikoba marketplace — Orders module.
      </div>
    </article>

    <!-- ──────────── PAYMENTS PAGE ──────────── -->
    <article class="page" id="payments-page">
      <header class="hero">
        <div class="eyebrow">Payments · API Reference</div>
        <h1>Payments</h1>
        <p>Hosted-redirect checkout via <strong>Paystack</strong> and <strong>Flutterwave</strong>. Both providers surface card / mobile money / bank-transfer / USSD channels, covering MTN MoMo, Vodafone Cash, and AirtelTigo Money for Ghana buyers.</p>
      </header>

      <section>
        <h2>Flow</h2>
        <ol>
          <li>Buyer creates an order with <code>POST /orders</code>. It lands in <code>PENDING_PAYMENT</code> with stock already reserved.</li>
          <li>Buyer calls <code>POST /payments/init</code> with the order id and chosen provider. The server creates a <code>Payment</code> row (status <code>PENDING</code>), asks the PSP for a hosted checkout URL, and returns it.</li>
          <li>Buyer is redirected to the PSP. They choose a channel (card, MTN MoMo, Voda Cash, etc.) and pay.</li>
          <li>PSP redirects them back to <code>${'$'}{PAYMENT_REDIRECT_URL}?reference=…&amp;provider=…</code>. The frontend at that URL calls <code>GET /payments/verify?reference=…</code> to re-sync state.</li>
          <li>In parallel, the PSP fires a webhook to <code>POST /payments/webhook/:provider</code>. We verify the signature, then call the PSP's verify endpoint as the source of truth (webhooks can be replayed; the API can't be spoofed once you have the secret).</li>
          <li>On <code>SUCCESS</code>: the <code>Payment</code> row is finalised, the <code>Order</code> transitions <code>PENDING_PAYMENT → CONFIRMED</code> with <code>paidAt = now</code>, and the seller gets an <code>order-placed</code> SMS + email. The verify endpoint and the webhook handler both feed through the same state machine — re-running for an already-<code>SUCCESS</code> payment is a no-op.</li>
        </ol>
      </section>

      <section>
        <h2>Configuration</h2>
        <p>Each provider degrades independently. With a provider's secret blank, an init request targeting it returns <code>503</code>; the rest of the system works.</p>
<pre><span class="c"># .env</span>
<span class="k">PAYSTACK_SECRET_KEY</span>=<span class="s">sk_test_…</span>
<span class="k">PAYSTACK_PUBLIC_KEY</span>=<span class="s">pk_test_…</span>       <span class="c"># informational; frontend SDK only</span>

<span class="k">FLUTTERWAVE_SECRET_KEY</span>=<span class="s">FLWSECK_TEST-…</span>
<span class="k">FLUTTERWAVE_PUBLIC_KEY</span>=<span class="s">FLWPUBK_TEST-…</span>   <span class="c"># informational</span>
<span class="k">FLUTTERWAVE_WEBHOOK_SECRET</span>=<span class="s">…</span>       <span class="c"># "secret hash" set in the Flutterwave dashboard</span>

<span class="k">PAYMENT_REDIRECT_URL</span>=<span class="s">https://app.bikoba.com/payments/result</span></pre>

        <div class="callout">
          Webhook URLs to register with each PSP: <code>https://api.bikoba.com/payments/webhook/PAYSTACK</code> and <code>.../payments/webhook/FLUTTERWAVE</code>. Both endpoints are <code>@Public()</code> — signature/hash verification gates them, not JWT.
        </div>
      </section>

      <section>
        <h2>Payment states</h2>
        <table>
          <thead><tr><th>Status</th><th>Meaning</th></tr></thead>
          <tbody>
            <tr><td><code>PENDING</code></td><td>Init succeeded; awaiting buyer to complete checkout at PSP</td></tr>
            <tr><td><code>SUCCESS</code></td><td>PSP confirmed; order has been advanced to <code>CONFIRMED</code></td></tr>
            <tr><td><code>FAILED</code></td><td>PSP reported failure (declined, abandoned, cancelled, expired)</td></tr>
            <tr><td><code>ABANDONED</code></td><td>Reserved for future cleanup sweep</td></tr>
            <tr><td><code>REFUNDED</code></td><td>Reserved for the refunds flow (not built yet)</td></tr>
          </tbody>
        </table>
        <p>One <code>Order</code> can have multiple <code>Payment</code> rows — failed attempts stay as audit history; the buyer can retry with the same provider or a different one. Only one row per order will ever be <code>SUCCESS</code>.</p>
      </section>

      <h2>Endpoints</h2>

      <article class="endpoint" id="payments-init">
        <header>
          <span class="method post">POST</span>
          <span class="path">/payments/init</span>
          <span class="auth-pill required">Verified email</span>
        </header>
        <p class="desc">Start a payment for an order. The caller must be the buyer (or ADMIN). Order must be in <code>PENDING_PAYMENT</code>. Returns the PSP's hosted-checkout URL.</p>
        <h3>Request</h3>
<pre>{
  <span class="k">"orderId"</span>: <span class="s">"…"</span>,
  <span class="k">"provider"</span>: <span class="s">"PAYSTACK"</span>    <span class="c">// PAYSTACK | FLUTTERWAVE</span>
}</pre>
        <h3>Response 201</h3>
<pre>{
  <span class="k">"payment"</span>: {
    <span class="k">"id"</span>: <span class="s">"…"</span>,
    <span class="k">"reference"</span>: <span class="s">"pay_abc123…"</span>,
    <span class="k">"provider"</span>: <span class="s">"PAYSTACK"</span>,
    <span class="k">"status"</span>: <span class="s">"PENDING"</span>,
    <span class="k">"amount"</span>: <span class="s">"42.50"</span>,
    <span class="k">"currency"</span>: <span class="s">"GHS"</span>,
    …
  },
  <span class="k">"redirectUrl"</span>: <span class="s">"https://checkout.paystack.com/…"</span>
}</pre>
        <h3>Errors</h3>
        <ul>
          <li><code>400</code> — validation failed</li>
          <li><code>403</code> — caller is neither the buyer nor an ADMIN; or email not verified</li>
          <li><code>404</code> — order not found</li>
          <li><code>409</code> — order not in <code>PENDING_PAYMENT</code> state</li>
          <li><code>503</code> — selected provider isn't configured on this server</li>
        </ul>
      </article>

      <article class="endpoint" id="payments-verify">
        <header>
          <span class="method get">GET</span>
          <span class="path">/payments/verify</span>
          <span class="auth-pill">Public</span>
        </header>
        <p class="desc">
          Re-sync a payment's status from the PSP using its reference. Called by the frontend after the PSP redirects the buyer back. Public because the post-PSP redirect doesn't carry your access token; the reference itself is an unguessable id, and verification just mirrors what the PSP already exposes publicly with the same reference.
        </p>
        <h3>Query</h3>
<pre>?reference=pay_abc123…</pre>
        <h3>Response 200</h3>
<pre>{
  <span class="k">"id"</span>: <span class="s">"…"</span>,
  <span class="k">"reference"</span>: <span class="s">"pay_abc123…"</span>,
  <span class="k">"providerRef"</span>: <span class="s">"3712487123"</span>,
  <span class="k">"status"</span>: <span class="s">"SUCCESS"</span>,
  <span class="k">"channel"</span>: <span class="s">"MOBILE_MONEY"</span>,
  <span class="k">"amount"</span>: <span class="s">"42.50"</span>,
  <span class="k">"currency"</span>: <span class="s">"GHS"</span>,
  <span class="k">"completedAt"</span>: <span class="s">"2026-05-15T18:42:00Z"</span>
}</pre>
        <p>Idempotent: re-verifying an already-<code>SUCCESS</code> payment returns immediately without calling the PSP again or re-firing notifications.</p>
      </article>

      <article class="endpoint" id="payments-webhook">
        <header>
          <span class="method post">POST</span>
          <span class="path">/payments/webhook/:provider</span>
          <span class="auth-pill">Public (signed)</span>
        </header>
        <p class="desc">
          Async confirmation from the PSP. Paystack signs with HMAC-SHA512 of the raw body using the secret key (header <code>x-paystack-signature</code>). Flutterwave compares <code>verif-hash</code> against <code>FLUTTERWAVE_WEBHOOK_SECRET</code>. Invalid signatures → <code>400</code>.
        </p>
        <p>The webhook payload is treated as a <em>trigger</em>, not as truth — we always re-verify against the PSP's API. This protects against replayed or spoofed payloads.</p>
        <p>Returns <code>200 { "ok": true }</code> on success; the PSP stops retrying. Unknown references also return <code>200</code> (logged) so PSPs don't retry forever.</p>
      </article>

      <article class="endpoint" id="payments-refund">
        <header>
          <span class="method post">POST</span>
          <span class="path">/payments/:id/refund</span>
          <span class="auth-pill required"><span class="role admin">ADMIN</span> only</span>
        </header>
        <p class="desc">
          Issue a full refund on a previously-<code>SUCCESS</code> payment. Calls the PSP's refund API, then transitions the local <code>Payment</code> row to <code>REFUNDED</code>. If the linked order is still in <code>PENDING_PAYMENT</code> or <code>CONFIRMED</code>, it's cancelled in the same flow and stock is restored. Orders already in <code>SHIPPED</code>/<code>OUT_FOR_DELIVERY</code>/<code>DELIVERED</code> are left alone — refunding money while goods are out is an ops/dispute case, surfaced via warning log.
        </p>
        <h3>Request</h3>
<pre>{ <span class="k">"reason"</span>: <span class="s">"Buyer chargeback initiated"</span> }   <span class="c">// optional</span></pre>
        <h3>Response 200</h3>
<pre>{
  <span class="k">"id"</span>: <span class="s">"…"</span>,
  <span class="k">"status"</span>: <span class="s">"REFUNDED"</span>,
  <span class="k">"refundedAt"</span>: <span class="s">"2026-05-15T22:00:00Z"</span>,
  <span class="k">"refundReason"</span>: <span class="s">"Buyer chargeback initiated"</span>,
  …
}</pre>
        <h3>Errors</h3>
        <ul>
          <li><code>403</code> — caller is not ADMIN</li>
          <li><code>404</code> — payment not found</li>
          <li><code>409</code> — payment is not in <code>SUCCESS</code> state (already refunded, failed, or still pending)</li>
          <li><code>503</code> — PSP refused the refund (provider-side failure); state is unchanged so it's safe to retry</li>
        </ul>
        <div class="callout">
          Only full refunds for now. Partial refunds are doable on both providers but require an admin-decided amount and a richer Payment row; out of scope for v1.
        </div>
      </article>

      <section>
        <h2>Scheduled jobs</h2>
        <p>Two daily jobs run automatically (scheduled by <code>PaymentsScheduler.onModuleInit</code> via BullMQ's idempotent <code>upsertJobScheduler</code>).</p>

        <table>
          <thead><tr><th>Job</th><th>Cron</th><th>What it does</th></tr></thead>
          <tbody>
            <tr>
              <td><code>reconcile-payments</code></td>
              <td>04:00 UTC daily</td>
              <td>Walks the last 24h of transactions on every configured PSP. Repairs payments whose local state has drifted (typically because a webhook never landed). Then scans for orders stuck in <code>PENDING_PAYMENT</code> even though their payment is <code>SUCCESS</code> and re-fires <code>markPaid</code>. Logs phantoms (PSP says paid, we have no row) and amount mismatches for human follow-up.</td>
            </tr>
            <tr>
              <td><code>cancel-abandoned-orders</code></td>
              <td>04:30 UTC daily</td>
              <td>Finds orders sitting in <code>PENDING_PAYMENT</code> longer than <code>ABANDONED_CART_GRACE_HOURS</code> (default 24h), cancels them with reason <code>"Payment timed out"</code>, and restores reserved stock. Set the env var to 0 to disable.</td>
            </tr>
          </tbody>
        </table>

        <div class="callout">
          Reconciliation is the safety net for webhook delivery failures. Paystack retries dropped webhooks for ~72h; Flutterwave is similar. If your server is down longer than that, reconciliation is what catches the gap. At zero volume it does nothing; at scale it's what keeps support tickets from piling up.
        </div>
      </section>

      <section>
        <h2>Reconciliation audit log</h2>
        <p>Every reconcile pass — scheduled or manual — writes a <code>ReconcileRun</code> row with summary counts and a per-drift-type <code>ReconcileEvent</code>. Browse history, drill into a specific run, or trigger one on demand via the admin endpoints below.</p>
        <table>
          <thead><tr><th><code>kind</code></th><th>What it means</th></tr></thead>
          <tbody>
            <tr><td><code>PHANTOM</code></td><td>PSP charged a reference we have no Payment row for. Needs human investigation.</td></tr>
            <tr><td><code>MISMATCH</code></td><td>PSP and our records disagree on amount or currency for the same reference. Needs investigation.</td></tr>
            <tr><td><code>RECONCILED</code></td><td>Drift auto-repaired: PSP said SUCCESS, we promoted PENDING/FAILED → SUCCESS and re-fired downstream effects.</td></tr>
            <tr><td><code>STUCK_RESOLVED</code></td><td>Payment was already SUCCESS but the Order was stuck in PENDING_PAYMENT; markPaid retried successfully.</td></tr>
          </tbody>
        </table>
      </section>

      <article class="endpoint" id="reconcile-list">
        <header>
          <span class="method get">GET</span>
          <span class="path">/admin/reconciliations</span>
          <span class="auth-pill required"><span class="role admin">ADMIN</span> only</span>
        </header>
        <p class="desc">Paginated list of reconcile runs, newest first.</p>
        <h3>Query parameters</h3>
        <table>
          <thead><tr><th>Name</th><th>Default</th></tr></thead>
          <tbody>
            <tr><td><code>take</code></td><td>20 (clamped 1–100)</td></tr>
            <tr><td><code>skip</code></td><td>0</td></tr>
          </tbody>
        </table>
        <h3>Response 200</h3>
<pre>[
  {
    <span class="k">"id"</span>: <span class="s">"…"</span>,
    <span class="k">"startedAt"</span>: <span class="s">"2026-05-15T04:00:00Z"</span>,
    <span class="k">"finishedAt"</span>: <span class="s">"2026-05-15T04:00:18Z"</span>,
    <span class="k">"windowSince"</span>: <span class="s">"2026-05-14T04:00:00Z"</span>,
    <span class="k">"windowUntil"</span>: <span class="s">"2026-05-15T04:00:00Z"</span>,
    <span class="k">"scannedByProvider"</span>: { <span class="k">"PAYSTACK"</span>: <span class="n">42</span>, <span class="k">"FLUTTERWAVE"</span>: <span class="n">18</span> },
    <span class="k">"reconciledCount"</span>: <span class="n">1</span>,
    <span class="k">"stuckCount"</span>: <span class="n">0</span>,
    <span class="k">"phantomsCount"</span>: <span class="n">0</span>,
    <span class="k">"mismatchesCount"</span>: <span class="n">0</span>,
    <span class="k">"durationMs"</span>: <span class="n">18234</span>
  }
]</pre>
      </article>

      <article class="endpoint" id="reconcile-get">
        <header>
          <span class="method get">GET</span>
          <span class="path">/admin/reconciliations/:id</span>
          <span class="auth-pill required"><span class="role admin">ADMIN</span> only</span>
        </header>
        <p class="desc">Full run with its events, oldest event first. Use this to drill into phantoms or mismatches that need investigating.</p>
        <h3>Response 200</h3>
<pre>{
  <span class="k">"id"</span>: <span class="s">"…"</span>,
  <span class="k">"startedAt"</span>: <span class="s">"…"</span>,
  …
  <span class="k">"events"</span>: [
    {
      <span class="k">"id"</span>: <span class="s">"…"</span>,
      <span class="k">"kind"</span>: <span class="s">"RECONCILED"</span>,
      <span class="k">"provider"</span>: <span class="s">"PAYSTACK"</span>,
      <span class="k">"reference"</span>: <span class="s">"pay_…"</span>,
      <span class="k">"paymentId"</span>: <span class="s">"…"</span>,
      <span class="k">"detail"</span>: { <span class="k">"from"</span>: <span class="s">"PENDING"</span>, <span class="k">"to"</span>: <span class="s">"SUCCESS"</span> }
    }
  ]
}</pre>
        <h3>Errors</h3>
        <ul>
          <li><code>403</code> — caller isn't ADMIN</li>
          <li><code>404</code> — no run with that id</li>
        </ul>
      </article>

      <article class="endpoint" id="reconcile-run">
        <header>
          <span class="method post">POST</span>
          <span class="path">/admin/reconciliations/run</span>
          <span class="auth-pill required"><span class="role admin">ADMIN</span> only</span>
        </header>
        <p class="desc">Trigger a reconciliation pass on demand — useful after fixing a webhook misconfiguration or to verify a backfill. Window defaults to the last 24h; the cap is 30 days.</p>
        <h3>Request</h3>
<pre>{ <span class="k">"lookbackHours"</span>: <span class="n">72</span> }   <span class="c">// optional, default 24, max 720</span></pre>
        <h3>Response 200</h3>
<pre>{
  <span class="k">"runId"</span>: <span class="s">"…"</span>,
  <span class="k">"scannedByProvider"</span>: { <span class="k">"PAYSTACK"</span>: <span class="n">…</span> },
  <span class="k">"reconciled"</span>: <span class="n">…</span>,
  <span class="k">"stuck"</span>: <span class="n">…</span>,
  <span class="k">"phantoms"</span>: [<span class="s">"…"</span>],
  <span class="k">"mismatches"</span>: [<span class="s">"…"</span>]
}</pre>
      </article>

      <section>
        <h2>What sellers/buyers see</h2>
        <p>Notifications fire automatically through the existing email + SMS infrastructure:</p>
        <table>
          <thead><tr><th>Event</th><th>Email</th><th>SMS</th></tr></thead>
          <tbody>
            <tr><td>Payment <code>SUCCESS</code> → order <code>CONFIRMED</code></td><td><code>order-placed-seller</code></td><td><code>order-placed</code> (if seller has verified phone)</td></tr>
            <tr><td>Order <code>SHIPPED</code></td><td><code>order-shipped-buyer</code></td><td><code>order-shipped</code></td></tr>
            <tr><td>Order <code>OUT_FOR_DELIVERY</code></td><td><code>order-out-for-delivery-buyer</code></td><td><code>order-out-for-delivery</code></td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>End-to-end with curl</h2>
<pre><span class="c"># 1. Buyer creates order — lands in PENDING_PAYMENT</span>
curl -X POST .../orders -H "Authorization: Bearer $BUYER" \\
  -d '{"storeId":"…","items":[...],"shippingAddress":"…"}'
<span class="c"># → { id: "order_abc", status: "PENDING_PAYMENT", totalAmount: "42.50" }</span>

<span class="c"># 2. Initiate payment</span>
curl -X POST .../payments/init -H "Authorization: Bearer $BUYER" \\
  -d '{"orderId":"order_abc","provider":"PAYSTACK"}'
<span class="c"># → { payment: { reference: "pay_…", status: "PENDING" }, redirectUrl: "https://checkout.paystack.com/..." }</span>

<span class="c"># 3. Buyer pays via the redirectUrl. PSP redirects to PAYMENT_REDIRECT_URL with ?reference=…</span>
<span class="c"># 4. Frontend calls verify</span>
curl .../payments/verify?reference=pay_…
<span class="c"># → { status: "SUCCESS", completedAt: "…" } — order is now CONFIRMED, seller has been notified</span></pre>
      </section>

      <div class="footer">
        Bikoba marketplace — Payments module.
      </div>
    </article>

    <!-- ──────────── MEDIA PAGE ──────────── -->
    <article class="page" id="media-page">
      <header class="hero">
        <div class="eyebrow">Media · API Reference</div>
        <h1>Image uploads</h1>
        <p>Multipart upload endpoint that streams images to <strong>Cloudflare R2</strong> and returns a public CDN URL. R2 is the only supported backend — the endpoint returns <code>503</code> if R2 isn't configured.</p>
      </header>

      <section>
        <h2>How it works</h2>
        <ul>
          <li>Client POSTs <code>multipart/form-data</code> with a field named <code>file</code>.</li>
          <li>Server validates MIME (<code>image/jpeg</code>, <code>image/png</code>, <code>image/webp</code>, <code>image/gif</code>) and size (<code>MAX_UPLOAD_BYTES</code>, default <strong>8 MB</strong>).</li>
          <li>Generates an immutable key of the form <code>images/YYYY/MM/&lt;hex&gt;.&lt;ext&gt;</code>.</li>
          <li>Streams the buffer to the R2 bucket with the original <code>Content-Type</code> and a one-year immutable cache header.</li>
          <li>Response includes the public URL — assembled from <code>R2_PUBLIC_URL</code> plus the key. URLs never collide; uploading the same file twice produces two distinct URLs.</li>
        </ul>
      </section>

      <section>
        <h2>Configuration</h2>
        <p>All five R2 env vars must be set together. Partial config fails at boot. With nothing configured, the upload endpoint returns <code>503</code> until the secrets are filled in — every other endpoint works unchanged.</p>
<pre><span class="c"># .env</span>
<span class="k">R2_ACCOUNT_ID</span>=<span class="s">abc123…</span>
<span class="k">R2_ACCESS_KEY_ID</span>=<span class="s">…</span>
<span class="k">R2_SECRET_ACCESS_KEY</span>=<span class="s">…</span>
<span class="k">R2_BUCKET</span>=<span class="s">bikoba-media</span>
<span class="k">R2_PUBLIC_URL</span>=<span class="s">https://cdn.bikoba.com</span>
<span class="k">MAX_UPLOAD_BYTES</span>=<span class="n">8388608</span></pre>

        <div class="callout">
          To get your <code>R2_ACCOUNT_ID</code>, open Cloudflare dashboard → R2 → it appears at the top of the page. Create the bucket and generate an API token with read+write to that bucket. For <code>R2_PUBLIC_URL</code>, connect a custom domain to the bucket under R2 → Settings → Public access.
        </div>
      </section>

      <h2>Endpoints</h2>

      <article class="endpoint" id="media-upload">
        <header>
          <span class="method post">POST</span>
          <span class="path">/media/images</span>
          <span class="auth-pill required">Verified email</span>
        </header>
        <p class="desc">Upload one image. Returns the public URL plus storage key.</p>

        <h3>Request</h3>
<pre><span class="c"># multipart/form-data — single field named "file"</span>
curl -X POST http://localhost:3000/media/images \\
  -H <span class="s">"Authorization: Bearer &lt;accessToken&gt;"</span> \\
  -F <span class="s">"file=@./photo.jpg"</span></pre>

        <h3>Response 201</h3>
<pre>{
  <span class="k">"key"</span>: <span class="s">"images/2026/05/9f3a…0c.jpg"</span>,
  <span class="k">"url"</span>: <span class="s">"https://cdn.bikoba.com/images/2026/05/9f3a…0c.jpg"</span>,
  <span class="k">"contentType"</span>: <span class="s">"image/jpeg"</span>,
  <span class="k">"size"</span>: <span class="n">204815</span>
}</pre>

        <h3>Errors</h3>
        <ul>
          <li><code>400</code> — file missing, wrong MIME type, or larger than <code>MAX_UPLOAD_BYTES</code></li>
          <li><code>401</code> — no/invalid bearer token</li>
          <li><code>403</code> — caller's email isn't verified</li>
          <li><code>500</code> — R2 PUT failed (network / bad credentials / bucket misconfigured)</li>
          <li><code>503</code> — R2 is not configured on the server</li>
        </ul>
      </article>

      <section>
        <h2>Wiring it into a flow</h2>
        <p>Typical create-listing flow from a client:</p>
        <ol>
          <li>Client uploads each image via <code>POST /media/images</code> in sequence (or in parallel) and collects the returned <code>url</code> values.</li>
          <li>Client calls <code>POST /products</code> with <code>images: [url1, url2, …]</code>.</li>
        </ol>
        <p>For store logos and banners, same idea: upload first, then <code>PATCH /stores/:id</code> with <code>logoUrl</code> / <code>bannerUrl</code> set to the returned URL.</p>
      </section>

      <div class="footer">
        Bikoba marketplace — Media module.
      </div>
    </article>
  </main>
</div>
</body>
</html>`;
