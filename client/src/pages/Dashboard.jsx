import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import Toast from "../components/Toast";
import useToast from "../hooks/useToast";

function Dashboard() {
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState({
    name: "",
    address: "",
    inspectionType: "CHECKIN",
    moveInDate: "",
    depositAmount: "",
    depositScheme: "",
    landlordName: ""
  });
  const [roomCounts, setRoomCounts] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast, showSuccess, showError, clearToast } = useToast();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const fetchProperties = async () => {
    try {
      const response = await api.get("/properties");
      setProperties(response.data);

      // One summary call per property (rooms + counts in a single query each),
      // replacing the previous per-image annotation waterfall.
      const details = await Promise.all(
        response.data.map((property) =>
          api.get(`/properties/${property.id}/summary`)
        )
      );

      const counts = {};
      details.forEach((res) => {
        counts[res.data.property.id] = {
          rooms: res.data.totals.rooms,
          images: res.data.totals.images,
          issues: res.data.totals.issues
        };
      });

      setRoomCounts(counts);
    } catch (error) {
      showError(error.response?.data?.message || "Failed to load properties");
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post("/properties", form);
      setForm({
        name: "",
        address: "",
        inspectionType: "CHECKIN",
        moveInDate: "",
        depositAmount: "",
        depositScheme: "",
        landlordName: ""
      });
      showSuccess("Property created");
      fetchProperties();
    } catch (error) {
      showError(error.response?.data?.message || "Failed to create property");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e, propertyId) => {
    // Stop the click bubbling up to the surrounding Link
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      "Delete this property and all of its rooms, photos, and notes? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      await api.delete(`/properties/${propertyId}`);
      showSuccess("Property deleted");
      fetchProperties();
    } catch (error) {
      showError(error.response?.data?.message || "Failed to delete property");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const totalProperties = properties.length;
  const totalRooms = Object.values(roomCounts).reduce(
    (sum, item) => sum + (item.rooms || 0),
    0
  );
  const totalIssues = Object.values(roomCounts).reduce(
    (sum, item) => sum + (item.issues || 0),
    0
  );

  return (
    <div className="page">
      <div className="container">
        <Toast message={toast.message} type={toast.type} onClose={clearToast} />

        <div className="section card">
          <div className="space-between">
            <div>
              <h1 className="page-title">Dashboard</h1>
              <p className="page-subtitle">
                Welcome{user?.email ? `, ${user.email}` : ""}. Manage your rental property inspections here.
              </p>
            </div>

            <button className="btn btn-secondary" onClick={handleLogout}>
              Log Out
            </button>
          </div>

          <div className="grid-3" style={{ marginTop: "20px" }}>
            <div className="summary-stat">
              <div className="summary-stat-title">Properties</div>
              <div className="summary-stat-value">{totalProperties}</div>
            </div>

            <div className="summary-stat">
              <div className="summary-stat-title">Rooms</div>
              <div className="summary-stat-value">{totalRooms}</div>
            </div>

            <div className="summary-stat">
              <div className="summary-stat-title">Issues Logged</div>
              <div className="summary-stat-value">{totalIssues}</div>
            </div>
          </div>
        </div>

        <div className="section card">
          <h2 className="heading-2">Add New Property</h2>
          <p className="muted" style={{ marginBottom: "20px" }}>
            Create a property record to begin adding rooms, photos, and inspection notes.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="label">Property Name</label>
                <input
                  className="input"
                  name="name"
                  placeholder="e.g. Flat 12"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">Property Address</label>
                <input
                  className="input"
                  name="address"
                  placeholder="Enter full address"
                  value={form.address}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="label">Inspection Type</label>
                <select
                  className="select"
                  name="inspectionType"
                  value={form.inspectionType}
                  onChange={handleChange}
                >
                  <option value="CHECKIN">Check-in (start of tenancy)</option>
                  <option value="CHECKOUT">Check-out (end of tenancy)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label">Move-in Date</label>
                <input
                  className="input"
                  type="date"
                  name="moveInDate"
                  value={form.moveInDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="label">Deposit Amount (£)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="1"
                  name="depositAmount"
                  placeholder="e.g. 1200"
                  value={form.depositAmount}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="label">Deposit Scheme</label>
                <select
                  className="select"
                  name="depositScheme"
                  value={form.depositScheme}
                  onChange={handleChange}
                >
                  <option value="">Not sure / not set</option>
                  <option value="TDS">Tenancy Deposit Scheme (TDS)</option>
                  <option value="mydeposits">mydeposits</option>
                  <option value="DPS">Deposit Protection Service (DPS)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Landlord or Agent Name</label>
              <input
                className="input"
                name="landlordName"
                placeholder="Optional"
                value={form.landlordName}
                onChange={handleChange}
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Adding..." : "Add Property"}
            </button>
          </form>
        </div>

        <div className="section card">
          <div className="space-between" style={{ marginBottom: "16px" }}>
            <h2 className="heading-2" style={{ margin: 0 }}>
              Your Properties
            </h2>
            <span className="muted">{properties.length} saved</span>
          </div>

          {properties.length === 0 ? (
            <p className="muted">No properties added yet.</p>
          ) : (
            <div className="grid">
              {properties.map((property) => (
                <Link key={property.id} to={`/properties/${property.id}`}>
                  <div className="card-soft section property-card">
                    <div className="space-between">
                      <h3 className="heading-3" style={{ marginBottom: "6px" }}>
                        {property.name}
                      </h3>
                      <span
                        className={
                          property.inspectionType === "CHECKOUT"
                            ? "badge badge-medium"
                            : "badge badge-low"
                        }
                      >
                        {property.inspectionType === "CHECKOUT" ? "Check-out" : "Check-in"}
                      </span>
                    </div>

                    <p className="muted" style={{ marginBottom: "14px" }}>
                      {property.address}
                    </p>

                    <div className="row space-between">
                      <span className="mini-stat">
                        {roomCounts[property.id]?.rooms || 0} rooms
                      </span>
                      <button
                        className="btn btn-danger btn-small"
                        onClick={(e) => handleDelete(e, property.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
