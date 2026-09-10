import React, { useEffect, useState } from "react";
import apiClient from "../../api/client";
import "./InternetPlanCard.css";

const SessionHistoryModal = ({
    open,
    internetId,
    onClose,
}) => {

    const [loading, setLoading] = useState(false);

    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const getToday = () => {

        return new Date()
            .toISOString()
            .split("T")[0];

    };

    const getLast30Days = () => {

        const d = new Date();

        d.setDate(d.getDate() - 30);

        return d
            .toISOString()
            .split("T")[0];

    };

    const [startDate, setStartDate] = useState(getLast30Days());

    const [endDate, setEndDate] = useState(getToday());

    useEffect(() => {

        if (open) {

            loadSessions();

        }

    }, [open]);

    const loadSessions = async () => {

        setLoading(true);

        try {

            const { data } = await apiClient.get(
                `/customer/internet_session_history.php?internet_id=${internetId}&start_date=${startDate}&end_date=${endDate}`
            );

            if (data.status === 200) {

                setSessions(
                    data.results?.sessionList || []
                );

            } else {

                alert(data.message || "Unable to load sessions");

            }

        }
        catch {

            alert("Unable to load sessions");

        }

        setLoading(false);

    };

    if (!open) return null;

    const parseDataSize = (value) => {
        if (!value) return 0;

        const [num, unit] = value.split(" ");

        const n = parseFloat(num);

        switch ((unit || "").toUpperCase()) {
            case "KB":
                return n / 1024;

            case "MB":
                return n;

            case "GB":
                return n * 1024;

            case "TB":
                return n * 1024 * 1024;

            default:
                return 0;
        }
    };

    const formatDataSize = (mb) => {

        if (mb >= 1024 * 1024) {
            return `${(mb / (1024 * 1024)).toFixed(2)} TB`;
        }

        if (mb >= 1024) {
            return `${(mb / 1024).toFixed(2)} GB`;
        }

        return `${mb.toFixed(2)} MB`;
    };

    const summary = sessions.reduce(
        (acc, item) => {
            acc.upload += parseDataSize(item.upload_data);
            acc.download += parseDataSize(item.download_data);
            acc.total += parseDataSize(item.total_data);
            return acc;
        },
        {
            upload: 0,
            download: 0,
            total: 0,
        }
    );

    return (

        <div className="mac-modal-overlay">

            {/* Fixed 1400px max-width is fine on desktop, but on a phone
                it just means "as wide as the screen" anyway — the
                min(..., 95vw) keeps it from ever fighting the viewport. */}
            <div
                className="mac-modal"
                style={{
                    width: "95%",
                    maxWidth: "min(1400px, 95vw)"
                }}
            >

                <div className="mac-header">

                    <h2>
                        Internet Session History
                    </h2>

                    <button onClick={onClose}>
                        ✕
                    </button>

                </div>

                <div
                    style={{
                        padding: 20
                    }}
                >

                    <div
                        className="session-toolbar"
                    >

                        <div>

                            <label>
                                From
                            </label>

                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) =>
                                    setStartDate(
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                        <div>

                            <label>
                                To
                            </label>

                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) =>
                                    setEndDate(
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                        <button
                            className="internet-btn-primary"
                            onClick={loadSessions}
                            disabled={loading}
                        >
                            {loading
                                ? "Loading..."
                                : "Load Sessions"}
                        </button>

                    </div>

                    <div className="session-summary">

                        <div className="session-card">

                            <small>Total Sessions</small>

                            <h2>{sessions.length}</h2>

                        </div>

                        <div className="session-card">

                            <small>Upload</small>

                            <h2>{formatDataSize(summary.upload)}</h2>


                        </div>

                        <div className="session-card">

                            <small>Download</small>


                            <h2>{formatDataSize(summary.download)}</h2>


                        </div>

                        <div className="session-card">

                            <small>Total Usage</small>

                            <h2>{formatDataSize(summary.total)}</h2>

                        </div>

                    </div>

                    <div className="session-table-wrapper">

                        <table className="session-table">

                            <thead>

                                <tr>

                                    <th>Login Time</th>

                                    <th>End Time</th>

                                    <th>Login IP</th>

                                    <th>Package</th>

                                    <th>Upload</th>

                                    <th>Download</th>

                                    <th>Total</th>

                                    <th>Protocol</th>

                                    <th>Reason</th>

                                    <th>Details</th>

                                </tr>

                            </thead>

                            <tbody>

                                {sessions.length === 0 && (

                                    <tr>

                                        <td
                                            colSpan="10"
                                            data-label="No Sessions"
                                            style={{
                                                textAlign: "center"
                                            }}
                                        >

                                            No Sessions

                                        </td>

                                    </tr>

                                )}

                                {sessions.map((item, index) => (

                                    <tr key={index}>

                                        <td data-label="Login Time">
                                            {item.from_time}
                                        </td>

                                        <td data-label="End Time">
                                            {item.to_time}
                                        </td>

                                        <td data-label="Login IP">
                                            {item.login_ip_address}
                                        </td>

                                        <td data-label="Package">
                                            {item.package_name}
                                        </td>

                                        <td data-label="Upload">
                                            {item.upload_data}
                                        </td>

                                        <td data-label="Download">
                                            {item.download_data}
                                        </td>

                                        <td data-label="Total">
                                            {item.total_data}
                                        </td>

                                        <td data-label="Protocol">
                                            {item.protocol}
                                        </td>

                                        <td data-label="Reason">
                                            {item.termination_call}
                                        </td>

                                        <td data-label="Details">

                                            <button
                                                className="internet-btn-secondary"
                                                onClick={() => {

                                                    setSelectedSession(item);

                                                }}
                                            >

                                                View

                                            </button>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

            {selectedSession && (

                <div className="mac-modal-overlay">

                    <div
                        className="mac-modal"
                        style={{
                            maxWidth: 700
                        }}
                    >

                        <div className="mac-header">

                            <h2>Session Details</h2>

                            <button
                                onClick={() =>
                                    setSelectedSession(null)
                                }
                            >

                                ✕

                            </button>

                        </div>

                        <div style={{ padding: 20 }}>

                            <table className="details-table">

                                <tbody>

                                    <tr>

                                        <td>Username</td>

                                        <td>{selectedSession.username}</td>

                                    </tr>

                                    <tr>

                                        <td>Login Time</td>

                                        <td>{selectedSession.from_time}</td>

                                    </tr>

                                    <tr>

                                        <td>End Time</td>

                                        <td>{selectedSession.to_time}</td>

                                    </tr>

                                    <tr>

                                        <td>Login IP</td>

                                        <td>{selectedSession.login_ip_address}</td>

                                    </tr>

                                    <tr>

                                        <td>NAS IP</td>

                                        <td>{selectedSession.nas_ip_address}</td>

                                    </tr>

                                    <tr>

                                        <td>NAS Port</td>

                                        <td>{selectedSession.nas_port_id}</td>

                                    </tr>

                                    <tr>

                                        <td>Protocol</td>

                                        <td>{selectedSession.protocol}</td>

                                    </tr>

                                    <tr>

                                        <td>Package</td>

                                        <td>{selectedSession.package_name}</td>

                                    </tr>

                                    <tr>

                                        <td>Profile</td>

                                        <td>{selectedSession.profile_name}</td>

                                    </tr>

                                    <tr>

                                        <td>Upload</td>

                                        <td>{selectedSession.upload_data}</td>

                                    </tr>

                                    <tr>

                                        <td>Download</td>

                                        <td>{selectedSession.download_data}</td>

                                    </tr>

                                    <tr>

                                        <td>Total</td>

                                        <td>{selectedSession.total_data}</td>

                                    </tr>

                                    <tr>

                                        <td>Termination</td>

                                        <td>{selectedSession.termination_call}</td>

                                    </tr>

                                    <tr>

                                        <td>Session ID</td>

                                        <td>{selectedSession.session}</td>

                                    </tr>

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

};

export default SessionHistoryModal;