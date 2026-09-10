// SuperAdminHome.js
import React, { useEffect, useState, useContext } from 'react';
import { UserContext } from "../UserContext";
import Header from '../Header';
import apiClient from '../../api/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaUserShield, 
  FaHeadset, 
  FaUsers, 
  FaWallet, 
  FaChevronRight, 
  FaUserPlus
} from 'react-icons/fa';
import './index.css';
import AnnouncementModal from '../AnnouncementModal';

const SuperAdminHome = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState({
    totalAdmins: 0,
    totalOperators: 0,
    totalCustomers: 0,
    totalWallet: 0,
  });

  const [loading, setLoading] = useState(true);
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  // Activity log preview — most recent entries; how many actually show
  // is controlled by CSS (see index.css) rather than fetching a
  // different count per screen size, so this always fetches a generous
  // 10 and lets the layout hide the rest on smaller screens.
  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // NOTE: the old "Sync Internet Plans / Partners & Branches / Pioneer
  // IPTV Operators & Branches" buttons that used to live here are gone.
  // Those all now happen automatically at the moment they're actually
  // useful instead of needing someone to remember to press a button:
  //   - Internet Plans catalog: refreshed quietly in the background
  //     whenever the Internet Plan Mapping / Combo Plans pages load.
  //   - Internet Partners/Branches catalog: refreshed quietly the
  //     moment the Add Admin / Add Operator form opens, so the
  //     dropdowns are always current.
  //   - Pioneer IPTV linking: a live lookup as soon as the phone
  //     number is filled in on the Add Admin / Add Operator form
  //     (see AddOperatorForm.js / AddAdminForm.js), with the match
  //     applied automatically right after the account is created.
  //   - Internet customers: imported automatically right after a new
  //     operator is created, scoped to just their branch.

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
      const { data } = await apiClient.get('/dashboard/superadmin_dashboard.php');
      setDashboardData(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
      setLoading(false);
    }
  };


  const fetchRecentActivity = async () => {
    setActivityLoading(true);
    try {
      const { data } = await apiClient.get('/get_activity_log.php?page=1&limit=10');
      if (data.status === 'success') {
        setRecentActivity(data.logs || []);
      }
    } catch (err) {
      setRecentActivity([]);
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchRecentActivity();
  }, []);

  // Format number with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleCloseAnnouncement = () => {
    setShowAnnouncement(false);
  };


  return (
    <>
      <Header />
      <div className="superadmin-dashboard">

        {/* {showAnnouncement && (
          <AnnouncementModal onClose={handleCloseAnnouncement} />
        )} */}

        <div className="app-link alt-purple">
          <h1>Dashboard:</h1>
        </div>

        {loading ? ( 
          <div className="dashboard-loading">
            <div className="loader"></div>
            <p>Loading dashboard data...</p>
          </div>
        ) : (
          <>
            <div className="dashboard-cards">
              <div className="card operator-card1" onClick={() => {navigate('/admins')}}>
                <div className="card-icon">
                  <FaUserShield />
                </div>
                <div className="card-content">
                  <h2>{formatNumber(dashboardData.totalAdmins)}</h2>
                  <p>Admins</p>
                </div>
                <div className="card-arrow">
                  <FaChevronRight />
                </div>
              </div>
              
              <div className="card operator-card" onClick={() => {navigate('/operators')}}>
                <div className="card-icon">
                  <FaHeadset />
                </div>
                <div className="card-content">
                  <h2>{formatNumber(dashboardData.totalOperators)}</h2>
                  <p>Operators</p>
                </div>
                <div className="card-arrow">
                  <FaChevronRight />
                </div>
              </div>
              
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
              
              <div className="card wallet-card"> {/* onClick={() => {navigate('/wallet-history')}} */}
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
                
            <div className='quick-actions'>
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button className="action-btn admin-btn" onClick={() => navigate('/add-admin')}>
                  <FaUserPlus />
                  <span>Add Admin</span>
                </button>
                <button className="action-btn operator-btn" onClick={() => navigate('/add-operator')}>
                  <FaUserPlus />
                  <span>Add Operator</span>
                </button>
                <button className="action-btn customer-btn" onClick={() => navigate('/add-customer')}>
                  <FaUserPlus />
                  <span>Add Customer</span>
                </button>
              </div>
            </div>

          </>
        )}
      </div>
    </>
  );
};

export default SuperAdminHome;