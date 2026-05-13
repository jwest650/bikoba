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
  body:has(#auth-page :target) .sidebar a[href="#auth-page"] {
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
      <a class="primary" href="#categories-page">Categories</a>

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
      <a href="#role-gated">Role-gated examples</a>

      <div class="nav-group">Categories · Endpoints</div>
      <a href="#categories-create">POST /categories</a>
      <a href="#categories-list">GET /categories</a>
      <a href="#categories-by-slug">GET /categories/:slug</a>
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
            <div class="top"><h4>Listings</h4><span class="status planned">Planned</span></div>
            <p>Seller-owned product listings: create, update, publish/unpublish, search and filter.</p>
          </div>
          <div class="module">
            <div class="top"><h4>Cart &amp; Checkout</h4><span class="status planned">Planned</span></div>
            <p>Buyer carts, address management, order creation and checkout flow.</p>
          </div>
          <div class="module">
            <div class="top"><h4>Orders &amp; Fulfilment</h4><span class="status planned">Planned</span></div>
            <p>Order lifecycle, seller fulfilment, status updates, returns.</p>
          </div>
          <div class="module">
            <div class="top"><h4>Payments</h4><span class="status planned">Planned</span></div>
            <p>Buyer charges, escrow, seller payouts, refunds.</p>
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
<span class="k">SMTP_FROM</span>=<span class="s">"Bikoba &lt;no-reply@bikoba.local&gt;"</span></pre>

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
        <p class="desc">Exchange email + password for a new token pair. Opens a new session row.</p>
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
  </main>
</div>
</body>
</html>`;
