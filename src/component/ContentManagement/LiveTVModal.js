import React, { useState } from "react";
import apiClient from "../../api/client";
import "./index.css";
import { toast } from "react-toastify";

const categories = [
  "News",
  "Devotional",
  "Entertainment",
  "Music",
  "Infotainment",
  "Sports",
  "Educational",
  "Lifestyle",
  "Religious",
  "Cooking",
  "Kids"
];

const languages = [
  "Telugu",
  "Marathi",
  "Urdu",
  "Hindi",
  "English",
  "Punjabi",
  "Other Regional",
  "Tamil",
  "Malayalam",
  "Kannada",
  "Assamese",
  "Bengali",
  "Bhojpuri",
  "Others",
  "Rajasthani",
  "Gujarati",
  "Odia"
];

const LiveTVModal = ({item, onClose, selectedTable}) => {
  const [imageMode, setImageMode] = useState(item?.imageUrl ? "url" : "upload");
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] =
    useState({
      id: item?.id || "",
      name: item?.name || "",
      imageUrl: item?.imageUrl || "",
      channelUrl: item?.channelUrl || "",
      category: item?.category || "",
      language: item?.language || "",
      player: item?.player || "internal",
      launcherChannelNumber:
        item?.launcherChannelNumber || 0,
      channelNumber:
        item?.channelNumber || 0,
      gsrChannelNumber:
        item?.gsrChannelNumber || 0,
      sitiplayChannelNumber:
        item?.sitiplayChannelNumber || 0
    });

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value
    });
  };

  const uploadImage = async () => {

  if (!selectedFile) return null;

  const uploadData = new FormData();

    uploadData.append(
      "image",
      selectedFile
    );

    const response = await apiClient.post(
      "/videos/upload_channel_image.php",
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

      if (
        imageMode === "upload" &&
        selectedFile
      ) {

        const uploadedImage =
          await uploadImage();

        if (!uploadedImage) {
          toast.error("Image upload failed");
          return;
        }

        payload.imageUrl = uploadedImage;
      }

      const response =
        await apiClient.post(
          `/videos/tv_channels.php?table=${selectedTable}`,
          payload
        );

      if (response.data.status) {
        toast.success(response.data.message);
        onClose();
      }

    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="modal-ott-overlay">

      <div className="modal-ott">

        <h3>
          {item
            ? "Edit Channel"
            : "Add Channel"}
        </h3>

        <form onSubmit={handleSubmit}>

          <input
            name="name"
            placeholder="Channel Name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <input
            name="channelUrl"
            placeholder="Channel URL"
            value={formData.channelUrl}
            onChange={handleChange}
            required
          />

          <div className="form-group-ott">
            <label>Channel Logo</label>
            <div className="radio-group-ott">
              <label>
                <input
                  type="radio"
                  checked={imageMode === "upload"}
                  onChange={() =>
                    setImageMode("upload")
                  }
                />
                Upload
              </label>

              <label>
                <input
                  type="radio"
                  checked={imageMode === "url"}
                  onChange={() =>
                    setImageMode("url")
                  }
                />
                Image URL
              </label>
            </div>
          </div>

          {imageMode === "upload" ? (
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setSelectedFile(
                  e.target.files[0]
                )
              }
            />

          ) : (

            <input
              type="text"
              name="imageUrl"
              placeholder="Channel Logo URL"
              value={formData.imageUrl}
              onChange={handleChange}
            />

          )}

          {imageMode === "upload" &&
            selectedFile && (

              <img
                src={URL.createObjectURL(
                  selectedFile
                )}
                alt="Preview"
                className="preview-image-ott"
              />

            )}

            {imageMode === "url" &&
            formData.imageUrl && (

              <img
                src={formData.imageUrl}
                alt="Preview"
                className="preview-image-ott"
              />

            )}

          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="">
              Select Category
            </option>

            {categories.map(category => (
              <option
                key={category}
                value={category}
              >
                {category}
              </option>
            ))}
          </select>

          <select
            name="language"
            value={formData.language}
            onChange={handleChange}
          >
            <option value="">
              Select Language
            </option>

            {languages.map(language => (
              <option
                key={language}
                value={language}
              >
                {language}
              </option>
            ))}
          </select>

          <select
            name="player"
            value={formData.player}
            onChange={handleChange}
          >
            <option value="internal">
              Internal
            </option>
            <option value="external">
              External
            </option>
            <option value="sunnxt">
              Sunnxt
            </option>
            <option value="z5">
              Z5
            </option>
            <option value="youtube">
              Youtube
            </option>
          </select>

          <div className="input-group">
            <label className="channel-number-label">VRPlay Launcher Channel Number:</label>  
            <input
              name="launcherChannelNumber"
              type="number"
              placeholder="Launcher No"
              value={formData.launcherChannelNumber}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label className="channel-number-label">VRPlay Channel Number:</label>  
            <input
              name="channelNumber"
              type="number"
              placeholder="Channel No"
              value={formData.channelNumber}
              onChange={handleChange}
            />
          </div>  

          <div className="input-group">
            <label className="channel-number-label">GSR Channel Number:</label>  
          <input
            name="gsrChannelNumber"
            type="number"
            placeholder="GSR No"
            value={formData.gsrChannelNumber}
            onChange={handleChange}
          />
          </div>

          <div className="input-group">
            <label className="channel-number-label">SitiPlay Channel Number:</label>  
          <input
            name="sitiplayChannelNumber"
            type="number"
            placeholder="SitiPlay No"
            value={formData.sitiplayChannelNumber}
            onChange={handleChange}
          />
          </div>

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
};

export default LiveTVModal;