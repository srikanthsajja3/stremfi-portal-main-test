import React, { useEffect, useState, useContext } from "react";
import { UserContext } from "../UserContext";
import apiClient from "../../api/client";
import "./index.css";
import Header from "../Header";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const OperatorChannelManager = ({ operatorId }) => {
  const { user } = useContext(UserContext);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderSticky(window.scrollY > 120);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/get_operator_channel_mapping.php');

      if (res.data.success && Array.isArray(res.data.channels)) {
        setChannels(res.data.channels);
      } else {
        setChannels([]);
        toast.error(res.data.message || "No channels found");
      }
    } catch {
      toast.error("Failed to load channels");
    }
    setLoading(false);
  };

  const updateNumber = (index, value) => {
  const updated = [...channels];
  
  // Handle empty input
  if (value === "") {
    updated[index].channelNumber = 0;
    setChannels(updated);
    return;
  }
  
  // Remove leading zeros and convert to number
  const cleaned = value.toString().replace(/^0+/, "");
  updated[index].channelNumber = cleaned === "" ? 0 : Number(cleaned);
  
  setChannels(updated);
};

// Format number for display (show as string to preserve input behavior)
const formatChannelNumber = (num) => {
  return num.toString();
};

  /* DUPLICATE DETECTOR */
  const duplicates = (() => {
    const map = {};
    channels.forEach(c => {
      if (c.channelNumber > 0) {
        map[c.channelNumber] = (map[c.channelNumber] || 0) + 1;
      }
    });

    return channels.map(
      c => c.channelNumber > 0 && map[c.channelNumber] > 1
    );
  })();

  /* SAVE */
  const saveChannels = async () => {

    if (duplicates.some(d => d)) {
      toast.error("Same channel number assigned to multiple channels");
      return;
    }

    const payload = {
      operatorId,
      channels: channels.map(c => ({
        channel_id: c.id,
        number: Number(c.channelNumber)
      }))
    };

    try {
      const res = await apiClient.post('/save_operator_channel_mapping.php', payload);

      if (res.data.success) {
        toast.success("Channel order saved successfully");
        fetchChannels();
      } else {
        toast.error(res.data.message || "Failed to save channel");
      }
    } catch {
      toast.error("Error saving channel order");
    }
  };

  const getChannelColumns = () => {
    const perCol = Math.ceil(channels.length / 3);
    return [
      channels.slice(0, perCol),
      channels.slice(perCol, perCol * 2),
      channels.slice(perCol * 2)
    ];
  };

  const channelColumns = getChannelColumns();

  return (
    <>
      <Header />
      <div className="ocm-wrapper">

        <div className={`ocm-floating-header ${isHeaderSticky ? "ocm-sticky" : ""}`}>
          <div className="ocm-header-content">
            <h2>Operator Channel Manager</h2>
            <button onClick={saveChannels} className="ocm-save-btn">
              Save Channel Order
            </button>
          </div>
        </div>

        <div className="ocm-content">

          {/* MOBILE TABLE */}
          <div className="ocm-table-wrapper ocm-mobile-view">
            <table className="ocm-table">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Number</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((c, i) => (
                  <tr
                    key={c.id}
                    style={{ background: duplicates[i] ? "#ffe5e5" : "" }}
                  >
                    <td>{c.name}</td>
                    <td>
                      <input
                        type="number"
                        value={formatChannelNumber(c.channelNumber)}
                        onChange={e => updateNumber(i, e.target.value)}
                        className="ocm-number-input"
                      />
                      <button
                        onClick={() => updateNumber(i, 0)}
                        className="ocm-disable-btn"
                      >
                        Disable
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* COLUMN VIEW */}
          <div className="ocm-columns-view"> 
            {channelColumns.map((col, ci) => (
              <div key={ci} className="ocm-column">
                {/* Laptop Header */}
                <div className="ocm-columns-header">
                  <span>Channel</span>
                  <span>Number</span>
                </div>
                {col.map(c => {
                  const idx = channels.findIndex(x => x.id === c.id);
                  return (
                    <div
                      key={c.id}
                      className="ocm-column-row"
                      style={{ background: duplicates[idx] ? "#ffe5e5" : "" }}
                    >
                      <span>{c.name}</span>
                      <div>
                      <input
                        type="number"
                        value={formatChannelNumber(c.channelNumber)}
                        onChange={e => updateNumber(idx, e.target.value)}
                        className="ocm-number-input"
                      />
                      <button
                        onClick={() => updateNumber(idx, 0)}
                        className="ocm-disable-btn"
                      >
                        ✕
                      </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
};

export default OperatorChannelManager;
