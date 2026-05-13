export const DOCS_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Bikoba Auth API</title>
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
  .nav-group {
    margin: 18px 0 6px;
    padding: 0 10px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #94a3b8;
  }

  /* Main column */
  main {
    padding: 56px 64px 96px;
    max-width: 880px;
  }
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
    font-size: 15px;
    margin: 22px 0 8px;
    color: var(--fg-muted);
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    font-size: 11px;
  }
  p { margin: 0 0 14px; }
  ul { padding-left: 22px; margin: 0 0 14px; }
  li { margin-bottom: 4px; }

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
  }
</style>
</head>
<body>
<div class="layout">
  <aside class="sidebar">
    <div class="brand"><span class="logo">B</span><span>Bikoba Auth</span></div>
    <nav>
      <a href="#overview">Overview</a>
      <a href="#setup">Setup</a>
      <a href="#flow">Auth flow</a>
      <a href="#roles">Roles</a>
      <a href="#errors">Errors</a>
      <div class="nav-group">Endpoints</div>
      <a href="#register">POST /auth/register</a>
      <a href="#login">POST /auth/login</a>
      <a href="#refresh">POST /auth/refresh</a>
      <a href="#logout">POST /auth/logout</a>
      <a href="#logout-all">POST /auth/logout-all</a>
      <a href="#me">POST /auth/me</a>
      <a href="#role-gated">Role-gated examples</a>
    </nav>
  </aside>

  <main>
    <header class="hero">
      <div class="eyebrow">API Documentation</div>
      <h1>Bikoba Auth API</h1>
      <p>JWT access tokens, rotating refresh tokens, and role-based access for marketplace buyers, sellers, and admins.</p>
    </header>

    <section id="overview">
      <h2>Overview</h2>
      <p>
        Bikoba issues short-lived <strong>access tokens</strong> (default 15 minutes) and longer-lived
        <strong>refresh tokens</strong> (default 7 days). Refresh tokens are bound to a server-side
        <code>Session</code> row so they can be revoked per device. Each refresh rotates the token
        and re-issues a new access token.
      </p>
      <ul>
        <li>Passwords hashed with bcrypt.</li>
        <li>Refresh tokens stored only as hashes — raw tokens never leave the issuing response.</li>
        <li>Refresh-token reuse revokes every active session for the user.</li>
        <li>Access strategy re-checks user activation on every request.</li>
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
<span class="k">BCRYPT_SALT_ROUNDS</span>=<span class="n">12</span></pre>

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

    <section id="roles">
      <h2>Roles</h2>
      <table>
        <thead>
          <tr><th>Role</th><th>Who</th><th>Can self-register</th></tr>
        </thead>
        <tbody>
          <tr><td><span class="role buyer">BUYER</span></td><td>Default marketplace customer</td><td>Yes</td></tr>
          <tr><td><span class="role seller">SELLER</span></td><td>Vendor account, manages listings</td><td>Yes</td></tr>
          <tr><td><span class="role admin">ADMIN</span></td><td>Platform operator</td><td>No — seed only</td></tr>
        </tbody>
      </table>
      <p>Gate routes with the <code>@Roles(...)</code> decorator plus <code>RolesGuard</code>. The global <code>JwtAuthGuard</code> protects every route unless you mark it <code>@Public()</code>.</p>
    </section>

    <section id="errors">
      <h2>Errors</h2>
      <table>
        <thead><tr><th>Status</th><th>When</th></tr></thead>
        <tbody>
          <tr><td><code>400</code></td><td>Validation failed on the request body</td></tr>
          <tr><td><code>401</code></td><td>Missing / invalid / expired token, or wrong password</td></tr>
          <tr><td><code>403</code></td><td>Authenticated, but the user's role isn't allowed</td></tr>
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
      <p class="desc">Create a new BUYER or SELLER account and return an initial token pair.</p>
      <h3>Request</h3>
<pre>{
  <span class="k">"email"</span>: <span class="s">"jane@example.com"</span>,
  <span class="k">"password"</span>: <span class="s">"correct horse battery"</span>,
  <span class="k">"fullName"</span>: <span class="s">"Jane Doe"</span>,
  <span class="k">"role"</span>: <span class="s">"SELLER"</span>          <span class="c">// optional, defaults to BUYER. ADMIN rejected.</span>
}</pre>
      <h3>Response 201</h3>
<pre>{
  <span class="k">"user"</span>: { <span class="k">"id"</span>: <span class="s">"…"</span>, <span class="k">"email"</span>: <span class="s">"jane@example.com"</span>, <span class="k">"role"</span>: <span class="s">"SELLER"</span> },
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
  <span class="k">"user"</span>: { <span class="k">"id"</span>: <span class="s">"…"</span>, <span class="k">"email"</span>: <span class="s">"…"</span>, <span class="k">"role"</span>: <span class="s">"BUYER"</span> },
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
      <p class="desc">Return the authenticated user's id, email, and role.</p>
      <h3>Response 200</h3>
<pre>{ <span class="k">"id"</span>: <span class="s">"…"</span>, <span class="k">"email"</span>: <span class="s">"…"</span>, <span class="k">"role"</span>: <span class="s">"BUYER"</span> }</pre>
    </article>

    <section id="role-gated">
      <h2>Role-gated examples</h2>
      <p>These show how <code>@Roles(...)</code> + <code>RolesGuard</code> compose with the global JWT guard.</p>

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

      <h3>Wiring your own route</h3>
<pre><span class="k">@UseGuards</span>(RolesGuard)
<span class="k">@Roles</span>(Role.SELLER, Role.ADMIN)
<span class="k">@Post</span>(<span class="s">'listings'</span>)
createListing(<span class="k">@CurrentUser</span>() user: AuthenticatedUser, <span class="k">@Body</span>() dto: CreateListingDto) {
  <span class="k">return</span> <span class="k">this</span>.listings.create(user.id, dto);
}</pre>
    </section>

    <div class="footer">
      Bikoba marketplace — NestJS 11, Prisma 6, Passport-JWT.
    </div>
  </main>
</div>
</body>
</html>`;
