// SuperAdminHome.js
import React, { useEffect, useState, useContext, useRef } from 'react';
import { UserContext } from "../UserContext";
import Header from '../Header';
import apiClient from '../../api/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaUsers,
  FaWallet,
  FaChevronRight,
  FaUserPlus,
  FaSync,
  FaPause,
  FaPlay
} from 'react-icons/fa';
import AnnouncementModal from '../AnnouncementModal';
import QRCodeModal from "../QRCodeModal";

// How often the dashboard auto-syncs Internet customers while it's
// open. Always starts enabled on a fresh page load/reload — the
// paused state is only ever kept for the current session (a plain
// useState, not localStorage), never remembered across reloads.
const AUTO_SYNC_INTERVAL_SECONDS = 60;

const OperatorHome = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState({
    totalCustomers: 0,
    totalWallet: 0,
  });

  const [loading, setLoading] = useState(true);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // Customer sync is a bigger action than a plain refresh — it can
  // create real customer accounts, not just update reference data —
  // so its toast surfaces the full breakdown rather than just a count.
  const [syncingCustomers, setSyncingCustomers] = useState(false);

  // ---- Auto-sync timer ----
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [autoSyncCountdown, setAutoSyncCountdown] = useState(AUTO_SYNC_INTERVAL_SECONDS);
  // Guards against an auto-sync tick firing while a manual sync (or a
  // previous auto-sync that ran long) is still in flight.
  const syncInFlightRef = useRef(false);

  const openQRCodeModal = () => setShowQRModal(true);
  const closeQRCodeModal = () => setShowQRModal(false);

  // Check if modal should be shown on component mount
  useEffect(() => {
    // Create a unique key for this user's login session
    const announcementKey = `announcementShown_${user?.operatorId}`;
    
    // Check if we've already shown the announcement for this login session
    const announcementShown = localStorage.getItem(announcementKey);
    
    if (!announcementShown) {
      setShowAnnouncement(true);
      // Mark that we've shown the announcement for this login session
      localStorage.setItem(announcementKey, 'true');
    }
    
  }, [user]);

  const fetchDashboard = async () => {
    try {
      const { data } = await apiClient.get('/dashboard/operator_dashboard.php');
      setDashboardData(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Format number with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleCloseAnnouncement = () => {
    setShowAnnouncement(false);
  };

  const handleSyncCustomers = async () => {
    if (!window.confirm(
      "This pulls customers from the Internet provider for your assigned " +
      "partner/branches and can create new customer accounts locally for " +
      "anything not already linked. Continue?"
    )) {
      return;
    }
    if (syncInFlightRef.current) return;
    syncInFlightRef.current = true;
    setSyncingCustomers(true);
    try {
      const { data } = await apiClient.post('/sync_internet_customers.php');
      if (data.status === 'success') {
        const s = data.summary || {};
        toast.success(
          `Synced ${s.total_records || 0} record(s): ` +
          `${s.linked_created_new_customer || 0} new customer(s), ` +
          `${s.linked_matched_existing_customer || 0} matched to existing, ` +
          `${s.linked_updated || 0} refreshed`
        );
        const skipped =
          (s.skipped_unmapped_branch || 0) +
          (s.skipped_not_assigned_to_you || 0) +
          (s.skipped_no_mobile || 0) +
          (s.skipped_mobile_conflict || 0) +
          (s.skipped_username_conflict || 0);
        if (skipped > 0) {
          toast.warn(
            `${skipped} record(s) skipped — unmapped branch: ${s.skipped_unmapped_branch || 0}, ` +
            `not assigned to you: ${s.skipped_not_assigned_to_you || 0}, no mobile: ${s.skipped_no_mobile || 0}, ` +
            `mobile conflict: ${s.skipped_mobile_conflict || 0}, username conflict: ${s.skipped_username_conflict || 0}`
          );
        }
        if (s.row_errors?.length) {
          toast.error(`${s.row_errors.length} record(s) hit an error — check the activity log for details.`);
        }
        // The whole point of syncing is that the customer count can
        // change — refresh the dashboard cards so that's actually
        // visible without a manual page reload.
        fetchDashboard();
      } else {
        toast.error(data.message || 'Failed to sync customers');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to sync customers');
    } finally {
      setSyncingCustomers(false);
      syncInFlightRef.current = false;
    }
  };

  // Same sync, run automatically in the background — no confirm
  // dialog, and quiet unless something actually changed or broke, so
  // it doesn't nag every 60 seconds when there's nothing new.
  const runAutoSync = async () => {
    if (syncInFlightRef.current) return;
    syncInFlightRef.current = true;
    try {
      const { data } = await apiClient.post('/sync_internet_customers.php');
      if (data.status === 'success') {
        const s = data.summary || {};
        const changed =
          (s.linked_created_new_customer || 0) +
          (s.linked_updated || 0);
        if (changed > 0) {
          toast.success(
            `Auto-synced Internet customers: ${s.linked_created_new_customer || 0} new, ${s.linked_updated || 0} updated`
          );
        }
        if (s.row_errors?.length) {
          toast.error(`Auto-sync: ${s.row_errors.length} record(s) hit an error — check the activity log.`);
        }
        // Refresh the dashboard count regardless of whether anything
        // toast-worthy happened — this is exactly what wasn't
        // updating before.
        fetchDashboard();
      }
    } catch (err) {
      // Quiet on failure — don't nag every minute if something's
      // misconfigured. The manual button still surfaces errors clearly.
    } finally {
      syncInFlightRef.current = false;
    }
  };

  useEffect(() => {
    if (!autoSyncEnabled) return;

    setAutoSyncCountdown(AUTO_SYNC_INTERVAL_SECONDS);

    const timer = setInterval(() => {
      setAutoSyncCountdown((prev) => {
        if (prev <= 1) {
          runAutoSync();
          return AUTO_SYNC_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSyncEnabled]);

  return (
    <>
      <Header />
      <div className="superadmin-dashboard">

        {/* {showAnnouncement && (
          <AnnouncementModal onClose={handleCloseAnnouncement} />
        )} */}

        {showQRModal && (
          <QRCodeModal
            operatorId={user?.operatorId}
            operatorName={user?.name || "Operator"}
            onClose={closeQRCodeModal}
          />
        )}
        
        <div className="app-link alt-purple">
          <div className='dash-add-amount'>
            <h1>Dashboard: </h1>
              <div className="action-buttons">
                <button onClick={openQRCodeModal} className='add-money'>₹ Add Money</button>
              </div>
          </div>
        </div>
        
        {loading ? (
          <div className="dashboard-loading">
            <div className="loader"></div>
            <p>Loading dashboard data...</p>
          </div>
        ) : (
          <>
            <div className="dashboard-cards">
              
              <div className="card customer-card" onClick={() => {navigate('/internet-customers')}}>
                <div className="card-icon">
                  <FaUsers />
                </div>
                <div className="card-content">
                  <h2>{formatNumber(dashboardData.totalCustomers)}</h2>
                  <p>Customers</p>
                </div>
                <div className="card-arrow"> 
                  <FaChevronRight />
                </div>
              </div>
              
              <div className="card wallet-card" onClick={() => {navigate('/wallet-history')}}>
                <div className="card-icon">
                  <FaWallet />
                </div>
                <div className="card-content">
                  <h2>₹{formatNumber(dashboardData.totalWallet)}</h2>
                  <p>Total Wallet</p>
                </div>
                <div className="card-arrow">
                  <FaChevronRight />
                </div>
              </div>
            </div>

            {/* Auto-sync status/countdown — always re-enabled on a
                fresh page load; Pause only lasts for this session. */}
            <div className="auto-sync-bar">
              <span className="auto-sync-status-text">
                {autoSyncEnabled
                  ? `🔄 Auto-syncing Internet customers — next in ${autoSyncCountdown}s`
                  : "⏸ Auto-sync paused"}
              </span>
              <button
                className="auto-sync-toggle-btn"
                onClick={() => setAutoSyncEnabled((prev) => !prev)}
              >
                {autoSyncEnabled ? <><FaPause /> Pause</> : <><FaPlay /> Resume</>}
              </button>
            </div>
            
            <div className='quick-actions'>
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button className="action-btn customer-btn" onClick={() => navigate('/add-customer')}>
                  <FaUserPlus />
                  <span>Add Customer</span>
                </button>
                <button
                  className="action-btn sync-btn"
                  onClick={handleSyncCustomers}
                  disabled={syncingCustomers}
                >
                  <FaSync className={syncingCustomers ? "spin-icon" : ""} />
                  <span>{syncingCustomers ? "Syncing..." : "Sync Internet Customers"}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default OperatorHome;