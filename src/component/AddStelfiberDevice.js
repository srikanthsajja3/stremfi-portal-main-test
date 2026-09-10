import React, { useEffect, useState, useContext } from "react";
import { UserContext } from "./UserContext";
import apiClient from "../api/client";
import Header from "../FormHeader";
import { toast } from "react-toastify";
import { 
  FiPlus, FiSearch, FiRefreshCw, FiTrash2, 
  FiWifi, FiUser, FiCheckCircle, FiXCircle,
  FiChevronRight, FiFilter, FiDownload
} from "react-icons/fi";

export default function AddStelfiberDevice() {
  const { user } = useContext(UserContext);

  const [devices, setDevices] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("add");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [form, setForm] = useState({
    device_mac: "",
    operator_id: "",
    remarks: ""
  });

  // ================= FETCH OPERATORS =================
  const fetchOperators = async () => {
    try {
      const { data } = await apiClient.get('/operator_api.php');
      setOperators(data.operators || []);
    } catch {
      toast.error("Network error loading operators");
    }
  };

  // ================= FETCH DEVICES =================
  const fetchDevices = async () => {
    try {
      const { data } = await apiClient.get('/stelfiber_devices.php');
      if (data.success) setDevices(data.devices);
    } catch (error) {
      toast.error("Failed to load devices");
    }
  };

  useEffect(() => {
    fetchOperators();
    fetchDevices();
  }, []);

  // ================= ADD DEVICE =================
  const addDevice = async () => {
    if (!form.device_mac || !form.operator_id) {
      toast.error("MAC address and Operator are required");
      return;
    }

    setLoading(true);

    // validateStatus: this call has no surrounding try/catch (matches the
    // original), so keep axios from throwing on a non-2xx response.
    const { data } = await apiClient.post(
      '/stelfiber_devices.php',
      form,
      { validateStatus: () => true }
    );

    if (data.success) {
      toast.success("Device registered successfully!");
      setForm({ device_mac: "", operator_id: "", remarks: "" });
      fetchDevices();
      setActiveTab("view");
    } else {
      toast.error(data.message || "Failed to register device");
    }

    setLoading(false);
  };

  // ================= DELETE DEVICE =================
  const deleteDevice = async (id) => {
    if (!window.confirm("Are you sure you want to delete this device?")) return;

    try {
      const { data } = await apiClient.delete(`/stelfiber_devices.php?id=${id}`);

      if (data.success) {
        toast.success("Device deleted successfully!");
        fetchDevices();
      } else {
        toast.error(data.message || "Failed to delete device");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  // Filter devices based on search term and status
  const filteredDevices = devices.filter(device => {
    const matchesSearch = 
      device.device_mac.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.operator_id && device.operator_id.toString().includes(searchTerm)) ||
      (device.user_id && device.user_id.toString().includes(searchTerm));
    
    const matchesStatus = 
      selectedStatus === "all" || 
      (selectedStatus === "active" && device.is_active) ||
      (selectedStatus === "inactive" && !device.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const formatMAC = (mac) => {
    return mac.replace(/(.{2})/g, '$1:').slice(0, -1);
  };

  return (
    <div className="stel-fiber-container">
      <div className="glassmorphism-bg"></div>
      
      <Header />
      
      <main className="stel-main-content">
        {/* Header Section */}
        <div className="stel-header">
          <div className="stel-header-content">
            <div className="stel-title-section">
              <h1 className="stel-main-title">
                StelFiber Device Management
              </h1>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="stel-tab-nav">
          <button 
            className={`stel-tab-btn ${activeTab === "add" ? "active" : ""}`}
            onClick={() => setActiveTab("add")}
          >
            <FiPlus /> Register New Device
          </button>
          {user.role === "superadmin" && (
            <button 
              className={`stel-tab-btn ${activeTab === "view" ? "active" : ""}`}
              onClick={() => setActiveTab("view")}
            >
              <FiWifi /> View All Devices
            </button>
          )}
        </div>

        {/* Main Content Area */}
        <div className="stel-content-area">
          {activeTab === "add" && (
            <div className="stel-form-card">
              <div className="form-header">
                <h2><FiPlus /> Device Registration</h2>
                <p>Fill in the details to register a new StelFiber device</p>
              </div>
              
              <div className="form-grid">
                <div className="input-group">
                  <label>
                    <FiWifi /> MAC Address *
                  </label>
                  <div className="input-with-icon">
                    <input
                      type="text"
                      placeholder="Enter MAC address (e.g., AA:BB:CC:DD:EE:FF)"
                      value={form.device_mac}
                      onChange={e => setForm({ ...form, device_mac: e.target.value.toLowerCase() })}
                      className="stel-input"
                      maxLength="17"
                    />
                    <span className="input-icon">#</span>
                  </div>
                  <div className="input-hint">Format: XX:XX:XX:XX:XX:XX</div>
                </div>

                <div className="input-group">
                  <label>
                    <FiUser /> Operator *
                  </label>
                  <div className="input-with-icon">
                    <select
                      value={form.operator_id}
                      onChange={e => setForm({ ...form, operator_id: e.target.value })}
                      className="stel-select"
                    >
                      <option value="">Select an operator</option>
                      {operators.map(op => (
                        <option key={op.id} value={op.id}>
                          {op.operatorName} ({op.phoneNumber})
                        </option>
                      ))}
                    </select>
                    <span className="input-icon">↓</span>
                  </div>
                </div>

                <div className="input-group full-width">
                  <label>Remarks (Optional)</label>
                  <textarea
                    placeholder="Add any notes or comments about this device..."
                    value={form.remarks}
                    onChange={e => setForm({ ...form, remarks: e.target.value })}
                    className="stel-textarea"
                    rows="3"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  onClick={addDevice}
                  disabled={loading || !form.device_mac || !form.operator_id}
                  className={`stel-primary-btn ${loading ? 'loading' : ''}`}
                >
                  {loading ? (
                    <>
                      <div className="btn-spinner"></div>
                      Registering...
                    </>
                  ) : (
                    <>
                      <FiPlus /> Register Device
                    </>
                  )}
                </button>
                
                <button 
                  onClick={() => setForm({ device_mac: "", operator_id: "", remarks: "" })}
                  className="stel-secondary-btn"
                >
                  Clear Form
                </button>
              </div>
            </div>
          )}

          {activeTab === "view" && (
            <div className="devices-management-section">
              {/* Devices Header */}
              <div className="devices-header">
                
                <div className="devices-title">
                  <h2><FiWifi /> Registered Devices</h2>
                  <span className="device-count">{filteredDevices.length} devices found</span>
                </div>
                
                <div className="devices-controls">
                  <div className="search-container">
                    <FiSearch className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search devices..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm("")}
                        className="clear-search-btn"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  
                  <div className="filter-group">
                    <FiFilter />
                    <select 
                      value={selectedStatus}
                      onChange={e => setSelectedStatus(e.target.value)}
                      className="status-filter"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active Only</option>
                      <option value="inactive">Inactive Only</option>
                    </select>
                  </div>
                  
                  <button className="export-btn">
                    <FiDownload /> Export
                  </button>
                </div>
              </div>

              {/* Devices List */}
              {filteredDevices.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <FiWifi />
                  </div>
                  <h3>No Devices Found</h3>
                  <p>{searchTerm || selectedStatus !== "all" 
                    ? "Try adjusting your search or filters" 
                    : "No devices registered yet. Add your first device!"}
                  </p>
                  {!searchTerm && selectedStatus === "all" && (
                    <button 
                      onClick={() => setActiveTab("add")}
                      className="stel-primary-btn"
                    >
                      <FiPlus /> Register First Device
                    </button>
                  )}
                </div>
              ) : (
                <div className="devices-grid">
                  {filteredDevices.map(device => (
                    <div key={device.id} className="device-card">
                      <div className="device-card-header">
                        <div className="device-mac">
                          <FiWifi />
                          <span className="mac-value">{device.device_mac}</span>
                        </div>
                        <div className={`device-status ${device.is_active ? 'active' : 'inactive'}`}>
                          {device.is_active ? (
                            <>
                              <FiCheckCircle /> Active
                            </>
                          ) : (
                            <>
                              <FiXCircle /> Inactive
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="device-details">
                        <div className="detail-row">
                          <span className="detail-label">Device ID:</span>
                          <span className="detail-value">{device.id}</span>
                        </div>
                        
                        <div className="detail-row">
                          <span className="detail-label">Operator ID:</span>
                          <span className="detail-value">{device.operator_id || "—"}</span>
                        </div>
                        
                        <div className="detail-row">
                          <span className="detail-label">User ID:</span>
                          <span className="detail-value">{device.user_id || "Not Assigned"}</span>
                        </div>
                        
                        {device.remarks && (
                          <div className="detail-row">
                            <span className="detail-label">Remarks:</span>
                            <span className="detail-value remarks">{device.remarks}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="device-actions">
                        <button className="action-btn view-btn">
                          View Details <FiChevronRight />
                        </button>
                        <button 
                          onClick={() => deleteDevice(device.id)}
                          className="action-btn delete-btn"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      <style jsx>{`
        /* Base Styles */
        .stel-fiber-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          position: relative;
        }
        
        .glassmorphism-bg {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          z-index: -1;
        }
        
        .stel-main-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
        }
        
        /* Header Styles */
        .stel-header {
          margin-bottom: 30px;
        }
        
        .stel-header-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        @media (min-width: 768px) {
          .stel-header-content {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }
        
        .stel-title-section {
          color: white;
        }
        
        .stel-main-title {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 10px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .stel-title-icon {
          font-size: 32px;
        }
        
        .stel-subtitle {
          font-size: 16px;
          opacity: 0.9;
          margin: 0;
        }
        
        .stel-stats-cards {
          display: flex;
          gap: 15px;
        }
        
        .stat-card {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border-radius: 15px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          min-width: 180px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: transform 0.3s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-5px);
        }
        
        .stat-icon {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: white;
        }
        
        .total-devices {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .active-devices {
          background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
        }
        
        .stat-info h3 {
          color: white;
          font-size: 24px;
          margin: 0;
          font-weight: 700;
        }
        
        .stat-info p {
          color: rgba(255, 255, 255, 0.8);
          margin: 5px 0 0 0;
          font-size: 14px;
        }
        
        /* Tab Navigation */
        .stel-tab-nav {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        
        .stel-tab-btn {
          padding: 12px 24px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }
        
        .stel-tab-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }
        
        .stel-tab-btn.active {
          background: white;
          color: #667eea;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }
        
        .refresh-btn {
          margin-left: auto;
        }
        
        /* Content Area */
        .stel-content-area {
          background: white;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        
        /* Form Styles */
        .stel-form-card {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .form-header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .form-header h2 {
          font-size: 24px;
          color: #333;
          margin: 0 0 10px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        
        .form-header p {
          color: #666;
          margin: 0;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 25px;
          margin-bottom: 40px;
        }
        
        @media (min-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr 1fr;
          }
          
          .full-width {
            grid-column: span 2;
          }
        }
        
        .input-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #444;
          margin-bottom: 10px;
          font-size: 14px;
        }
        
        .input-with-icon {
          position: relative;
        }
        
        .stel-input, .stel-select, .stel-textarea {
          width: 100%;
          padding: 14px 20px 14px 45px;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          font-size: 16px;
          transition: all 0.3s ease;
          background: white;
        }
        
        .stel-textarea {
          padding: 14px 20px;
          resize: vertical;
          min-height: 100px;
        }
        
        .stel-input:focus, .stel-select:focus, .stel-textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .input-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #667eea;
          font-weight: bold;
        }
        
        .input-hint {
          font-size: 12px;
          color: #888;
          margin-top: 8px;
        }
        
        /* Button Styles */
        .form-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
          padding-top: 30px;
          border-top: 1px solid #eee;
        }
        
        .stel-primary-btn, .stel-secondary-btn {
          padding: 14px 28px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s ease;
          min-width: 180px;
        }
        
        .stel-primary-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
        }
        
        .stel-primary-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        
        .stel-primary-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .stel-secondary-btn {
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
        }
        
        .stel-secondary-btn:hover {
          background: #f8f9ff;
        }
        
        .btn-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* Devices Management Section */
        .devices-management-section {
          animation: fadeIn 0.5s ease;
        }
        
        .devices-header {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 30px;
        }
        
        @media (min-width: 1024px) {
          .devices-header {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }
        
        .devices-title {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .devices-title h2 {
          font-size: 22px;
          color: #333;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .device-count {
          background: #e3f2fd;
          color: #1976d2;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }
        
        .devices-controls {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }
        
        .search-container {
          position: relative;
          flex: 1;
          min-width: 250px;
        }
        
        .search-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #888;
        }
        
        .search-input {
          width: 100%;
          padding: 12px 20px 12px 45px;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          font-size: 15px;
          transition: all 0.3s ease;
        }
        
        .search-input:focus {
          outline: none;
          border-color: #667eea;
        }
        
        .clear-search-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: #eee;
          border: none;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }
        
        .filter-group {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 15px;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          color: #666;
        }
        
        .status-filter {
          border: none;
          padding: 10px 5px;
          font-size: 14px;
          background: transparent;
          color: #333;
          cursor: pointer;
        }
        
        .status-filter:focus {
          outline: none;
        }
        
        .export-btn {
          background: #f5f5f5;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          padding: 10px 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 600;
          color: #444;
          transition: all 0.3s ease;
        }
        
        .export-btn:hover {
          background: #eee;
        }
        
        /* Devices Grid */
        .devices-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }
        
        @media (max-width: 768px) {
          .devices-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .device-card {
          background: white;
          border-radius: 15px;
          padding: 20px;
          border: 1px solid #e0e0e0;
          transition: all 0.3s ease;
        }
        
        .device-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
          border-color: #667eea;
        }
        
        .device-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #f5f5f5;
        }
        
        .device-mac {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }
        
        .mac-value {
          font-family: 'Courier New', monospace;
          background: #f5f5f5;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 14px;
        }
        
        .device-status {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .device-status.active {
          background: #e8f5e9;
          color: #2e7d32;
        }
        
        .device-status.inactive {
          background: #ffebee;
          color: #c62828;
        }
        
        .device-details {
          margin-bottom: 20px;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #f5f5f5;
        }
        
        .detail-row:last-child {
          border-bottom: none;
        }
        
        .detail-label {
          color: #666;
          font-size: 14px;
          font-weight: 500;
        }
        
        .detail-value {
          color: #333;
          font-weight: 600;
          font-size: 14px;
        }
        
        .detail-value.remarks {
          max-width: 200px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .device-actions {
          display: flex;
          gap: 10px;
        }
        
        .action-btn {
          flex: 1;
          padding: 10px;
          border-radius: 8px;
          border: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
        }
        
        .view-btn {
          background: #e3f2fd;
          color: #1976d2;
        }
        
        .view-btn:hover {
          background: #bbdefb;
        }
        
        .delete-btn {
          background: #ffebee;
          color: #c62828;
          width: 50px;
        }
        
        .delete-btn:hover {
          background: #ffcdd2;
        }
        
        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }
        
        .empty-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          color: white;
          font-size: 32px;
        }
        
        .empty-state h3 {
          font-size: 22px;
          color: #333;
          margin: 0 0 10px 0;
        }
        
        .empty-state p {
          color: #666;
          margin: 0 0 30px 0;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }
        
        /* Animations */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}