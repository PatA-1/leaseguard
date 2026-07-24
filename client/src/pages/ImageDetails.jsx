import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import Toast from "../components/Toast";
import useToast from "../hooks/useToast";

function ImageDetails() {
  const { id } = useParams();
  const imageRef = useRef(null);

  const [image, setImage] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [form, setForm] = useState({ note: "", severity: "Low" });
  const { toast, showSuccess, showError, clearToast } = useToast();

  const fetchImage = async () => {
    try {
      const response = await api.get(`/images/by-id/${id}`);
      setImage(response.data);
    } catch (error) {
      showError(error.response?.data?.message || "Failed to load image");
    }
  };

  const fetchAnnotations = async () => {
    try {
      const response = await api.get(`/annotations/${id}`);
      setAnnotations(response.data);
    } catch (error) {
      showError(error.response?.data?.message || "Failed to load annotations");
    }
  };

  useEffect(() => {
    fetchImage();
    fetchAnnotations();
  }, [id]);

  const handleImageClick = (e) => {
    const rect = imageRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    setSelectedPoint({ x: clickX / rect.width, y: clickY / rect.height });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSaveAnnotation = async (e) => {
    e.preventDefault();

    if (!selectedPoint) {
      showError("Select a point on the image first");
      return;
    }

    try {
      await api.post("/annotations", {
        x: selectedPoint.x,
        y: selectedPoint.y,
        note: form.note,
        severity: form.severity,
        imageId: Number(id)
      });

      setForm({ note: "", severity: "Low" });
      setSelectedPoint(null);
      showSuccess("Annotation saved");
      fetchAnnotations();
    } catch (error) {
      showError(error.response?.data?.message || "Failed to save annotation");
    }
  };

  const handleDeleteAnnotation = async (annotationId) => {
    const confirmed = window.confirm("Delete this annotation?");
    if (!confirmed) return;
    try {
      await api.delete(`/annotations/annotation/${annotationId}`);
      showSuccess("Annotation deleted");
      fetchAnnotations();
    } catch (error) {
      showError(error.response?.data?.message || "Failed to delete annotation");
    }
  };

  if (!image) {
    return (
      <div className="page">
        <div className="container">
          <Toast message={toast.message} type={toast.type} onClose={clearToast} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <Toast message={toast.message} type={toast.type} onClose={clearToast} />

        <div className="section card">
          <h1 className="page-title">Image Inspection</h1>
          <p className="page-subtitle">
            Tap a point on the image to place a damage marker.
          </p>

          {image.caption && (
            <p className="muted" style={{ marginBottom: "12px" }}>
              <strong>Condition note:</strong> {image.caption}
            </p>
          )}

          <div style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
            <img
              ref={imageRef}
              src={image.url}
              alt="Inspection"
              onClick={handleImageClick}
              style={{
                width: "100%",
                maxWidth: "800px",
                borderRadius: "12px",
                cursor: "crosshair",
                border: "1px solid #ddd"
              }}
            />

            {annotations.map((annotation) => (
              <div
                key={annotation.id}
                title={`${annotation.note} (${annotation.severity})`}
                className="annotation-dot saved"
                style={{
                  left: `${annotation.x * 100}%`,
                  top: `${annotation.y * 100}%`
                }}
              />
            ))}

            {selectedPoint && (
              <div
                className="annotation-dot pending"
                style={{
                  left: `${selectedPoint.x * 100}%`,
                  top: `${selectedPoint.y * 100}%`
                }}
              />
            )}
          </div>
        </div>

        <div className="section card">
          <h2 className="heading-2">Add Damage Note</h2>

          <form onSubmit={handleSaveAnnotation}>
            <div className="form-group">
              <label className="label">Damage Note</label>
              <textarea
                className="textarea"
                name="note"
                value={form.note}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="label">Severity</label>
              <select
                className="select"
                name="severity"
                value={form.severity}
                onChange={handleChange}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <button className="btn btn-primary" type="submit">
              Save Annotation
            </button>
          </form>
        </div>

        <div className="section card">
          <h2 className="heading-2">Saved Annotations</h2>

          {annotations.length === 0 ? (
            <p className="muted">No annotations saved yet.</p>
          ) : (
            <div className="grid">
              {annotations.map((annotation) => (
                <div key={annotation.id} className="card-soft section">
                  <div className="space-between">
                    <span
                      className={
                        annotation.severity === "High"
                          ? "badge badge-high"
                          : annotation.severity === "Medium"
                          ? "badge badge-medium"
                          : "badge badge-low"
                      }
                    >
                      {annotation.severity}
                    </span>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => handleDeleteAnnotation(annotation.id)}
                    >
                      Delete
                    </button>
                  </div>

                  <p style={{ marginTop: "10px", marginBottom: "8px" }}>
                    {annotation.note}
                  </p>

                  <small className="muted">
                    Logged: {new Date(annotation.createdAt).toLocaleString()}
                  </small>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ImageDetails;
