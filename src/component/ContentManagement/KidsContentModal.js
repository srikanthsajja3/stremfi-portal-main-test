import React, { useState } from "react";
import apiClient from "../../api/client";
import "./index.css";

const KidsContentModal = ({
  item,
  onClose
}) => {

  const [imageMode, setImageMode] =
    useState(
      item?.image_url
        ? "url"
        : "upload"
    );

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [formData, setFormData] =
    useState({
      id: item?.id || "",
      name: item?.name || "",
      image_url:
        item?.image_url || "",
      link: item?.link || "",
      ott_origin:
        item?.ott_origin || "",
      age_group:
        item?.age_group || "ALL",
      is_active:
        item?.is_active ?? 1
    });

  const handleChange = (e) => {

    const { name, value } =
      e.target;

    setFormData({
      ...formData,
      [name]: value
    });
  };

  const uploadImage = async () => {

    if (!selectedFile)
      return null;

    const uploadData =
      new FormData();

    uploadData.append(
      "image",
      selectedFile
    );

    const response =
      await apiClient.post(
        "/videos/upload_kids_image.php",
        uploadData
      );

    if (
      response.data.status
    ) {
      return response.data
        .image_url;
    }

    return null;
  };

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      try {

        let payload = {
          ...formData
        };

        if (
          imageMode ===
            "upload" &&
          selectedFile
        ) {

          const imageUrl =
            await uploadImage();

          if (!imageUrl) {
            alert(
              "Image upload failed"
            );
            return;
          }

          payload.image_url =
            imageUrl;
        }

        const response =
          await apiClient.post(
            "/videos/kids_content.php",
            payload
          );

        if (
          response.data.status
        ) {

          alert(
            response.data
              .message
          );

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
            ? "Edit Kids Content"
            : "Add Kids Content"}
        </h3>

        <form
          onSubmit={
            handleSubmit
          }
        >

          <input
            name="name"
            placeholder="Name"
            value={
              formData.name
            }
            onChange={
              handleChange
            }
            required
          />

          <div className="form-group-ott">

            <label>
              Image Source
            </label>

            <div className="radio-group-ott">

              <label>
                <input
                  type="radio"
                  checked={
                    imageMode ===
                    "upload"
                  }
                  onChange={() =>
                    setImageMode(
                      "upload"
                    )
                  }
                />
                Upload
              </label>

              <label>
                <input
                  type="radio"
                  checked={
                    imageMode ===
                    "url"
                  }
                  onChange={() =>
                    setImageMode(
                      "url"
                    )
                  }
                />
                URL
              </label>

            </div>

          </div>

          {imageMode ===
          "upload" ? (
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setSelectedFile(
                  e.target
                    .files[0]
                )
              }
            />
          ) : (
            <input
              name="image_url"
              placeholder="Image URL"
              value={
                formData.image_url
              }
              onChange={
                handleChange
              }
            />
          )}

          {selectedFile && (
            <img
              src={URL.createObjectURL(
                selectedFile
              )}
              alt=""
              className="preview-image-ott"
            />
          )}

          <input
            name="link"
            placeholder="Content Link"
            value={
              formData.link
            }
            onChange={
              handleChange
            }
          />

          <input
            name="ott_origin"
            placeholder="OTT Origin"
            value={
              formData.ott_origin
            }
            onChange={
              handleChange
            }
          />

          <select
            name="age_group"
            value={
              formData.age_group
            }
            onChange={
              handleChange
            }
          >
            <option value="ALL">
              ALL
            </option>
            <option value="3+">
              3+
            </option>
            <option value="7+">
              7+
            </option>
            <option value="13+">
              13+
            </option>
          </select>

          <select
            name="is_active"
            value={
              formData.is_active
            }
            onChange={
              handleChange
            }
          >
            <option value="1">
              Active
            </option>

            <option value="0">
              Inactive
            </option>
          </select>

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
              onClick={
                onClose
              }
            >
              Cancel
            </button>

          </div>

        </form>

      </div>
    </div>
  );
};

export default KidsContentModal;