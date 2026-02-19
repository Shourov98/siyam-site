export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__brand">CommandCtr</div>

      <nav className="navbar__links" aria-label="Main navigation">
        <a href="#">Home</a>
        <a href="#">Integrations</a>
        <a href="#">Pricing</a>
        <a href="#">About Us</a>
        <a href="#">FAQ</a>
      </nav>

      <div className="navbar__actions">
        <a className="signin-link" href="#">
          Sign In
        </a>
        <a className="trial-btn" href="#">
          Start Free Trial
        </a>
      </div>
    </header>
  );
}
