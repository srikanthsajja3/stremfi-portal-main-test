import React from 'react';
import { Routes, Route, BrowserRouter as Router } from 'react-router-dom';
import LoginForm from './component/LoginForm';
import ProtectedRoute from './component/ProtectedRoute';
import SuperAdminHome from './component/SuperAdminHome';
import AdminList from './component/AdminList'
import OperatorList from './component/OperatorList';
import CustomersList from './component/CustomersList';
import AddAdminForm from './component/AddAdminForm';
import AddOperatorForm from './component/AddOperatorForm';
import AddCustomerForm from './component/AddCustomerForm';
import PageNotFound from './component/PageNotFound';
import AdminHome from './component/AdminHome';
import OperatorHome from './component/OperatorHome';
import ChangePassword from './component/ChangePassword';
import Customer from './component/Customer';
import WalletHistory from './component/WalletHistory';
import Home from './component/Home';
import PioneerIptvBranchMapping from './component/PioneerIptvBranchMapping';
import InternetBranchMapping from './component/Internetbranchmapping';
import PioneerIptvPlanMapping from './component/PioneerIptvPlanMapping';
import ComboPlanMapping from './component/ComboPlanMapping';
import KycProviderMapping from './component/KycProviderMapping';
import ActivityLog from './component/ActivityLog';
import AdminPreRegister from './component/PreRegister/AdminPreRegister';
import AddStelfiberDevice from './component/AddStelfiberDevice';
import OperatorChannelManager from './component/OperatorChannelMapping';
// import PreRegister from './component/PreRegister/PreRegister';
// import Success from './component/PreRegister/Success';
import LiveTV from './component/ContentManagement/liveTV';
import OTTContent from './component/ContentManagement/ottContent';
import KidsContent from './component/ContentManagement/kidsContent';
import InternetCustomersList from './component/InternetCustomersList';
import InternetPlanMapping from './component/InternetPlanMapping';
import DigilockerCallback from './component/DigilockerCallback';
import LinkInternetAccountPage from './component/Customer/LinkInternetAccountPage';
import DigilockerPopupClose from './component/Digilocker/DigilockerPopupClose';
import { ToastContainer, Zoom } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        transition={Zoom}
        style={{ zIndex: 99999 }}
      />

      <Routes>
        <Route path='/' element={<LoginForm />} />

        <Route path="/digilocker-callback" element={<DigilockerCallback />} />
        <Route path="/link-internet-account/:id" element={<LinkInternetAccountPage />} />
        <Route path="/digilocker-popup-complete" element={<DigilockerPopupClose />} />

        <Route path="/login" element={<LoginForm />} />
        {/* <Route path="/pre-register" element={<PreRegister/>}/>
        <Route path="/success" element={<Success/>}/> */}

        <Route element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'operator']} />}>
          <Route path="/add-customer" element={<AddCustomerForm />} />
          <Route path="/customers" element={<CustomersList />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/customer/:id" element={<Customer />} />
          <Route path="/wallet-history" element={<WalletHistory />} />
          <Route path="/operator-channel-mapping" element={<OperatorChannelManager />} />
          <Route path="/internet-customers" element={<InternetCustomersList />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['superadmin', 'admin']} />}>
          <Route path="/add-admin" element={<AddAdminForm />} />
          <Route path="/admins" element={<AdminList />} />
          <Route path="/add-operator" element={<AddOperatorForm />} />
          <Route path="/operators" element={<OperatorList />} />
          <Route path="/assign-internet-plans/:id" element={<InternetPlanMapping />} />
          <Route path="/assign-internet-branches/:id" element={<InternetBranchMapping />} />
          <Route path="/assign-pioneeriptv-branches/:id" element={<PioneerIptvBranchMapping />} />
          <Route path="/assign-pioneeriptv-plans/:id" element={<PioneerIptvPlanMapping />} />
          <Route path="/assign-combo-plans/:id" element={<ComboPlanMapping />} />
          <Route path="/assign-kyc-providers/:id" element={<KycProviderMapping />} />
          <Route path='/add-stelfiber-device' element={<AddStelfiberDevice />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['operator']} />}>
          <Route path="/operator" element={<OperatorHome />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminHome />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
          <Route path="/superadmin" element={<SuperAdminHome />} />
          <Route path="/livetv-channels" element={<LiveTV />} />
          <Route path="/ott-content" element={<OTTContent />} />
          <Route path="/kids-content" element={<KidsContent />} />
          <Route path="/activity-log" element={<ActivityLog />} />
        </Route>

        {/* ✅ Fallback 404 */}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Router>
  );
}

export default App;