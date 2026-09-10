import React, { useEffect, useState } from "react";
import Header from "../Header";
import Footer from "../Footer";
import apiClient from '../../api/client';
import OTTContentModal from "./OTTContentModal";
import { toast } from "react-toastify";
import "./index.css";

const OTTContent = () => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [ottTypeFilter, setOttTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("asc");

  const fetchContent = async () => {
    try {
      setLoading(true);

      const response = await apiClient.get("/videos/ott_content.php");

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

  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this content?")) return;

    try {
      const response = await apiClient.delete(`/videos/ott_content.php?id=${id}`);

      if (response.data.status) {
        fetchContent();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const ottTypes = [
    ...new Set(
        contents
        .map(item => item.ottType)
        .filter(Boolean)
    )
  ];

  const filteredData = contents
    .filter((item) =>
        item.name?.toLowerCase().includes(
        search.toLowerCase()
        )
    )
    .filter((item) =>
        ottTypeFilter === "all"
        ? true
        : item.ottType === ottTypeFilter
    )
    .sort((a, b) => {
        if (sortOrder === "asc") {
        return Number(a.order_number) - Number(b.order_number);
        }

        return Number(b.order_number) - Number(a.order_number);
    });

  return (
    <>
      <Header />

      <div className="content-page">

        <div className="content-header">
          <h2>OTT Content</h2>

          <button
            className="add-btn"
            onClick={handleAdd}
          >
            + Add Content
          </button>

          <div className="filters-row">

            <input
                type="text"
                placeholder="Search content..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
            />

            <select
                className="filter-select"
                value={ottTypeFilter}
                onChange={(e) =>
                setOttTypeFilter(e.target.value)
                }
            >
                <option value="all">
                All OTT Types
                </option>

                {ottTypes.map((type) => (
                <option
                    key={type}
                    value={type}
                >
                    {type}
                </option>
                ))}
            </select>

            <select
                className="filter-select"
                value={sortOrder}
                onChange={(e) =>
                setSortOrder(e.target.value)
                }
            >
                <option value="asc">
                Order Ascending
                </option>

                <option value="desc">
                Order Descending
                </option>
            </select>

            </div>
        </div>

        {loading ? (
          <p className="loading">Loading...</p>
        ) : (
          <div className="table-wrapper">
            <table className="operator-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>OTT Type</th>
                  <th>Url</th>
                  <th>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>

                    <td>
                      <img
                        src={item.image}
                        alt=""
                        width="60"
                      />
                    </td>

                    <td>{item.name}</td>
                    <td>{item.type}</td>
                    <td>{item.ottType}</td>
                    <td><a href={item.link} target="_blank" rel="noopener noreferrer">
                      {item.link}
                    </a></td>
                    <td>{item.order_number}</td>

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
          <OTTContentModal
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

export default OTTContent;