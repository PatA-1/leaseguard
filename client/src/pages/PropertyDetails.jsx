import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import Toast from "../components/Toast";
import useToast from "../hooks/useToast";
import { getRoomCondition } from "../utils/condition";

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString();
}

function PropertyDetails() {
  const { id } = useParams();
  const [summary, setSummary] = useState(null);
  const [roomName, setRoomName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast, showSuccess, showError, clearToast } = useToast();

  // Single aggregated call: rooms with image and issue counts.
  const fetchSummary = async () => {
    try {
      const response = await api.get(`/properties/${id}/summary`);
      setSummary(response.data);
    } catch (error) {
      showError(error.response?.data?.message || "Failed to load property");
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [id]);

  const handleAddRoom = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/rooms", { name: roomName, propertyId: Number(id) });
      setRoomName("");
      showSuccess("Room added");
      fetchSummary();
    } catch (error) {
      showError(error.response?.data?.message || "Failed to add room");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoom = async (e, roomId) => {
    e.preventDefault();
    e.stopPropagation();
    const confirmed = window.confirm(
      "Delete this room and all of its photos and notes? This cannot be undone."
    );
    if (!confirmed) return;
    try {
      await api.delete(`/rooms/${roomId}`);
      showSuccess("Room deleted");
      fetchSummary();
    } catch (error) {
      showError(error.response?.data?.message || "Failed to delete room");
    }
  };

  if (!summary) {
    return (
      <div className="page">
        <div className="container">
          <Toast message={toast.message} type={toast.type} onClose={clearToast} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const { property, rooms, totals } = summary;
  const roomsWithoutImages = rooms.filter((r) => r.imageCount === 0).length;
  const moveIn = formatDate(property.moveInDate);

  return (
    <div className="page">
      <div className="container">
        <Toast message={toast.message} type={toast.type} onClose={clearToast} />

        <div className="section card">
          <div className="space-between">
            <div>
              <h1 className="page-title">{property.name}</h1>
              <p className="page-subtitle">{property.address}</p>
            </div>

            <Link to={`/reports/${id}`}>
              <button className="btn btn-primary">View Report</button>
            </Link>
          </div>

          <div className="row" style={{ marginTop: "12px", gap: "8px", flexWrap: "wrap" }}>
            <span
              className={
                property.inspectionType === "CHECKOUT"
                  ? "badge badge-medium"
                  : "badge badge-low"
              }
            >
              {property.inspectionType === "CHECKOUT" ? "Check-out inspection" : "Check-in inspection"}
            </span>
            {moveIn && <span className="mini-stat">Move-in: {moveIn}</span>}
            {property.depositAmount != null && (
              <span className="mini-stat">Deposit: £{property.depositAmount}</span>
            )}
            {property.depositScheme && (
              <span className="mini-stat">Scheme: {property.depositScheme}</span>
            )}
            {property.landlordName && (
              <span className="mini-stat">Landlord: {property.landlordName}</span>
            )}
          </div>

          <div className="grid-3" style={{ marginTop: "20px" }}>
            <div className="summary-stat">
              <div className="summary-stat-title">Rooms</div>
              <div className="summary-stat-value">{totals.rooms}</div>
            </div>

            <div className="summary-stat">
              <div className="summary-stat-title">Images</div>
              <div className="summary-stat-value">{totals.images}</div>
            </div>

            <div className="summary-stat">
              <div className="summary-stat-title">Issues</div>
              <div className="summary-stat-value">{totals.issues}</div>
            </div>
          </div>

          {/* Evidence completeness prompt */}
          {rooms.length === 0 ? (
            <div className="completeness-banner completeness-warn" style={{ marginTop: "16px" }}>
              Add rooms to start documenting this property.
            </div>
          ) : roomsWithoutImages > 0 ? (
            <div className="completeness-banner completeness-warn" style={{ marginTop: "16px" }}>
              {roomsWithoutImages} room{roomsWithoutImages !== 1 ? "s have" : " has"} no photos yet.
              Add photos before generating your report.
            </div>
          ) : (
            <div className="completeness-banner completeness-ok" style={{ marginTop: "16px" }}>
              Every room has at least one photo. Your report is ready to generate.
            </div>
          )}
        </div>

        <div className="section card">
          <h2 className="heading-2">Add Room</h2>
          <p className="muted" style={{ marginBottom: "20px" }}>
            Create room sections to capture evidence and annotate inspection issues.
          </p>

          <form onSubmit={handleAddRoom}>
            <div className="form-group">
              <label className="label">Room Name</label>
              <input
                className="input"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g. Living Room"
                required
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Adding..." : "Add Room"}
            </button>
          </form>
        </div>

        <div className="section card">
          <div className="space-between" style={{ marginBottom: "16px" }}>
            <h2 className="heading-2" style={{ margin: 0 }}>
              Rooms
            </h2>
            <span className="muted">{rooms.length} saved</span>
          </div>

          {rooms.length === 0 ? (
            <p className="muted">No rooms added yet.</p>
          ) : (
            <div className="grid">
              {rooms.map((room) => {
                const condition = getRoomCondition(
                  room.issueCount,
                  false,
                  room.issueCount > 0
                );
                return (
                  <Link key={room.id} to={`/rooms/${room.id}`}>
                    <div className="card-soft section property-card">
                      <div className="space-between">
                        <h3 className="heading-3" style={{ marginBottom: "6px" }}>
                          {room.name}
                        </h3>
                        <span className={`badge ${condition.className}`}>
                          {room.imageCount === 0 ? "No photos" : condition.label}
                        </span>
                      </div>

                      <div className="row space-between">
                        <div className="row">
                          <span className="mini-stat">{room.imageCount} images</span>
                          <span className="mini-stat">{room.issueCount} issues</span>
                        </div>
                        <button
                          className="btn btn-danger btn-small"
                          onClick={(e) => handleDeleteRoom(e, room.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PropertyDetails;
