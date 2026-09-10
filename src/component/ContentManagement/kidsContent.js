import React, { useEffect, useState } from "react";
import Header from "../Header";
import apiClient from "../../api/client";
import KidsContentModal from "./KidsContentModal";
import { toast } from "react-toastify";
import "./index.css";

const KidsContent = () => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [ottOriginFilter, setOttOriginFilter] = useState("all");
  const [ageGroupFilter, setAgeGroupFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchContent = async () => {
    try {
      setLoading(true);

      const response = await apiClient.get("/videos/kids_content.php");

      if (response.data.status) {
        setContents(response.data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleAdd = () => {
    setSelectedItem(null);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this content?")) return;

    try {
      const response = await apiClient.delete(`/videos/kids_content.php?id=${id}`);

      if (response.data.status) {
        toast.success("Content deleted successfully");
        fetchContent();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete content");
    }
  };

  const ottOrigins = [
    ...new Set(
      contents
        .map((item) => item.ott_origin)
        .filter(Boolean)
    )
  ];

  const filteredData = contents
    .filter((item) =>
      item.name
        ?.toLowerCase()
        .includes(search.toLowerCase())
    )
    .filter((item) =>
      ottOriginFilter === "all"
        ? true
        : item.ott_origin === ottOriginFilter
    )
    .filter((item) =>
      ageGroupFilter === "all"
        ? true
        : item.age_group === ageGroupFilter
    )
    .filter((item) =>
      statusFilter === "all"
        ? true
        : Number(item.is_active) === Number(statusFilter)
    );

  return (
    <>
      <Header />

      <div className="content-page">

        <div className="content-header">
          <h2>Kids Content Management</h2>

          <button
            className="add-btn"
            onClick={handleAdd}
          >
            + Add Content
          </button>
        </div>

        <div className="filters-row">

          <input
            type="text"
            placeholder="Search content..."
            className="search-input"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          <select
            className="filter-select"
            value={ottOriginFilter}
            onChange={(e) =>
              setOttOriginFilter(e.target.value)
            }
          >
            <option value="all">
              All OTT Origins
            </option>

            {ottOrigins.map((origin) => (
              <option
                key={origin}
                value={origin}
              >
                {origin}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={ageGroupFilter}
            onChange={(e) =>
              setAgeGroupFilter(e.target.value)
            }
          >
            <option value="all">
              All Ages
            </option>

            <option value="ALL">ALL</option>
            <option value="3+">3+</option>
            <option value="7+">7+</option>
            <option value="13+">13+</option>
          </select>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
          >
            <option value="all">
              All Status
            </option>

            <option value="1">
              Active
            </option>

            <option value="0">
              Inactive
            </option>
          </select>

        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="table-wrapper">

            <table className="operator-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Image</th>
                  <th>Name</th>
                  <th>OTT Origin</th>
                  <th>Link</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredData.map((item) => (
                  <tr key={item.id}>

                    <td>{item.id}</td>

                    <td>
                      <img
                        src={item.image_url}
                        alt=""
                        width="60"
                      />
                    </td>

                    <td>{item.name.length > 30 ? item.name.substring(0, 30) + "..." : item.name}</td>

                    <td>
                      {item.ott_origin}
                    </td>

                    <td>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item.link}
                      </a>
                    </td>

                    <td>

                      <button
                        className="edit-btn"
                        onClick={() =>
                          handleEdit(item)
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() =>
                          handleDelete(item.id)
                        }
                      >
                        Delete
                      </button>

                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

        {showModal && (
          <KidsContentModal
            item={selectedItem}
            onClose={() => {
              setShowModal(false);
              fetchContent();
            }}
          />
        )}

      </div>
    </>
  );
};

export default KidsContent;