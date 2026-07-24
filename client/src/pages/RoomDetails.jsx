import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import Toast from "../components/Toast";
import useToast from "../hooks/useToast";
import { ROOM_CHECKLIST } from "../utils/condition";

function RoomDetails() {
  const { id } = useParams();
  const fileInputRef = useRef(null);
  const [room, setRoom] = useState(null);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [pendingCaption, setPendingCaption] = useState("");
  const { toast, showSuccess, showError, clearToast } = useToast();

  const fetchRoom = async () => {
    try {
      const response = await api.get(`/rooms/${id}`);
      setRoom(response.data);
    } catch (error) {
      showError(error.response?.data?.message || "Failed to load room");
    }
  };

  const fetchImages = async () => {
    try {
      const response = await api.get(`/images/${id}`);
      setImages(response.data);
    } catch (error) {
      showError(error.response?.data?.message || "Failed to load photos");
    }
  };

  useEffect(() => {
    fetchRoom();
    fetchImages();
  }, [id]);

  const handleTakePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("roomId", id);
    if (pendingCaption.trim()) {
      formData.append("caption", pendingCaption.trim());
    }

    try {
      setUploading(true);
      await api.post("/images/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setPendingCaption("");
      showSuccess("Photo uploaded");
      fetchImages();
    } catch (error) {
      showError(error.response?.data?.message || error.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteImage = async (e, imageId) => {
    e.preventDefault();
    e.stopPropagation();
    const confirmed = window.confirm(
      "Delete this photo and any notes on it? This cannot be undone."
    );
    if (!confirmed) return;
    try {
      await api.delete(`/images/${imageId}`);
      showSuccess("Photo deleted");
      fetchImages();
    } catch (error) {
      showError(error.response?.data?.message || "Failed to delete photo");
    }
  };

  return (
    <div className="page">
      <div className="container">
        <Toast message={toast.message} type={toast.type} onClose={clearToast} />

        <div className="section card">
          <div className="space-between">
            <div>
              <h1 className="page-title">{room ? room.name : "Room"}</h1>
              <p className="page-subtitle">
                Capture room evidence and manage inspection photos.
              </p>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleTakePhotoClick}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Take Photo"}
            </button>
          </div>

          <div className="form-group" style={{ marginTop: "16px" }}>
            <label className="label">Photo caption (optional)</label>
            <input
              className="input"
              value={pendingCaption}
              onChange={(e) => setPendingCaption(e.target.value)}
              placeholder="e.g. Carpet clean and undamaged on move-in"
            />
            <small className="muted">
              Applied to the next photo you take. Use it to describe overall condition,
              good or bad.
            </small>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>

        {/* Guided documentation checklist */}
        <div className="section card">
          <h2 className="heading-2">Documentation Checklist</h2>
          <p className="muted" style={{ marginBottom: "12px" }}>
            Aim to capture a photo of each of these for a complete record.
          </p>
          <ul className="issue-list">
            {ROOM_CHECKLIST.map((item, index) => (
              <li key={index} className="issue-item">
                {item}
              </li>
            ))}
          </ul>
          {images.length === 0 && (
            <div className="completeness-banner completeness-warn" style={{ marginTop: "12px" }}>
              No photos yet. Start with a wide shot of the whole room.
            </div>
          )}
        </div>

        <div className="section card">
          <h2 className="heading-2">Room Photos</h2>

          {images.length === 0 ? (
            <p className="muted">No photos uploaded yet.</p>
          ) : (
            <div className="grid-auto">
              {images.map((image) => (
                <div key={image.id} className="thumb-wrap">
                  <Link to={`/images/${image.id}`}>
                    <img
                      className="image-grid-thumb"
                      src={image.url}
                      alt={image.caption || "Room inspection"}
                    />
                  </Link>
                  {image.caption && (
                    <p className="thumb-caption muted">{image.caption}</p>
                  )}
                  <button
                    className="btn btn-danger btn-small"
                    onClick={(e) => handleDeleteImage(e, image.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RoomDetails;
