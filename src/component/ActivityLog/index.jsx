import React, { useState, useEffect, useCallback } from "react";
import Header from "../Header";
import apiClient from "../../api/client";
import { toast } from "react-toastify";
import "./index.css";

const ACTIONS = [
  { value: "", label: "All actions" },
  { value: "login", label: "Login" },
  { value: "add_balance", label: "Add Balance" },
  { value: "impersonate", label: "Impersonate" },
  { value: "change_password", label: "Change Password" },
  { value: "set_wallet_password", label: "Set Wallet Password" },
];

const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "success", label: "Success" },
  { value: "failure", label: "Failure" },
  { value: "blocked", label: "Blocked" },
];

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(false);

  const [action, setAction] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [expandedRow, setExpandedRow] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (action) params.set("action", action);
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const { data } = await apiClient.get(`/get_activity_log.php?${params.toString()}`);
      if (data.status === "success") {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      } else {
        toast.error(data.error || "Failed to load activity log");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to load activity log");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, action, status, search, from, to]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (setter) => (e) => {
    setPage(1);
    setter(e.target.value);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <>
      <Header />
      <div className="activity-log-container">
        <h1>Activity Log</h1>
        <p className="activity-log-subtitle">
          Every login, wallet credit, impersonation, and recharge — who did it, from what IP, and what happened.
        </p>

        <div className="activity-log-filters">
          <select value={action} onChange={handleFilterChange(setAction)}>
            {ACTIONS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>

          <select value={status} onChange={handleFilterChange(setStatus)}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search username or details..."
            value={search}
            onChange={handleFilterChange(setSearch)}
          />

          <input
            type="datetime-local"
            value={from}
            onChange={handleFilterChange(setFrom)}
            title="From"
          />
          <input
            type="datetime-local"
            value={to}
            onChange={handleFilterChange(setTo)}
            title="To"
          />

          <button className="activity-log-refresh" onClick={fetchLogs} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="activity-log-table-wrapper">
          <table className="activity-log-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Role</th>
                <th>Action</th>
                <th>Status</th>
                <th>Target</th>
                <th>IP Address</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: 20 }}>
                    No activity found for this filter.
                  </td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id}>
                  <td data-label="Time">{log.created_at}</td>
                  <td data-label="User">{log.username || "—"}</td>
                  <td data-label="Role">{log.role || "—"}</td>
                  <td data-label="Action">{log.action}</td>
                  <td data-label="Status">
                    <span className={`activity-log-status activity-log-status--${log.status}`}>
                      {log.status}
                    </span>
                  </td>
                  <td data-label="Target">{log.target_id ?? "—"}</td>
                  <td data-label="IP Address">{log.ip_address || "—"}</td>
                  <td data-label="Details">
                    {log.details ? (
                      <button
                        className="activity-log-details-btn"
                        onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                      >
                        {expandedRow === log.id ? "Hide" : "View"}
                      </button>
                    ) : (
                      "—"
                    )}
                    {expandedRow === log.id && log.details && (
                      <pre className="activity-log-details-pre">
                        {typeof log.details === "string" ? log.details : JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="activity-log-pagination">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span>
            Page {page} of {totalPages} ({total} total)
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default ActivityLog;
