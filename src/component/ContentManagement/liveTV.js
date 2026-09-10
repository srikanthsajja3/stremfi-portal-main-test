import React, { useEffect, useState } from "react";
import Header from "../Header";
import apiClient from "../../api/client";
import LiveTVModal from "./LiveTVModal";
import "./index.css";

const LiveTV = () => {

  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [playerFilter, setPlayerFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("asc");

  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [sortField, setSortField] = useState("channelNumber");
  const [selectedTable, setSelectedTable] = useState("tv_channels");

  const fetchChannels = async () => {

    try {

      setLoading(true);

      const response = await apiClient.get(
        `/videos/tv_channels.php?table=${selectedTable}`
      );

      if (response.data.status) {
        setChannels(response.data.data);
      }

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, [selectedTable]);

  const handleAdd = () => {
    setSelectedItem(null);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {

    if (!window.confirm("Delete channel?")) {
      return;
    }

    try {

      const response = await apiClient.delete(
        `/videos/tv_channels.php?table=${selectedTable}&id=${id}`
      );

      if (response.data.status) {
        fetchChannels();
      }

    } catch (error) {
      console.error(error);
    }
  };

  const categories = [
    ...new Set(
      channels.map(c => c.category).filter(Boolean)
    )
  ];

  const languages = [
    ...new Set(
      channels.map(c => c.language).filter(Boolean)
    )
  ];

  const players = [
    ...new Set(
      channels.map(c => c.player).filter(Boolean)
    )
  ];

  const filteredData = channels
    .filter(channel =>
      channel.name
        ?.toLowerCase()
        .includes(search.toLowerCase())
    )
    .filter(channel =>
      categoryFilter === "all"
        ? true
        : channel.category === categoryFilter
    )
    .filter(channel =>
      languageFilter === "all"
        ? true
        : channel.language === languageFilter
    )
    .filter(channel =>
      playerFilter === "all"
        ? true
        : channel.player === playerFilter
    )
    .sort((a, b) => {

    const aValue =
        Number(a[sortField]) || 0;

    const bValue =
        Number(b[sortField]) || 0;

    return sortOrder === "asc"
        ? aValue - bValue
        : bValue - aValue;
    });

  return (
    <>
      <Header />

      <div className="content-page">

        <div className="content-header">

          <h2>Live TV Channels</h2>
          
          <div className="select-table-group">
            <label className="select-filter-table">Select Table:  </label>
            <select
                className="filter-select"
                value={selectedTable}
                onChange={(e) =>
                    setSelectedTable(e.target.value)
                }
                >
                <option value="tv_channels">
                    Local Channels
                </option>

                <option value="pay_channels_wp30">
                    WP30
                </option>

                <option value="pay_channels_wp99">
                    WP99
                </option>
            </select>
          </div>

          <button
            className="add-btn"
            onClick={handleAdd}
          >
            + Add Channel
          </button>

        </div>

        <div className="filters-row">

          <input
            type="text"
            placeholder="Search Channel..."
            className="search-input"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          <select
            className="filter-select"
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value)
            }
          >
            <option value="all">
              All Categories
            </option>

            {categories.map(cat => (
              <option
                key={cat}
                value={cat}
              >
                {cat}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={languageFilter}
            onChange={(e) =>
              setLanguageFilter(e.target.value)
            }
          >
            <option value="all">
              All Languages
            </option>

            {languages.map(lang => (
              <option
                key={lang}
                value={lang}
              >
                {lang}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={playerFilter}
            onChange={(e) =>
              setPlayerFilter(e.target.value)
            }
          >
            <option value="all">
              All Players
            </option>

            {players.map(player => (
              <option
                key={player}
                value={player}
              >
                {player}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={sortField}
            onChange={(e) =>
                setSortField(e.target.value)
            }
            >
            <option value="channelNumber">
                VRPLAY Channel No
            </option>

            <option value="launcherChannelNumber">
                Launcher Channel No
            </option>

            <option value="gsrChannelNumber">
                GSR Channel No
            </option>

            <option value="sitiplayChannelNumber">
                SitiPlay Channel No
            </option>
          </select>

          <select
            className="filter-select"
            value={sortOrder}
            onChange={(e) =>
                setSortOrder(e.target.value)
            }
            >
            <option value="asc">
                Ascending ↑
            </option>

            <option value="desc">
                Descending ↓
            </option>
          </select>

        </div>

        {loading ? (
          <p className="loading">Loading...</p>
        ) : (

          <div className="table-wrapper">

            <table className="operator-table">

              <thead>
                <tr>
                  <th>ID</th>  
                  <th>Logo</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Language</th>
                  <th>Player</th>
                  <th>VRPLAY Channel No</th>
                  <th>Launcher Channel No</th>
                  <th>GSR Channel No</th>
                  <th>SitiPlay Channel No</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredData.map((channel, index) => (
                    

                  <tr key={channel.id}>

                    <td>{index + 1}</td>
                    <td>
                      <img
                        src={channel.imageUrl}
                        alt=""
                        width="60"
                      />
                    </td>

                    <td>{channel.name}</td>

                    <td>{channel.category}</td>

                    <td>{channel.language}</td>

                    <td>{channel.player}</td>

                    <td>
                        {channel.launcherChannelNumber}
                    </td>
                    <td>
                      {channel.channelNumber || channel.channelnumber}
                    </td>
                    <td>
                      {channel.gsrChannelNumber}
                    </td>
                    <td>
                      {channel.sitiplayChannelNumber}
                    </td>

                    <td>

                      <button
                        className="edit-btn"
                        onClick={() =>
                          handleEdit(channel)
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() =>
                          handleDelete(channel.id)
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
          <LiveTVModal
            item={selectedItem}
            onClose={() => {
              setShowModal(false);
              fetchChannels();
            }}
            selectedTable={selectedTable}
          />
        )}

      </div>
    </>
  );
};

export default LiveTV;