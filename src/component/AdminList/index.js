import React, { useEffect, useState, useContext } from 'react';
import Header from '../Header';
import { UserContext } from "../UserContext";
import apiClient from '../../api/client';
import { useNavigate } from 'react-router-dom';
import './index.css';
import { toast } from 'react-toastify';
import { FaBox } from 'react-icons/fa';

const OperatorList = () => {
  const { user, token, tempLogin } = useContext(UserContext);
  const [operators, setOperators] = useState([]);
  const [allOperators, setAllOperators] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balancePassword, setBalancePassword] = useState('');
  const [remarks, setRemarks] = useState('');
  const [showBalanceForm, setShowBalanceForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isSuperAdmin = user.role === 'superadmin';

  const openAddBalanceForm = (operator) => {
    setSelectedOperator(operator);
    setBalanceAmount('');
    setRemarks('');
    setShowBalanceForm(true);
  };

  const [showEditForm, setShowEditForm] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    username: '',
    password: '',
    networkName: '',
    operatorName: '',
    phoneNumber: '',
    Email: '',
    address: '',
    packPrice: '',
    internetEnabled: '',
    internetBaseUrl: '',
    internetToken: '',
    pioneeriptvOprId: '',
    pioneeriptvToken: ''
  });

  // Synced Partner/Branch catalog (see sync_internet_partners_and_branches.php)
  const [partnersCatalog, setPartnersCatalog] = useState([]);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const { data } = await apiClient.get('/get_internet_partners_and_branches.php');
        if (data.status === 'success') {
          setPartnersCatalog(data.partners || []);
        }
      } catch (err) {
        // Non-fatal — the dropdown just shows empty until a sync runs.
      }
    };
    fetchPartners();
  }, []);

  const selectedPartnerBranches =
    partnersCatalog.find((p) => String(p.partner_code) === String(editForm.internetPartnerId))?.branches || [];

  const navigate = useNavigate();

  const fetchOperators = async () => {
    try {
      const { data } = await apiClient.get('/operator_api.php?filterRole=admin');
      setOperators(data.operators);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Network error');
    } finally {
      setLoading(false);
    }
  };


  const fetchAllOperators = async () => {
    try {
      const { data } = await apiClient.get('/operator_api.php');
      setAllOperators(data.operators);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOperators();
      fetchAllOperators();
    }
  }, [token]);

  const fetchOperatorsSearch = async (name = '') => {
    setLoading(true);
    try {
      const response = await apiClient.get(
        `/searchOperatorsByName.php?name=${encodeURIComponent(name)}&role=admin`
      );
      setOperators(response.data.operators || []);
    } catch (error) {
      // console.error('Error fetching operators:', error);
      setOperators([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBalance = async () => {
    if (!balanceAmount || isNaN(balanceAmount)) {
      toast.warn("Please enter a valid amount.");
      return;
    }
    if (!balancePassword) {
      toast.warn("Please enter your Wallet Password to confirm.");
      return;
    }

    const added_by = `${user.operatorName}, ${user.phoneNumber}`;
    setLoading(true);
    try {
      const response = await apiClient.post(
        "/addBalance.php",
        {
          id: selectedOperator.id,
          amount: parseFloat(balanceAmount), // safer than parseInt
          added_by,
          remarks,
          walletPassword: balancePassword,
        }
      );

      if (response.data.status === "success") {
        toast.success("Balance updated successfully!");
        searchTerm ? fetchOperatorsSearch(searchTerm) : fetchOperators();
        setShowBalanceForm(false);
        setBalancePassword('');
        closeProfileModal();
      } else {
        toast.error("Failed: " + (response.data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Add balance error:", error);
      toast.error(error.response?.data?.error || "Failed to update balance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openEditOperatorForm = (operator) => {
    setEditForm({
      id: operator.id,
      username: operator.username,
      // ⚠️ Never pre-fill with operator.password. That value is now a
      // bcrypt hash (or, for an account that hasn't logged in since the
      // hashing migration, possibly still a real plaintext password) —
      // either way, showing it here and letting an untouched save
      // re-submit it meant every edit that didn't deliberately change
      // the password was silently re-hashing the hash and breaking that
      // account's login. Left blank; operator_api.php needs to keep
      // the existing password when this field is empty, same as
      // operator_api.php already does — verify that's actually the case
      // there too (see note below).
      password: '',
      networkName: operator.networkName,
      operatorName: operator.operatorName,
      phoneNumber: operator.phoneNumber,
      Email: operator.Email,
      address: operator.address,
      packPrice: operator.packPrice,
      operCode: operator.operCode,
      internetEnabled: operator.internetEnabled,
      internetBaseUrl: operator.internetBaseUrl,
      internetToken: operator.internetToken,
      internetPartnerId: operator.internetPartnerId || "",
      internetBranchId: operator.internetBranchId || "",
      operatorEnabled: operator.operatorEnabled,
      pioneeriptvOprId: operator.pioneeriptvOprId,
      pioneeriptvToken: operator.pioneeriptvToken,
      role: operator.role,
      created_by: operator.created_by,
    });
    setShowEditForm(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'internetPartnerId' ? { internetBranchId: '' } : {})
    }));
  };

  const submitEditForm = async () => {
    setLoading(true);
    try {
      await apiClient.put('/operator_api.php', editForm);
      toast.success('Admin updated successfully!');
      searchTerm ? fetchOperatorsSearch(searchTerm) : fetchOperators();
      setShowEditForm(false);
      closeProfileModal();
    } catch (err) {
      // console.error(err);
      toast.warn('Failed to update admin');
    } finally {
      setLoading(false)
    }
  };

  const openProfileModal = (operator) => {
    setSelectedOperator(operator);
  };

  const closeProfileModal = () => {
    setSelectedOperator(null);
  };

  const tempLoginOperator = async (targetUserId) => {
    closeProfileModal();

    const res = await apiClient.post(
      "/impersonate.php",
      { targetUserId },
      { validateStatus: () => true }
    );

    const data = res.data;

    if (res.status >= 200 && res.status < 300 && data.token) {
      tempLogin(data.token);

      if (data.role === "admin") {
        window.location.href = "/admin";
      } else if (data.role === "operator") {
        window.location.href = "/operator";
      }
    } else {
      toast.warn("Impersonation failed: " + (data.error || "Unknown error"));
    }
  };

  const isCustomChannelMode = (channelMode) => {
    return channelMode && channelMode.toLowerCase() === 'custom';
  };

  const filteredOperators = operators.filter((operator) => {
    const search = searchTerm.toLowerCase();

    return (
      operator.username?.toLowerCase().includes(search) ||
      operator.networkName?.toLowerCase().includes(search) ||
      operator.operatorName?.toLowerCase().includes(search) ||
      operator.phoneNumber?.toLowerCase().includes(search) ||
      operator.address?.toLowerCase().includes(search)
    );
  });

  const highlightText = (text, search) => {
    if (!search || !text) return text;

    const regex = new RegExp(`(${search})`, "gi");
    const parts = text.toString().split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          style={{
            backgroundColor: "#ffeb3b",
            padding: "0 2px",
            borderRadius: "2px"
          }}
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <>
      <Header />

      <div className="operator-header">
        <h2>Admins</h2>
        <input
          type="text"
          placeholder="Search by name or phone"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyUp={(e) => fetchOperatorsSearch(e.target.value)}
          className="search-input"
        />
        <button disabled={loading} className="add-operator-btn" onClick={() => navigate('/add-admin')}>
          + Add Admin
        </button>
      </div>

      {error ? (
        <p className='error'>error</p>
      ) : (
        loading ? (
          <>
            <div className="skeleton-loader">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="skeleton-row">
                  <div className="skeleton-cell"></div>
                  <div className="skeleton-cell"></div>
                  <div className="skeleton-cell"></div>
                  <div className="skeleton-cell"></div>
                  <div className="skeleton-cell"></div>
                  <div className="skeleton-cell"></div>
                  <div className="skeleton-cell"></div>
                  <div className="skeleton-cell"></div>
                  <div className="skeleton-cell"></div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="operator-list">
            <div className="operator-table-wrapper">
              <table className="operator-table" id="operatorsTable">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Network Name</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Wallet</th>
                    <th>Account Enabled</th>
                    <th>Created By</th>
                    <th>Channel Mode</th>
                    <th>Internet Enabled</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOperators.length > 0 ? (
                    filteredOperators.map((operator, index) => (
                      <tr
                        key={operator.id}
                        className={index % 2 === 0 ? 'even-row' : 'odd-row'}
                      >
                        <td>{index + 1}</td>
                        <td>
                          <button
                            onClick={() => openProfileModal(operator)}
                            disabled={loading}
                            style={{
                              color: '#007bff',
                              textDecoration: 'underline',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                              fontWeight: 'bold'
                            }}
                          >
                            {highlightText(operator.username, searchTerm)}
                          </button>
                        </td>
                        <td>{highlightText(operator.networkName, searchTerm)}</td>
                        <td>{highlightText(operator.operatorName, searchTerm)}</td>
                        <td>{highlightText(operator.phoneNumber, searchTerm)}</td>
                        <td>{operator.wallet}</td>
                        <td>
                          <span className={`internet-enabled-badge ${operator.operatorEnabled === 1 ? 'enabled' : 'disabled'}`}>
                            {operator.operatorEnabled === 1 ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td>{operator.created_by_name}</td>
                        <td>
                          <span className={`channel-mode-badge ${isCustomChannelMode(operator.channel_mode) ? 'custom-mode' : 'default-mode'}`}>
                            {operator.channel_mode || 'default'}
                          </span>
                        </td>
                        <td>
                          <span className={`internet-enabled-badge ${operator.internetEnabled === 1 ? 'enabled' : 'disabled'}`}>
                            {operator.internetEnabled === 1 ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td>
                          {operator.internetEnabled === 1 && (
                            <>
                              <button
                                className="oper-assign-pack"
                                onClick={() => navigate(`/assign-internet-plans/${operator.id}`)}
                              >
                                Assign Internet Plans
                              </button>
                              <button
                                className="oper-assign-pack"
                                onClick={() => navigate(`/assign-internet-branches/${operator.id}`)}
                              >
                                Assign Internet Branches
                              </button>
                              <button
                                className="oper-assign-pack"
                                onClick={() => navigate(`/assign-kyc-providers/${operator.id}`)}
                              >
                                Assign KYC Providers
                              </button>
                            </>
                          )}
                          {operator.pioneeriptvToken === null ? (
                            ""
                          ) : (
                          <>
                          <button
                            className="oper-assign-pack"
                            onClick={() => navigate(`/assign-pioneeriptv-branches/${operator.id}`)}
                          >
                            Assign PIONEER Branches
                          </button>
                          <button
                            className="oper-assign-pack"
                            onClick={() => navigate(`/assign-pioneeriptv-plans/${operator.id}`)}
                          >
                            Assign Pioneer IPTV Plans
                          </button>
                          </>
                          )}
                          {operator.internetEnabled === 1 && operator.pioneeriptvToken !== null && (
                            <button
                              className="oper-assign-pack"
                              onClick={() => navigate(`/assign-combo-plans/${operator.id}`)}
                            >
                              Assign Combo Plans
                            </button>
                          )}
                        </td>
                      </tr>
                    ))) : (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic' }}>
                        No Admins Found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>


              {selectedOperator && (
                <div className="modal-overlay">
                  <div className="modal-content operator-profile-modal">

                    <div className="operator-profile-content">
                      {/* Profile Header */}
                      <div className="profile-header">
                        <div className="operator-avatar">
                          {selectedOperator.operatorName ? selectedOperator.operatorName.charAt(0).toUpperCase() : 'O'}
                        </div>
                        <div className='operator-close'>
                          <div className="operator-info">
                            <h2>{selectedOperator.operatorName || 'No Name'}</h2>
                            <p>@{selectedOperator.role}</p>
                          </div>
                          <button onClick={closeProfileModal} className="close-btn">×</button>
                        </div>
                      </div>

                      {/* Details Section */}
                      <div className="details-section">
                        <div className="detail-group">
                          <div className="detail-item">
                            <span className="detail-label">Network Name: </span>
                            <span className="detail-value">{selectedOperator.networkName || 'Not specified'}</span>
                          </div>

                          <div className="detail-item">
                            <span className="detail-label">Phone Number: </span>
                            <span className="detail-value">{selectedOperator.phoneNumber}</span>
                          </div>
                        </div>

                        <div className="detail-group price-group">
                          <div className="detail-item highlight">
                            <span className="detail-label">Wallet Balance: </span>
                            <span className="detail-value">₹{selectedOperator.wallet}</span>
                          </div>
                        </div>

                        <div className="detail-item full-width">
                          <span className="detail-label">Address: </span>
                          <span className="detail-value">{selectedOperator.address}</span>
                        </div>


                      </div>

                      {/* Action Buttons */}
                      <div className="oper-buttons">
                        <button disabled={loading} className='oper-btn oper-btn-edit' onClick={() => openEditOperatorForm(selectedOperator)}>
                          Edit Profile
                        </button>
                        <button disabled={loading} className='oper-btn oper-btn-balance' onClick={() => openAddBalanceForm(selectedOperator)}>
                          Add Balance
                        </button>
                        <button disabled={loading} onClick={() => tempLoginOperator(selectedOperator.id)} className="oper-btn oper-btn-login">
                          Login as Admin
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {showBalanceForm && selectedOperator && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <h3>Add Balance to: {selectedOperator.operatorName}</h3>
                    <p>Current Wallet: ₹{selectedOperator.wallet}</p>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={balanceAmount}
                      onChange={(e) => setBalanceAmount(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Remarks"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                    <input
                      type="password"
                      placeholder="Enter your Wallet Password to confirm"
                      value={balancePassword}
                      onChange={(e) => setBalancePassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "4px 0 0" }}>
                      Not set up yet? Set your Wallet Password under Change Password.
                    </p>
                    <div className="modal-buttons">
                      <button disabled={loading} className="btn" onClick={handleAddBalance}>Submit</button>
                      <button className="cancel-btn1" onClick={() => { setShowBalanceForm(false); setBalancePassword(''); }}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              {showEditForm && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <h3>Edit Operator: {editForm.operatorName}</h3>
                    <label>Username:</label>
                    <input name="username" placeholder="Username" value={editForm.username} onChange={handleEditChange} />
                    <div className="password-wrapper">
                      <label>Password:</label>
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Leave blank to keep current password"
                        value={editForm.password}
                        onChange={handleEditChange}
                        autoComplete="new-password"
                      />
                      <span
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? "👁️" : "👁️‍🗨️"}
                      </span>
                    </div>
                    <label>Network Name:</label>
                    <input name="networkName" placeholder="Network Name" value={editForm.networkName} onChange={handleEditChange} />
                    <label>Operator Name</label>
                    <input name="operatorName" placeholder="Operator Name" value={editForm.operatorName} onChange={handleEditChange} />
                    <label>Phone Number</label>
                    <input name="phoneNumber" placeholder="Phone Number" value={editForm.phoneNumber} onChange={handleEditChange} />
                    <label>Email ID:</label>
                    <input name="Email" placeholder="Email" value={editForm.Email} onChange={handleEditChange} />
                    <label>Address:</label>
                    <input name="address" placeholder="Address" value={editForm.address} onChange={handleEditChange} />

                    {/* 🔐 Only for SuperAdmin */}
                    {isSuperAdmin && (
                      <>
                        {/* <label>OTTPlay Operator Code:</label>
          <input name="operCode" placeholder="OTTPlay Operator Code" value={editForm.operCode} onChange={handleEditChange} /> */}

                        <label>Role</label>
                        <select name="role" value={editForm.role} onChange={handleEditChange}>
                          <option value="operator">Operator</option>
                          <option value="admin">Admin</option>
                        </select>

                        {/* Internet Enabled Toggle - Clean Version */}
                        <div className="toggle-wrapper">
                          <label className="toggle-label">
                            <span>Internet Enabled</span>
                            <div className="switch">
                              <input
                                type="checkbox"
                                checked={editForm.internetEnabled === 1}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    internetEnabled: e.target.checked ? 1 : 0
                                  })
                                }
                              />
                              <span className="slider"></span>
                            </div>
                          </label>
                        </div>

                        {editForm.internetEnabled === 1 && (
                          <div className="internet-section-edit">
                            <div className="internet-fields-edit">
                              <label>Internet Base URL:</label>
                              <input
                                name="internetBaseUrl"
                                value={editForm.internetBaseUrl}
                                onChange={handleEditChange}
                                placeholder="https://radius.example.com"
                              />

                              <label>Internet Token:</label>
                              <input
                                name="internetToken"
                                type="password"
                                value={editForm.internetToken}
                                onChange={handleEditChange}
                                placeholder="Bearer Token"
                                autoComplete="new-password"
                              />

                              <label>Internet Partner:</label>
                              <select
                                name="internetPartnerId"
                                value={editForm.internetPartnerId || ""}
                                onChange={handleEditChange}
                              >
                                <option value="">Select a partner...</option>
                                {partnersCatalog.map((p) => (
                                  <option key={p.partner_code} value={p.partner_code}>
                                    {p.partner_name}
                                  </option>
                                ))}
                              </select>

                              <label>Internet Branch:</label>
                              <select
                                name="internetBranchId"
                                value={editForm.internetBranchId || ""}
                                onChange={handleEditChange}
                                disabled={!editForm.internetPartnerId}
                              >
                                <option value="">
                                  {editForm.internetPartnerId ? "Select a branch..." : "Select a partner first"}
                                </option>
                                {selectedPartnerBranches.map((b) => (
                                  <option key={b.branch_code} value={b.branch_code}>
                                    {b.branch_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Account Enabled Toggle — controls login/API access entirely,
                            not a provider integration. Off means this account can't log
                            in, fetch data, or recharge anything, checked on every request. */}
                        <div className="toggle-wrapper">
                          <label className="toggle-label">
                            <span>Account Enabled</span>
                            <div className="switch">
                              <input
                                type="checkbox"
                                checked={editForm.operatorEnabled === 1}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    operatorEnabled: e.target.checked ? 1 : 0
                                  })
                                }
                              />
                              <span className="slider"></span>
                            </div>
                          </label>
                        </div>

                        <label>Pioneer IPTV Operator ID:</label>
                        <input
                          name="pioneeriptvOprId"
                          value={editForm.pioneeriptvOprId}
                          onChange={handleEditChange}
                          placeholder="Pioneer IPTV Operator ID"
                        />

                        <label>Pioneer IPTV Token:</label>
                        <input
                          name="pioneeriptvToken"
                          type="password"
                          value={editForm.pioneeriptvToken}
                          onChange={handleEditChange}
                          placeholder="Pioneer IPTV Token"
                          autoComplete="new-password"
                        />
                      </>
                    )}

                    <div className="modal-buttons">
                      <button disabled={loading} className="btn" onClick={submitEditForm}>Update</button>
                      <button className="btn cancel-btn" onClick={() => setShowEditForm(false)}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )
      )}
    </>
  );
};

export default OperatorList;