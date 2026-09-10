import React, { useEffect, useState, useContext } from 'react';
import Select from 'react-select';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from "../UserContext";
import apiClient from '../../api/client';
import Header from '../Header'; // assuming you have a shared Header component
import './index.css';   // style this file for table responsiveness

const CustomersList = () => {
  const { user, token } = useContext(UserContext);
  const [customers, setCustomers] = useState([]);
  const [operators, setOperators] = useState([]);
  const [selectedOperatorId, setSelectedOperatorId] = useState('all');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showLoading, setShowLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); 
// values like: all, vr_active, vr_inactive, ott1_active, etc.
  const [sortByExpiryAsc, setSortByExpiryAsc] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({});

  const navigate = useNavigate();
  
  const role = user.role;

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setShowLoading(true);
      const response = await apiClient.get('/allCustomers.php');
      setCustomers(response.data || []);
      setFilteredCustomers(response.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load customers');
      setCustomers([]);
    } finally {
      setLoading(false);
      setShowLoading(false);
    }
  };

  const fetchOperators = async () => {
      try {
        const { data } = await apiClient.get('/operator_api.php');
        setOperators(data.operators);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || 'Network error');
      } finally {
        setLoading(false);
      }
    };

    const fetchVisibleColumns =
      async () => {
        try {

          const { data } =
            await apiClient.get(
              "/customer/get_operator_visible_packages.php"
            );

          if (data.success) {
            setVisibleColumns(
              data.packages
            );
          }

        } catch (err) {
          console.error(err);
        }
    };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (role !== "operator") {
      fetchOperators();
    }
  }, [role]);

  useEffect(() => {
    if (token) {
      fetchVisibleColumns();
    }
  }, [token]);

  // Debounced Search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (!searchTerm) {
        setFilteredCustomers(customers);
        return;
      }
      const term = searchTerm.toLowerCase();
      const results = customers.filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(term)) ||
          (c.MobileNumber && c.MobileNumber.includes(term)) ||
          (c.username && c.username.toLowerCase().includes(term))
      );
      setFilteredCustomers(results);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, customers]);

  const isAnyPlanActive = (cust) => {
    const today = new Date();

    const dates = [
      cust.ExpiryDate,
      cust.pioneeriptv_expiry
    ];

    return dates.some(date => {
      if (!date || date === "0000-00-00") return false;
      return new Date(date) >= today;
    });
  };

  useEffect(() => {
    let list = [...customers];

    if (filterStatus === 'vr_active') {
      list = list.filter(isVRActive);
    } else if (filterStatus === 'vr_inactive') {
      list = list.filter(c => !isVRActive(c));
    } else if (filterStatus === 'pioneeriptv_active') {
      list = list.filter(isPioneerIptvActive);
    } else if (filterStatus === 'pioneeriptv_inactive') {
      list = list.filter(c => !isPioneerIptvActive(c));
    }

    if (selectedOperatorId !== 'all') {
      list = list.filter(c => c.operatorId === selectedOperatorId);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(term)) ||
          (c.MobileNumber && c.MobileNumber.includes(term)) ||
          (c.username && c.username.toLowerCase().includes(term))
      );
    }
    
    setFilteredCustomers(list);
  }, [searchTerm, customers, filterStatus, selectedOperatorId]);

  useEffect(() => {
    let list = [...filteredCustomers];
    
    // ✅ Sort by ExpiryDate
    list.sort((a, b) => {
      const dateA = new Date(a.ExpiryDate);
      const dateB = new Date(b.ExpiryDate);
      return sortByExpiryAsc ? dateA - dateB : dateB - dateA;
    });

    setFilteredCustomers(list);
  }, [sortByExpiryAsc]);

  const operatorOptions = [
    { value: 'all', label: 'All Operators' },

    ...(role === "admin"
      ? [{
          value: user.operatorId,
          label: `${user.phoneNumber || user.operatorPhoneNumber || ''} - ${user.operatorName} (Admin)`
        }]
      : []),

    ...operators.map(op => ({
      value: op.id,
      label: `${op.phoneNumber || ''} - ${op.operatorName}`
    }))
  ];

  const highlightText = (text, term) => {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  const formatExpiry = (date) => {
    if (!date || date === "0000-00-00") return "N/A";
    return date;
  };

  const isPlanActive = (date) => {
    if (!date || date === "0000-00-00") return false;
    return new Date(date) >= new Date();
  };

  const isVRActive = (c) => isPlanActive(c.ExpiryDate);
  const isPioneerIptvActive = (c) => isPlanActive(c.pioneeriptv_expiry);

  return (
    <>
      <Header />

      <div className="operator-header">
        <h2>Customers</h2>
        {role !== "operator" && (
          <Select
            options={operatorOptions}
            value={
              operatorOptions.find(op => op.value === selectedOperatorId) 
              || operatorOptions[0]
            }
            onChange={(selected) =>
              setSelectedOperatorId(
                selected.value === 'all' ? 'all' : Number(selected.value)
              )
            }
            placeholder="Search by phone or name..."
            isSearchable
            styles={{
              container: (base) => ({
                ...base,
                minWidth: 250,   // ✅ FIXED WIDTH
                width: 250       // optional fixed width
              })
            }}
          />
        )}

        <input
          type="text"
          className="search-input"
          placeholder="Search by name or phone"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="add-operator-btn" onClick={() => navigate('/add-customer')}>
          + Add Customer
        </button>
      </div>


      <div className="customer-summary">
        <div className="customer-summary">
          <strong>Total: {customers.length}</strong> |{" "}
          <span>Active: {customers.filter(isVRActive).length}</span> |{" "}
          <span>PioneerIptv: {customers.filter(isPioneerIptvActive).length}</span>
        </div>
        <div className="filter-section">
          <label>Filter by Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="search-input"
          >
            <option value="all">All</option>
            <option value="vr_active">Active</option>
            <option value="vr_inactive">Inactive</option>
            {visibleColumns.pioneeriptv && (
              <>
                <option value="pioneeriptv_active">PioneerIptv Active</option>
                <option value="pioneeriptv_inactive">PioneerIptv Inactive</option>
              </>
            )}
          </select>
        </div>
      </div>

        {showLoading || loading ? (
        <div className="loading-container">
          <div className="skeleton-loader">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="skeleton-row">
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
        </div>
      ) : error ? (
          <p className="error">{error}</p>
        ) : (
          <div className="operator-list table-wrapper">
            {filteredCustomers.length > 0 ? (
              <table className="customers-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th onClick={() => setSortByExpiryAsc(prev => !prev)} style={{ cursor: 'pointer' }}>
                      Account Expiry {sortByExpiryAsc ? '▲' : '▼'}
                    </th>
                    {visibleColumns.pioneeriptv && (
                    <th onClick={() => setSortByExpiryAsc(prev => !prev)} style={{ cursor: 'pointer' }}>
                      PioneerIptv Expiry {sortByExpiryAsc ? '▲' : '▼'}
                    </th>
                    )}
                    {user.role !== "operator" && <th>Operator</th>}
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((cust, index) => (
                    <tr key={cust.id} className={isAnyPlanActive(cust) ? 'row-active' : 'row-inactive'}>
                      <td>{index + 1}</td>
                      <td>
                        <Link to={`/customer/${cust.id}`}>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: highlightText(cust.username, searchTerm),
                            }}
                          />
                        </Link>
                      </td>

                      <td>
                        <Link to={`/customer/${cust.id}`}>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: highlightText(cust.name + " " + cust.lastName, searchTerm),
                            }}
                          />
                        </Link>
                      </td>
                      <td>{cust.MobileNumber}</td>
                      <td className={isPlanActive(cust.ExpiryDate) ? 'row-active' : 'row-inactive'}>{formatExpiry(cust.ExpiryDate)}</td>
                      {visibleColumns.pioneeriptv && (
                        <td className={isPlanActive(cust.pioneeriptv_expiry) ? 'row-active' : 'row-inactive'}>{formatExpiry(cust.pioneeriptv_expiry)}</td>
                      )}
                      {user.role !== "operator" && <td>{cust.operatorDetails}</td>}
                      <td>{cust.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">No customers found.</p>
            )}
          </div>
        )}
    </>
  );
};

export default CustomersList;
