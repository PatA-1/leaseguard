import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { conditionFromAnnotations } from "../utils/condition";

function getSeverityClass(severity) {
  const value = severity?.toLowerCase();
  if (value === "high") return "badge badge-high";
  if (value === "medium") return "badge badge-medium";
  return "badge badge-low";
}

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString();
}

function Report() {
  const { propertyId } = useParams();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReport = async () => {
    try {
      const response = await api.get(`/reports/${propertyId}`);
      setReportData(response.data);
    } catch (err) {
      console.error("REPORT FETCH ERROR:", err);
      setError(err.response?.data?.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [propertyId]);

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <p>Loading report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="container">
          <div className="completeness-banner completeness-warn">{error}</div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="page">
        <div className="container">
          <p>No report data available.</p>
        </div>
      </div>
    );
  }

  const { property, generatedAt } = reportData;

  const totalRooms = property.rooms.length;
  const totalImages = property.rooms.reduce(
    (sum, room) => sum + room.images.length,
    0
  );
  const totalIssues = property.rooms.reduce(
    (sum, room) =>
      sum +
      room.images.reduce((imgSum, image) => imgSum + image.annotations.length, 0),
    0
  );

  const moveIn = formatDate(property.moveInDate);

  return (
    <div className="page">
      <div className="container">
        <div className="space-between section card">
          <div>
            <h1 className="page-title">Inspection Report</h1>
            <p className="page-subtitle">
              Structured room-by-room condition summary for dispute protection.
            </p>
          </div>

          <button
            className="btn btn-primary report-print-hide"
            onClick={() => window.print()}
          >
            Export / Save as PDF
          </button>
        </div>

        <div className="section card">
          <div className="space-between">
            <h2 className="heading-2">{property.name}</h2>
            <span
              className={
                property.inspectionType === "CHECKOUT"
                  ? "badge badge-medium"
                  : "badge badge-low"
              }
            >
              {property.inspectionType === "CHECKOUT"
                ? "Check-out inspection"
                : "Check-in inspection"}
            </span>
          </div>

          <p className="muted">{property.address}</p>

          {/* Tenancy metadata block */}
          <div className="report-meta">
            {moveIn && (
              <div className="report-meta-item">
                <span className="report-meta-label">Move-in date</span>
                <span className="report-meta-value">{moveIn}</span>
              </div>
            )}
            {property.depositAmount != null && (
              <div className="report-meta-item">
                <span className="report-meta-label">Deposit</span>
                <span className="report-meta-value">£{property.depositAmount}</span>
              </div>
            )}
            {property.depositScheme && (
              <div className="report-meta-item">
                <span className="report-meta-label">Scheme</span>
                <span className="report-meta-value">{property.depositScheme}</span>
              </div>
            )}
            {property.landlordName && (
              <div className="report-meta-item">
                <span className="report-meta-label">Landlord / agent</span>
                <span className="report-meta-value">{property.landlordName}</span>
              </div>
            )}
            <div className="report-meta-item">
              <span className="report-meta-label">Generated</span>
              <span className="report-meta-value">
                {new Date(generatedAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid-3" style={{ marginTop: "20px" }}>
            <div className="summary-stat">
              <div className="summary-stat-title">Rooms</div>
              <div className="summary-stat-value">{totalRooms}</div>
            </div>

            <div className="summary-stat">
              <div className="summary-stat-title">Images</div>
              <div className="summary-stat-value">{totalImages}</div>
            </div>

            <div className="summary-stat">
              <div className="summary-stat-title">Issues</div>
              <div className="summary-stat-value">{totalIssues}</div>
            </div>
          </div>
        </div>

        {property.rooms.map((room) => {
          const roomAnnotations = room.images.flatMap((img) => img.annotations);
          const roomIssueCount = roomAnnotations.length;
          const condition = conditionFromAnnotations(roomAnnotations);

          return (
            <div key={room.id} className="section card">
              <div className="space-between">
                <h3 className="heading-3">{room.name}</h3>
                <span className={`badge ${condition.className}`}>
                  {room.images.length === 0 ? "No photos" : condition.label}
                </span>
              </div>

              {roomIssueCount === 0 ? (
                <div className="room-banner-clean">
                  <strong>No issues recorded for this room.</strong>
                </div>
              ) : (
                <div className="room-banner-issues">
                  <strong>{roomIssueCount}</strong> issue
                  {roomIssueCount !== 1 ? "s" : ""} recorded in this room.
                </div>
              )}

              {room.images.length === 0 ? (
                <p className="muted">No images uploaded for this room.</p>
              ) : (
                room.images.map((image) => (
                  <div key={image.id} className="image-card">
                    <div
                      className="image-frame"
                      style={{
                        position: "relative",
                        display: "inline-block",
                        width: "100%",
                        maxWidth: "500px"
                      }}
                    >
                      <img
                        src={image.url}
                        alt="Inspection"
                        style={{ width: "100%", display: "block" }}
                      />

                      {image.annotations.map((annotation, index) => (
                        <div
                          key={annotation.id}
                          title={`${annotation.note} (${annotation.severity})`}
                          className="annotation-dot saved"
                          style={{
                            left: `${annotation.x * 100}%`,
                            top: `${annotation.y * 100}%`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            fontWeight: "700",
                            color: "#111"
                          }}
                        >
                          {index + 1}
                        </div>
                      ))}
                    </div>

                    {image.caption && (
                      <p className="image-caption">
                        <strong>Condition:</strong> {image.caption}
                      </p>
                    )}

                    <p className="timestamp">
                      <strong>Captured:</strong>{" "}
                      {new Date(image.createdAt).toLocaleString()}
                    </p>

                    <h4 className="heading-3">Issues Found</h4>

                    {image.annotations.length === 0 ? (
                      <p className="muted">No issues recorded for this image.</p>
                    ) : (
                      <ul className="issue-list">
                        {image.annotations.map((annotation, index) => (
                          <li key={annotation.id} className="issue-item">
                            <strong>#{index + 1}</strong>{" "}
                            <span className={getSeverityClass(annotation.severity)}>
                              {annotation.severity}
                            </span>
                            <span style={{ marginLeft: "10px" }}>{annotation.note}</span>
                            <br />
                            <small className="muted">
                              Logged: {new Date(annotation.createdAt).toLocaleString()}
                            </small>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Report;
