import React, { useState, useEffect, useCallback, useContext } from 'react';
import { UserContext } from "../UserContext";
import apiClient from '../../api/client';
import './index.css';
import Header from '../Header';

const History = () => {
  const { token, user } = useContext(UserContext);
  const [combinedHistory, setCombinedHistory] = useState([]);
  const [operatorDetails, setOperatorDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Calculate pagination values
  const totalItems = combinedHistory.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = combinedHistory.slice(startIndex, startIndex + itemsPerPage);

  // ✅ Fetch history + operator details with date filter
  const fetchHistory = useCallback(async () => {
  try {
    const { data } = await apiClient.get(`/getWalletHistory.php?filter=${dateFilter}`);

    if (data.success) {
      setCombinedHistory(data.data || []);

      // operator details → you can adjust this if API later returns operator info
      setOperatorDetails({
        operatorName: user?.name || user?.role || "User",
        wallet: data.data?.length ? data.data[0].balance_after : 0
      });
    } else {
      throw new Error(data.message || 'Unknown error');
    }
  } catch (err) {
    setError(err.message || 'Failed to fetch history');
  } finally {
    setLoading(false);
  }
}, [token, user, dateFilter]);

  useEffect(() => {
    fetchHistory();
    setCurrentPage(1); // Reset to first page when filter changes
  }, [fetchHistory, dateFilter]);

  const highlightRow = (transactionType) => {
    return transactionType?.toLowerCase() === 'credit' ? 'credit-row' : 'debit-row';
  };

  // Pagination functions
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  return (
    <>
    <Header />
    <div id="HistoryManagementPage" className="logged-in-content">
      <div className="header-section">
        <h2 id="displayOperatorName">
          {operatorDetails ? `Welcome to ${operatorDetails.operatorName}` : 'Welcome'}
        </h2>
      </div>

      {/* Filters and Controls */}
      <div className="controls-section">
        <div className="filter-group">
          <label htmlFor="dateFilter">Time Period: </label>
          <select 
            id="dateFilter" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="itemsPerPage">Items per page: </label>
          <select 
            id="itemsPerPage" 
            value={itemsPerPage} 
            onChange={handleItemsPerPageChange}
            className="filter-select"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="table-container">
          <div className="skeleton-header">
            <div className="skeleton-header-cell"></div>
            <div className="skeleton-header-cell"></div>
            <div className="skeleton-header-cell"></div>
            <div className="skeleton-header-cell"></div>
            <div className="skeleton-header-cell"></div>
            <div className="skeleton-header-cell"></div>
            <div className="skeleton-header-cell"></div>
          </div>
          {[...Array(5)].map((_, index) => (
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
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="operator-list operator-table-wrapper">
          <table className="operator-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Name</th>
                <th className="mobile-hidden">Mobile</th>
                <th>Amount</th>
                <th>Balance</th>
                <th>Type</th>
                <th>Remarks</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((history, index) => {
                  const isCredit = history.transaction_type === "credit";
                  const displayName = history.customer_name || "";
                  const displayPhone = history.customer_phone || "";

                  return (
                    <tr 
                      key={history.id || `${history.created_at}-${index}`} 
                      className={highlightRow(history.transaction_type)}
                    >
                      <td>{startIndex + index + 1}</td>
                      <td>{displayName}</td>
                      <td className="mobile-hidden">{displayPhone}</td>
                      <td className={`amount-cell ${isCredit ? "credit" : "debit"}`}>
                        {isCredit ? "+" : "-"}₹{history.amount}
                      </td>
                      <td>₹{history.balance_after}</td>
                      <td>
                        <span className={`type-badge ${history.transaction_type}`}>
                          {history.role} {history.transaction_type.toUpperCase()}
                        </span>
                      </td>
                      <td title={history.remarks}>
                        {history.remarks.length > 30
                          ? history.remarks.slice(0, 30) + "..."
                          : history.remarks}
                      </td>
                      <td>{new Date(history.created_at).toLocaleString()}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="no-data">No history found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => goToPage(currentPage - 1)} 
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => goToPage(pageNum)}
                className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
              >
                {pageNum}
              </button>
            );
          })}

          <button 
            onClick={() => goToPage(currentPage + 1)} 
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}

      {/* Page Info */}
      <div className="page-info">
        Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} entries
      </div>
    </div>
    </>
  );
};

export default History;