import React, { useState } from "react";
import apiClient from '../../api/client';
import "./index.css";

const OTTContentModal = ({
  item,
  onClose,
}) => {

  const [selectedType, setSelectedType] = useState(
    item?.type || null
  );

  const [formData, setFormData] = useState({
    id: item?.id || "",
    name: item?.name || "",
    image: item?.image || "",
    thumbnail: item?.thumbnail || "",
    link: item?.link || "",
    type: item?.type || "movie",
    ottType: item?.ottType || "",
    ottOrigin: item?.ottOrigin || "Default",
    sso: item?.sso || "noSSO",
    category: item?.category || "",
    order_number: item?.order_number || 0,
    episode_time: item?.episode_time || "",
    episode_end_time:
      item?.episode_end_time || ""
  });

  const [imageMode, setImageMode] = useState(
    item?.image ? "url" : "upload"
  );

  const [selectedFile, setSelectedFile] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
        ...prev,
        [name]: value,

        // Auto copy image URL to thumbnail
        ...(name === "image"
        ? { thumbnail: value }
        : {})
    }));
    };

  const handleTypeSelection = (type) => {
    setSelectedType(type);

    setFormData(prev => ({
        ...prev,
        type,
        category: type,
        ottOrigin: "Default",
        sso: "noSSO"
    }));
  };

  const uploadImage = async () => {

  if (!selectedFile) return null;

  const uploadData = new FormData();

  uploadData.append(
    "image",
    selectedFile
  );

  const response =
    await apiClient.post(
      "/videos/upload_ott_image.php",
      uploadData
    );

    if (response.data.status) {
        return response.data.image_url;
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {

        let payload = {
        ...formData
        };

        // Upload image first if Upload mode selected
        if (imageMode === "upload" && selectedFile) {

            const uploadedImage = await uploadImage();

            if (!uploadedImage) {
                alert("Image upload failed");
                return;
            }

            payload.image = uploadedImage;
            payload.thumbnail = uploadedImage;
        }

    const response = await apiClient.post(
        "/videos/ott_content.php",
        payload
        );

        if (response.data.status) {
        alert(response.data.message);
        onClose();
        } else {
        alert(response.data.message);
        }

    } catch (error) {
        console.error(error);

        alert(
        error?.response?.data?.message ||
        "Something went wrong"
        );
    }
  };

  // Show type selection first when adding new content
if (!item && !selectedType) {
  return (
    <div className="modal-ott-overlay">
      <div className="type-selector-modal-ott">
        <h2>Select Content Type</h2>

        <div className="type-buttons-ott">
          <button
            type="button"
            onClick={() => handleTypeSelection("movie")}
          >
            Movie
          </button>

          <button
            type="button"
            onClick={() => handleTypeSelection("serial")}
          >
            Serial
          </button>

          <button
            type="button"
            onClick={() => handleTypeSelection("show")}
          >
            Show
          </button>

          <button
            type="button"
            onClick={() => handleTypeSelection("sport")}
          >
            Sport
          </button>

          <button
            type="button"
            onClick={() => handleTypeSelection("live")}
          >
            Live
          </button>
        </div>

        <button
          type="button"
          className="cancel-btn-ott"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

return (
  <div className="modal-ott-overlay">
    <div className="modal-ott">

      <h3>
        {item ? "Edit Content" : "Add Content"} - <span className="content-type-badge-ott">{selectedType.toUpperCase()}</span>
      </h3>

      <form onSubmit={handleSubmit}>

        <input
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <div className="form-group-ott">
          <label>Image Source</label>

          <div className="radio-group-ott">
            <label>
              <input
                type="radio"
                checked={imageMode === "upload"}
                onChange={() => setImageMode("upload")}
              />
              Upload
            </label>

            <label>
              <input
                type="radio"
                checked={imageMode === "url"}
                onChange={() => setImageMode("url")}
              />
              URL
            </label>
          </div>
        </div>

        {imageMode === "upload" ? (
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setSelectedFile(e.target.files[0])
            }
          />
        ) : (
          <input
            type="text"
            name="image"
            placeholder="Image URL"
            value={formData.image}
            onChange={handleChange}
          />
        )}

        {imageMode === "upload" && selectedFile && (
          <img
            src={URL.createObjectURL(selectedFile)}
            alt="Preview"
            className="preview-image-ott"
          />
        )}

        {imageMode === "url" && formData.image && (
          <img
            src={formData.image}
            alt="Preview"
            className="preview-image-ott"
          />
        )}

        <input
          name="link"
          placeholder="Content Link"
          value={formData.link}
          onChange={handleChange}
        />

        <input
          name="ottType"
          placeholder="OTT Type"
          value={formData.ottType}
          onChange={handleChange}
        />

        <input
          name="order_number"
          type="number"
          placeholder="Order Number"
          value={formData.order_number}
          onChange={handleChange}
        />

        <div className="modal-buttons-ott">
          <button
            type="submit"
            className="save-btn-ott"
          >
            Save
          </button>

          <button
            type="button"
            className="cancel-btn-ott"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>

      </form>

    </div>
  </div>
);
}

export default OTTContentModal;