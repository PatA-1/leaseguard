import { Link } from "react-router-dom";

function Landing() {
  return (
    <div className="page landing-page">
      <div className="container">
        <div className="landing-hero card">
          <div className="landing-copy">
            <h1 className="landing-title">
              Protect rental inspections with structured, timestamped evidence.
            </h1>

            <p className="landing-subtitle">
              LeaseGuard helps tenants document room conditions, capture photos,
              annotate damage, and generate professional inspection reports for
              dispute protection.
            </p>

            <div className="landing-actions">
              <Link to="/register">
                <button className="btn btn-primary">Get Started</button>
              </Link>

              <Link to="/login">
                <button className="btn btn-outline">Sign In</button>
              </Link>
            </div>

            <div className="landing-stats grid-3">
              <div className="summary-stat">
                <div className="summary-stat-title">Capture</div>
                <div className="summary-stat-value">Photos</div>
              </div>

              <div className="summary-stat">
                <div className="summary-stat-title">Log</div>
                <div className="summary-stat-value">Issues</div>
              </div>

              <div className="summary-stat">
                <div className="summary-stat-title">Export</div>
                <div className="summary-stat-value">Reports</div>
              </div>
            </div>
          </div>

          <div className="landing-panel">
            <div className="card-soft section">
              <h3 className="heading-3">Why LeaseGuard?</h3>
              <p className="muted">
                Most tenants rely on scattered gallery photos with no structure,
                making disputes difficult. LeaseGuard turns inspections into
                organised, timestamped, room-by-room documentation.
              </p>
            </div>

            <div className="card-soft section">
              <h3 className="heading-3">Core Features</h3>
              <ul className="issue-list">
                <li className="issue-item">Room-by-room inspection capture</li>
                <li className="issue-item">Damage annotation with severity</li>
                <li className="issue-item">Timestamped evidence history</li>
                <li className="issue-item">Printable PDF-ready reports</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Landing;