export default function Login({ error }: { error: string }) {
  return (
    <main className="page-shell">
      <section className="welcome-card">
        <div className="brand-mark" aria-hidden="true">
          D
        </div>
        <p className="eyebrow">DIMSUM BOT</p>
        <h1>Your Discord, at a glance.</h1>
        <p className="intro">
          Explore your servers, manage server settings, and browse saved writing
          prompts.
        </p>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <a className="primary-button" href="/api/auth/login">
          Continue with Discord
        </a>
        <p className="privacy-note">
          Server changes require Manage Server permission. Saved prompts are
          visible to their author and server managers.
        </p>
      </section>
    </main>
  );
}
