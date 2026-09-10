import React, { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import apiClient from "../../api/client";
import { UserContext } from "../UserContext";
import Header from "../Header";
import PackDetails from "../PackDetails";
import ConfirmModal from "./ConfirmModal";
import { toast } from "react-toastify";
import PioneerPlanCard from "./PioneerPlanCard";
import InternetPlanCard from "./InternetPlanCard";
import VerificationModal from "./VerificationModal";
import InternetRechargeModal from "./InternetRechargeModal";
import VerifyAadhaarModal from "./VerifyAadhaarModal";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button
} from "@mui/material";
import "./index.css";
import RemoveMacModal from "./RemoveMacModal";
import PasswordModal from "./PasswordModal";
import SessionHistoryModal from "./SessionHistoryModal";

const Customer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(UserContext);
  const internetEnabled = user?.internetEnabled;
  const role = user.role;

  const [customer, setCustomer] = useState(null);
  const [operator, setOperator] = useState(null);
  const [operators, setOperators] = useState([]);
  const [basePlan, setBasePlan] = useState(null);
  const [addons, setAddons] = useState([]);
  const [allPackDetails, setAllPackDetails] = useState([]);
  const [mappedAddons, setMappedAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showUsernamePassword, setShowUsernamePassword] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [renewCooldown, setRenewCooldown] = useState({});
  const [visiblePackages, setVisiblePackages] = useState({});

  const [showInternetRecharge, setShowInternetRecharge] = useState(false);
  const [internetRechargeAdvance, setInternetRechargeAdvance] = useState(false);
  const [showSessionHistory, setShowSessionHistory] = useState(false);
  const [showRemoveMac, setShowRemoveMac] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showVerifyAadhaar, setShowVerifyAadhaar] = useState(false);

  // Which provider's card is currently shown below the customer details
  // card. Only one is rendered at a time now — the buttons act as tabs.
  // NOTE: this specific state (activePlanTab) appears unused elsewhere —
  // the tab switching itself is driven by `activeProvider` below, whose
  // default is now computed from whichever provider is actually visible
  // for this customer (see the useEffect near isActivePlan).
  const [activePlanTab, setActivePlanTab] = useState(null);
  // Raw per-provider lookup info from sync_user_plans.php (status/desc, not just expiry)
  const [pioneerIptvInfo, setPioneerIptvInfo] = useState(null);

  // Raw lookup payload for the customer's Internet/Broadband (OneRADIUS)
  // account. Same idea as pioneerIptvInfo — { status, results } — used to
  // tell "not linked yet" apart from "linked, here are the details".
  const [internetAccounts, setInternetAccounts] = useState([]);
  const [selectedInternetAccount, setSelectedInternetAccount] = useState(null);
  const [internetInfo, setInternetInfo] = useState(null);
  const [internetLoading, setInternetLoading] = useState(false);
  const [internetActionLoading, setInternetActionLoading] = useState(false);

  const [addUserLoading, setAddUserLoading] = useState(false);
  const [pioneerAddUserError, setPioneerAddUserError] = useState(null);
  const [showVerification, setShowVerification] = useState(false);
  // Branch picker for creating a new Pioneer IPTV account — same idea
  // as the recharge dialog's branch selection (auto-pick if the
  // operator only has one, ask if they have more). This is what
  // actually fixes "branch not assigned in Pioneer's backend" — the
  // branch that sticks for an STB is whatever's sent at creation time,
  // not whatever gets sent later on renew.
  const [showAddPioneerUserDialog, setShowAddPioneerUserDialog] = useState(false);

  // Full list of STBs Pioneer has on file for this customer. A customer can
  // have more than one box, each potentially on a different pack (SD/HD),
  // so recharging now needs to know WHICH box and WHICH plan, rather than
  // assuming a single plan for the whole customer.
  const [pioneerStbs, setPioneerStbs] = useState([]);
  const [pioneerRemoveStbLoading, setPioneerRemoveStbLoading] = useState(false);
  const [selectedStb, setSelectedStb] = useState(null);
  const [advanceRecharge, setAdvanceRecharge] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showRechargeDialog, setShowRechargeDialog] = useState(false);
  // Pioneer IPTV branch selection — operators can be assigned one or
  // more branches; if only one is assigned it's auto-selected silently,
  // otherwise the admin has to pick which branch to recharge into.
  const [pioneerBranches, setPioneerBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [pioneerBranchesLoading, setPioneerBranchesLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState("");
  // Guards the auto-default-tab logic below so it only ever picks a tab
  // ONCE per page load — without this, every data refetch (recharge
  // success, an edit, anything that re-runs syncPlans/fetchCustomer)
  // was silently snapping the view back to the "first visible provider"
  // default, discarding whatever tab the user had actually clicked
  // into. Starts true if the URL already names a tab (see the effect
  // below), since in that case there's nothing to auto-pick.
  const [defaultTabPicked, setDefaultTabPicked] = useState(false);

  // Changes the active tab AND remembers it in the URL (?tab=...) so a
  // page reload lands back on the same tab instead of always resetting
  // to the default. Use this instead of calling setActiveProvider
  // directly from a manual tab click.
  const selectProviderTab = (key) => {
    setActiveProvider(key);
    setDefaultTabPicked(true);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", key);
      return next;
    }, { replace: true });
  };

  const pioneerHasStb = pioneerStbs.length > 0;

  // Whether a given STB currently has time left — compared as a full
  // datetime since Pioneer plans can lapse mid-day, not just at midnight.
  const isPioneerStbActive = (stb) => {
    if (!stb?.expiration) return false;
    return new Date(stb.expiration) >= new Date();
  };

  // Best-effort package name for a box. The exact shape of Pioneer's
  // per-STB "plans" array isn't fully documented, so this tries the field
  // names that are most likely to be present and falls back gracefully.
  const getPioneerStbPackageName = (stb) => {
    const plans = Array.isArray(stb?.plans) ? stb.plans : [];
    if (plans.length === 0) return null;

    const names = plans
      .map((p) => p?.prdname || p?.planName || p?.name || p?.pkgname)
      .filter(Boolean);

    return names.length > 0 ? names.join(", ") : null;
  };

  // The two Pioneer IPTV packs (e.g. SD/HD) available to choose between at
  // recharge time. Adjust the filter below to match however your ott_plans
  // rows are actually tagged for this category if it differs.
  const pioneerPlanOptions = allPackDetails.filter(
    (p) => p.plan_category === "pioneeriptv" || p.category === "pioneeriptv"
  );

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: null
  });

  const [expiryData, setExpiryData] = useState({
    pioneeriptv: null,
    internet: null
  });

  const [expiryLoading, setExpiryLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    username: '',
    password: '',
    name: '',
    lastName: '',
    MobileNumber: '',
    EmailId: '',
    address: '',
    operatorDetails:
      role === "operator"
        ? `${user.operatorName || ''} - ${user.phoneNumber || ''}`
        : role === "admin"
          ? `${user.operatorName || ''} - ${user.operatorPhoneNumber || ''}`
          : "",  // superadmin chooses later
    autoplay: 'on',
    operatorId:
      role === "operator"
        ? user.operatorId
        : role === "admin"
          ? user.operatorId
          : "",
    remarks: ''
  });

  const [plansData, setPlansData] = useState({
    pioneeriptv: null
  });

  const [searchParams, setSearchParams] = useSearchParams();

  const internetId = searchParams.get("internet");

  useEffect(() => {
    if (!customer || allPackDetails.length === 0) return;

    const pioneeriptv = allPackDetails.find(
      p => Number(p.id) === Number(customer.pioneeriptv_planId)
    );

    setPlansData({
      pioneeriptv: pioneeriptv || null
    });

  }, [customer, allPackDetails]);


  const fetchCustomer = async () => {
    try {
      setLoading(true);

      const { data } = await apiClient.get(
        `/customer/get_customer_full_details.php?id=${id}`
      );

      setCustomer(data.customer);
      setBasePlan(data.base_plan);
      setAddons(data.addons || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed");
      toast.error("Failed to load customer");
    } finally {
      setLoading(false);
    }
  };

  const fetchOperator = async () => {
    if (!customer?.operatorId) return;

    try {
      const { data } = await apiClient.get(
        `/operator_api.php?id=${customer.operatorId}`
      );

      setOperator(data.operator);
    } catch {
      toast.error("Failed to load operator");
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

  useEffect(() => {
    if (role !== "operator") {
      fetchOperators();
    }
  }, [role]);


  useEffect(() => {
    fetchCustomer();
  }, []);

  useEffect(() => {
    if (customer) fetchOperator();
  }, [customer]);


  useEffect(() => {
    if (addons.length > 0 && allPackDetails.length > 0) {
      const mapped = addons.map((addon) => {
        const full = allPackDetails.find(
          (p) => Number(p.id) === Number(addon.plan_id)
        );

        return {
          ...(full || {}),
          ...addon,
        };
      });

      setMappedAddons(mapped);
    }
  }, [addons, allPackDetails]);

  const loadInternetCustomer = async (accountId) => {
    try {

      setInternetLoading(true);

      const { data } = await apiClient.get(
        `/customer/internet_customer_details.php?id=${accountId}`
      );

      if (data.status === 200) {

        setSelectedInternetAccount(accountId);

        setInternetInfo(data);

      } else {

        toast.error("Unable to load Internet details");

      }

    } catch (err) {

      toast.error("Failed to load Internet account");

    } finally {

      setInternetLoading(false);

    }
  };

  const syncPlans = async () => {
    if (!customer?.id) return;

    setExpiryLoading(true);
    setPioneerAddUserError(null);

    const res = await apiClient.get(
      `/customer/sync_user_plans.php?user_id=${customer.id}`,
      { responseType: "text", validateStatus: () => true }
    );

    const text = res.data;

    try {
      const data = JSON.parse(text);

      if (data.success) {
        // Pioneer's own STB record carries the exact expiration datetime
        // (plans can lapse mid-day, not just at midnight) — prefer that
        // over the date-only pioneeriptv_expiry field when it's available.
        // A customer can have MULTIPLE STBs, so we keep the full list and
        // just use the first one for the summary expiry shown on the card.
        const pioneerStbList = data?.pioneeriptv?.data?.stb || [];
        const pioneerStb = pioneerStbList[0];
        const pioneerExpiry =
          pioneerStb?.expiration ||
          data?.pioneeriptv?.data?.user?.expiration ||
          data.data.pioneeriptv_expiry;

        // Internet/OneRADIUS lookup, same shape as pioneeriptv:
        // { status, results: { expiry_date, package, sub_plan, ... } }.
        // Falls back to a plain internet_expiry column if the backend
        // hasn't started sending the full lookup payload yet.
        const internetExpiry =
          data?.internet?.results?.expiry_date || data.data.internet_expiry;

        setExpiryData({
          pioneeriptv: pioneerExpiry,
          internet: internetExpiry
        });

        setPioneerStbs(pioneerStbList);

        // Full per-provider lookup payload (status/desc), used to detect
        // customers who aren't registered with Pioneer IPTV yet.
        setPioneerIptvInfo(data.pioneeriptv || null);

        // Same idea for Internet — lets the card tell "not linked" apart
        // from "linked, here's the plan".
        const accounts = Array.isArray(data.internet)
          ? data.internet
          : [];

        setInternetAccounts(accounts);

        if (accounts.length > 0) {

          const selectedAccount =
            accounts.find(
              x => Number(x.internet_customer_id) === Number(internetId)
            ) ||
            accounts.find(
              x => Number(x.is_default) === 1
            ) ||
            accounts[0];

          loadInternetCustomer(selectedAccount.id);
          // Only force the tab to "internet" on first load, or when the
          // URL explicitly deep-links to a specific internet account
          // (?internet=...) — otherwise this was overriding whatever tab
          // the user had actually clicked into every time syncPlans()
          // re-ran (e.g. after any recharge/edit action refetches data).
          if (!defaultTabPicked || internetId) {
            selectProviderTab("internet");
          }

        }
      } else {
        toast.error("Failed to sync plans");
      }

    } catch (e) {
      console.error("INVALID JSON:", text);
      toast.error("Server returned invalid response");
    } finally {
      setExpiryLoading(false);
    }
  };

  useEffect(() => {
    if (customer?.id) {
      syncPlans();
    }
  }, [customer]);

  useEffect(() => {
    if (customer?.id) {
      syncPlans();
    }
  }, [customer?.id]);

  const isActivePlan = (expiry) => {
    if (!expiry) return false;

    const today = new Date();
    const exp = new Date(expiry);

    today.setHours(0, 0, 0, 0);
    exp.setHours(0, 0, 0, 0);

    return exp >= today;
  };

  useEffect(() => {

    // Guarded so this only ever picks a tab ONCE per page load — see
    // the defaultTabPicked comment above selectProviderTab. Without
    // this guard, every data refetch re-ran this and silently snapped
    // the view back to the default, discarding the user's actual
    // manual tab selection.
    if (defaultTabPicked) return;

    // If the URL already names a tab (survives a page reload — see
    // selectProviderTab), use that directly instead of computing a
    // fresh default, but only once that tab is actually available in
    // visiblePackages (it may still be loading on the very first
    // render, in which case this effect just runs again next time
    // visiblePackages changes, still guarded by defaultTabPicked above).
    const urlTab = searchParams.get("tab");
    if (urlTab && visiblePackages[urlTab]) {
      setActiveProvider(urlTab);
      setDefaultTabPicked(true);
      return;
    }

    // Otherwise, default to whichever provider is actually visible for
    // this customer, in the same priority order the tab list itself
    // uses (providerTabs, further down) — instead of the old hardcoded
    // "internet if enabled, otherwise always watcho" fallback, which
    // showed a blank/wrong tab for any customer who had neither of
    // those two specifically enabled (e.g. Pioneer IPTV only).
    // Keep this list in sync with providerTabs if a new provider is
    // ever added.
    const priorityOrder = ["internet", "pioneeriptv"];

    const firstVisibleKey = priorityOrder.find((key) => visiblePackages[key]);

    if (firstVisibleKey) {
      setActiveProvider(firstVisibleKey);
      setDefaultTabPicked(true);
    }

  }, [visiblePackages, expiryData, defaultTabPicked, searchParams]);

  const fetchVisiblePackages = async () => {
    try {
      const { data } = await apiClient.get(
        `/customer/get_customer_visible_packages.php?user_id=${customer.id}`
      );

      if (data.success) {
        setVisiblePackages(data.packages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (customer?.id && token) {
      fetchVisiblePackages();
    }
  }, [customer?.id, token]);

  const isExpired = (date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const openEditCustomerForm = (cust) => {
    setEditForm({
      id: cust.id,
      username: cust.username,
      password: cust.password,
      name: cust.name,
      lastName: cust.lastName,
      MobileNumber: cust.MobileNumber,
      EmailId: cust.EmailId,
      address: cust.address,
      ExpiryDate: cust.ExpiryDate,
      maximumDevices: cust.maximumDevices,
      operatorDetails: cust.operatorDetails,
      operatorId: cust.operatorId,
      autoplay: cust.autoplay,
      remarks: cust.remarks
    });
    setShowEditForm(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    if (name === "operatorId") {
      const selectedOperator = operators.find(o => String(o.id) === String(value));

      setEditForm(prev => ({
        ...prev,
        operatorId: value,
        operatorDetails: selectedOperator
          ? `${selectedOperator.operatorName} - ${selectedOperator.phoneNumber}`
          : ""
      }));
    } else {
      setEditForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!editForm.name.trim()) {
      toast.error("Name is required");
      return false;
    } else if (!nameRegex.test(editForm.name.trim())) {
      toast.error("Name can only contain letters and spaces");
      return false;
    }

    if (!editForm.lastName.trim()) {
      toast.error("Last Name is required");
      return false;
    } else if (!nameRegex.test(editForm.lastName.trim())) {
      toast.error("Last Name can only contain letters and spaces");
      return false;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(editForm.MobileNumber)) {
      toast.error("Please enter a valid 10-digit phone number.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (editForm.EmailId && !emailRegex.test(editForm.EmailId)) {
      toast.error("Please enter a valid email address.");
      return false;
    }

    return true;
  };

  const submitEditForm = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await apiClient.put('/allCustomers.php', editForm);
      toast.success('Customer updated successfully!');
      setShowEditForm(false);
      fetchCustomer()
    } catch (err) {
      toast.error('Failed to update Customer');
    } finally {
      setLoading(false);
    }
  };

  const isActive = (date) => new Date(date) >= new Date();

  const handleRenew = (type) => {
    setConfirmModal({ open: true, type });
  };

  const fetchPioneerBranches = async () => {
    setPioneerBranchesLoading(true);
    setSelectedBranch(null);
    try {
      const { data } = await apiClient.get(
        `/customer/get_pioneeriptv_branches.php?operator_id=${customer.operatorId}`
      );
      const branches = data?.branches || [];
      setPioneerBranches(branches);
      // Silent auto-select when there's only one — no need to ask.
      if (branches.length === 1) {
        setSelectedBranch(branches[0]);
      }
    } catch (err) {
      toast.error("Failed to load Pioneer IPTV branches");
      setPioneerBranches([]);
    } finally {
      setPioneerBranchesLoading(false);
    }
  };

  const openPioneerRechargePicker = (stb, isAdvance) => {

    setSelectedStb(stb);

    setAdvanceRecharge(isAdvance);

    setSelectedPlan(
      pioneerPlanOptions.length
        ? pioneerPlanOptions[0]
        : null
    );

    fetchPioneerBranches();

    setShowRechargeDialog(true);

  }

  const confirmPioneerRecharge = async () => {

    if (!selectedPlan)
      return;

    if (!selectedStb)
      return;

    if (!selectedBranch) {
      toast.warn("Please select a branch to recharge.");
      return;
    }

    // Prevent double click
    if (actionLoading === "pioneeriptv") return;

    try {

      setActionLoading("pioneeriptv");
      // console.log("Recharging Pioneer IPTV:", {
      //   customer_id: customer.id,
      //   device_id: selectedStb.stb_box,
      //   plan_id: selectedPlan.id,
      //   branch_id: selectedBranch.id,
      //   advance: advanceRecharge
      // });

      const response = await rechargePioneerPlan({

        customer_id: customer.id,

        device_id: selectedStb.stb_box,

        plan_id: selectedPlan.id,

        branch_id: selectedBranch.id,

        advance: advanceRecharge,

        // Only meaningful for advance recharge — lets the backend start
        // the new period right after the box's current expiry instead of
        // from today.
        current_expiry: selectedStb.expiration

      });

      // rechargePioneerPlan already shows its own toast.success on success —
      // no need to toast again here.

      setShowRechargeDialog(false);

      syncPlans();

      fetchCustomer();

    }

    catch (error) {

      // rechargePioneerPlan already shows a toast with the real backend
      // error message (or a network-error fallback) before re-throwing.
      // Toasting again here would only stack a generic, less useful
      // "Recharge failed" message on top of the specific one — so this
      // catch exists purely to stop the error here and let `finally`
      // reset the loading state, not to show anything itself.
      console.error("Pioneer recharge failed:", error);

    }

    finally {

      setActionLoading("");

    }

  }

  const confirmRecharge = async () => {
    const type = confirmModal.type;
    setConfirmModal({ open: false, type: null });

    setActionLoading(type);

    try {
      if (type === "pioneeriptv") {
        await rechargePioneerIptvPlan(customer.pioneeriptv_planId);
      }

    } finally {
      setActionLoading(null);
    }
  };

  const handleLinkInternetAccount = () => {
    navigate(`/link-internet-account/${customer.id}`)
  };

  const rechargePioneerPlan = async ({
    customer_id,
    device_id,
    plan_id,
    branch_id,
    advance,
    current_expiry
  }) => {
    try {
      const res = await apiClient.post(
        "/customer/recharge_pioneeriptv.php",
        {
          user_id: customer_id,
          plan_id,
          device_id,
          branch_id,
          advance,
          current_expiry
        }
      );

      const data = res.data;
      // console.log("Pioneer recharge response:", data);

      if (!data.success) {
        // Backend sends the failure reason under "error", not "message".
        throw new Error(data.error || "Recharge failed");
      }

      if (data.wallet !== undefined) {
        setOperator(prev => ({
          ...prev,
          wallet: data.wallet
        }));
      }

      const providerMsg =
        data?.pioneeriptv_response?.message ||
        data?.pioneeriptv_response?.data?.desc ||
        "Recharge successful";

      const cleanMsg = providerMsg.replace(/\s+/g, " ").trim();

      const message = cleanMsg.includes("Pre Renewed")
        ? "Advance Renewal successful ✅"
        : cleanMsg.includes("Renewed")
          ? "Recharge successful ✅"
          : cleanMsg.includes("Created")
            ? "Plan Activated successfully ✅"
            : cleanMsg;

      toast.success(message);

      return {
        ...data,
        message
      };

    } catch (err) {
      // The backend's error body looks like {"success":false,"error":"..."} —
      // key is "error", NOT "message". Axios rejects on any non-2xx status
      // (e.g. the 400 the backend sends for "Insufficient wallet balance"),
      // so this is the path that actually runs for most backend failures;
      // check both keys so real backend text is shown instead of Axios's
      // generic "Request failed with status code 400".
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Server error during recharge";

      toast.error(message);

      throw err;
    }
  };

  const rechargePioneerIptvPlan = async (planId) => {
    // if (!window.confirm("Are you sure you want to recharge Pioneer IPTV plan?")) return;

    try {
      const res = await apiClient.post(
        "/customer/recharge_pioneeriptv.php",
        {
          user_id: customer.id,
          plan_id: planId
        },
        { responseType: "text", validateStatus: () => true }
      );

      const text = res.data;

      let data;

      try {
        data = JSON.parse(text);

      } catch {
        console.error("INVALID JSON:", text);
        toast.error("Server returned invalid response");
        return;
      }

      // ❌ API FAILED
      if (res.status < 200 || res.status >= 300 || !data.success) {
        toast.error(data.error || "Recharge failed");
        return;
      }

      // ✅ GET PROVIDER MESSAGE
      const providerMsg =
        data?.pioneeriptv_response?.message || "Recharge successful";

      // normalize message (remove line breaks/spaces)
      const cleanMsg = providerMsg.replace(/\s+/g, " ").trim();

      // 🎯 SMART TOAST
      if (cleanMsg.includes("Pre Renewed")) {
        toast.success("Advance Renewal successful ✅");
      } else if (cleanMsg.includes("Renewed")) {
        toast.success("Recharge successful ✅");
      } else if (cleanMsg.includes("Created")) {
        toast.success("Plan Activated successfully ✅");
      } else {
        toast.success(cleanMsg);
      }

      // 💰 UPDATE WALLET (if returned)
      if (data.wallet !== undefined) {
        setOperator(prev => ({
          ...prev,
          wallet: data.wallet
        }));
      }

      // 🔄 REFRESH DATA
      syncPlans();
      fetchCustomer();

    } catch (err) {
      console.error("Pioneer IPTV error:", err);
      toast.error("Server error during recharge");
    }
  };

  const pioneerNeedsUser =
    !!pioneerIptvInfo && Number(pioneerIptvInfo.status) !== 200;

  const openAddPioneerUserDialog = () => {
    if (!customer?.id) return;
    fetchPioneerBranches();
    setShowAddPioneerUserDialog(true);
  };

  const handleAddPioneerUser = async () => {
    if (!customer?.id) return;

    if (!selectedBranch) {
      toast.warn("Please select a branch first.");
      return;
    }

    setAddUserLoading(true);
    setPioneerAddUserError(null);

    try {
      const res = await apiClient.post(
        "/customer/add_pioneeriptv_user.php",
        { user_id: customer.id, branch_id: selectedBranch.id },
        { responseType: "text", validateStatus: () => true }
      );

      const text = res.data;

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("INVALID JSON:", text);
        toast.error("Server returned invalid response");
        return;
      }

      if (res.status < 200 || res.status >= 300 || !data.success) {
        const rawError = data.error || "Failed to create Pioneer IPTV user";

        // Pioneer's own "Mobile Number Already Exists" wording is confusing
        // here, since it actually means the number is tied to a different
        // account on their side, not that this add attempt duplicated itself.
        const friendlyError = /mobile number already exists/i.test(rawError)
          ? "Mobile Number is Registered some where else."
          : rawError;

        setPioneerAddUserError(friendlyError);
        toast.error(friendlyError);
        return;
      }

      toast.success("Pioneer IPTV user created successfully");
      setShowAddPioneerUserDialog(false);

      // 🔄 REFRESH DATA
      syncPlans();
      fetchCustomer();

    } catch (err) {
      console.error("Add Pioneer IPTV user error:", err);
      toast.error("Server error while creating user");
    } finally {
      setAddUserLoading(false);
    }
  };

  // Unmap a Pioneer STB (e.g. customer swapped boxes). Uses the new
  // remove_pioneeriptv_stb.php endpoint.
  const handleRemovePioneerStb = async (deviceId) => {
    if (!customer?.id || !deviceId) return;
    if (!window.confirm(`Remove STB ${deviceId} from this customer's Pioneer IPTV account?`)) return;

    setPioneerRemoveStbLoading(true);

    try {
      const res = await apiClient.post(
        "/customer/remove_pioneeriptv_stb.php",
        { user_id: customer.id, device_id: deviceId },
        { responseType: "text", validateStatus: () => true }
      );

      const text = res.data;
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("INVALID JSON:", text);
        toast.error("Server returned invalid response");
        return;
      }

      if (res.status < 200 || res.status >= 300 || !data.success) {
        toast.error(data.error || "Failed to remove STB");
        return;
      }

      toast.success("STB removed successfully");
      syncPlans();

    } catch (err) {
      console.error("Remove Pioneer STB error:", err);
      toast.error("Server error while removing STB");
    } finally {
      setPioneerRemoveStbLoading(false);
    }
  };

  const triggerCooldown = (type, minutes = 5) => {
    const expiryTime = Date.now() + minutes * 60 * 1000;

    const updated = {
      ...renewCooldown,
      [type]: expiryTime
    };

    setRenewCooldown(updated);
    localStorage.setItem(`renewCooldown_${id}`, JSON.stringify(updated));
  };

  useEffect(() => {
    const stored = localStorage.getItem(`renewCooldown_${id}`);
    if (stored) {
      setRenewCooldown(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setRenewCooldown(prev => ({ ...prev }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const isCooldownActive = (type) => {
    const expiry = Number(renewCooldown[type]);
    return expiry && Date.now() < expiry;
  };

  const getRemainingTime = (type) => {
    const expiry = Number(renewCooldown[type]);
    if (!expiry) return null;

    const diff = expiry - Date.now();
    if (diff <= 0) return null;

    const min = Math.floor(diff / 60000);
    const sec = Math.floor((diff % 60000) / 1000);

    return `${min}m ${sec}s`;
  };

  const providerTabs = [
    {
      key: "internet",
      title: "🌐 Internet",
      visible: visiblePackages.internet
    },
    {
      key: "pioneeriptv",
      title: "📡 Pioneer IPTV",
      visible: visiblePackages.pioneeriptv
    }
  ];

  return (
    <>
      <Header />

      <div className="customer-page">

        {loading ? (
          <div className="customer-loading-container">
            <div className="customer-skeleton-card">
              {/* Header Skeleton */}
              <div className="skeleton-header">
                <div className="skeleton-title"></div>
              </div>

              {/* Customer Details Skeleton */}
              <div className="skeleton-details">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="skeleton-detail-row">
                    <div className="skeleton-label"></div>
                    <div className="skeleton-value"></div>
                  </div>
                ))}
              </div>

              {/* Package Skeleton */}
              <div className="skeleton-package-section">
                <div className="skeleton-package-header">
                  <div className="skeleton-package-title"></div>
                </div>
                <div className="skeleton-package-details">
                  <div className="skeleton-package-row">
                    <div className="skeleton-package-label"></div>
                    <div className="skeleton-package-value"></div>
                  </div>
                  <div className="skeleton-package-row">
                    <div className="skeleton-package-label"></div>
                    <div className="skeleton-package-value"></div>
                  </div>
                </div>
                <div className="skeleton-ott-container">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="skeleton-ott-item"></div>
                  ))}
                </div>
              </div>

              {/* Action Buttons Skeleton */}
              <div className="skeleton-actions">
                <div className="skeleton-button-group">
                  <div className="skeleton-button"></div>
                  <div className="skeleton-button"></div>
                </div>
                <div className="skeleton-button-group">
                  <div className="skeleton-button"></div>
                  <div className="skeleton-button"></div>
                </div>
              </div>
            </div>
          </div>
        ) : error ? (
          <p className="error">{error}</p>
        ) : (
          <div className="customer-container">

            {/* CUSTOMER DETAILS CARD */}
            {customer && (
              <div className="customer-profile-card">
                <div className="profile-card-header2">
                  <div className="profile-card-header">
                    <div className="profile-avatar-wrapper">
                      <div className="profile-avatar">
                        <div className="avatar-initials">
                          {customer.name?.charAt(0)}{customer.lastName?.charAt(0)}
                        </div>
                        <div className="avatar-status">
                          <span className={`status-dot ${customer.ExpiryDate && new Date(customer.ExpiryDate) >= new Date() ? 'active' : 'inactive'}`}></span>
                        </div>
                      </div>
                    </div>
                    <div className="profile-title-info">
                      <h2 className="profile-title">{customer.name} {customer.lastName}</h2>
                    </div>
                  </div>
                  <button
                    className="btn-edit-profile"
                    onClick={() => openEditCustomerForm(customer)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span className="btn-text-edit-customer">Edit</span>
                  </button>
                </div>

                <div className="profile-details-grid">
                  <div className="detail-item">
                    <div className="detail-info">
                      <label>📞 Phone Number: </label>
                      <p className="detail-value">{customer.MobileNumber}</p>
                    </div>
                  </div>

                    {customer.address && (
                      <div className="profile-address">
                        <div className="address-info">
                          <label>📍 Address: </label>
                          <p>{customer.address}</p>
                        </div>
                      </div>
                    )}

                </div>


              </div>
            )}

            {expiryLoading ? ("") : (
              <div className="provider-tabs">
                {providerTabs
                  .filter(tab => tab.visible)
                  .map(tab => (
                    <button
                      key={tab.key}
                      className={activeProvider === tab.key ? "active" : ""}
                      onClick={() => selectProviderTab(tab.key)}
                    >
                      {tab.title}
                    </button>
                  ))}
              </div>
            )}

            {expiryLoading ? (
              <div className="sync-loading-overlay">
                <div className="sync-loading-card">
                  <div className="sync-spinner"></div>
                </div>
              </div>
            ) : (

              <div className="section">
                <div className="plans-container">

                  {(activeProvider === "internet") && (
                    <>
                      <h2 className="plan-title title-internet">🌐 INTERNET</h2>
                      {internetAccounts.length > 1 && (
                        <div className="internet-account-tabs">

                          {internetAccounts.map((item) => (

                            <div
                              key={item.id}
                              className={`internet-account-chip ${selectedInternetAccount === item.id
                                ? "active"
                                : ""
                                }`}
                              onClick={() => loadInternetCustomer(item.id)}
                            >

                              <div className="chip-top">

                                <span className="chip-user">
                                  {item.internet_username}
                                </span>

                                <span
                                  className={`chip-status ${item.status === "Active"
                                    ? "active"
                                    : "expired"
                                    }`}
                                >
                                  {item.status}
                                </span>

                              </div>

                              <div className="chip-bottom">

                                {item.package_name}

                              </div>

                            </div>

                          ))}

                        </div>
                      )}
                      <InternetPlanCard
                        user={user}
                        internetInfo={internetInfo}
                        loading={internetActionLoading || actionLoading === "internet"}
                        onRecharge={(isAdvance) => {
                          setInternetRechargeAdvance(isAdvance);
                          setShowInternetRecharge(true);
                        }}
                        onLinkAccount={handleLinkInternetAccount}
                        onRemoveMac={() => setShowRemoveMac(true)}
                        onSessionHistory={() => setShowSessionHistory(true)}
                        onPassword={() => setShowPasswordModal(true)}
                        onChangeVerification={() => setShowVerification(true)}
                        onVerifyAadhaar={() => setShowVerifyAadhaar(true)}
                      />
                      <VerifyAadhaarModal
                        open={showVerifyAadhaar}
                        onClose={() => setShowVerifyAadhaar(false)}
                        internetId={selectedInternetAccount}
                        mobile={internetInfo?.results?.mobile}
                        operatorId={customer?.operatorId}
                        token={token}
                        onSuccess={() => {
                          setShowVerifyAadhaar(false);
                          loadInternetCustomer(selectedInternetAccount);
                          syncPlans();
                        }}
                      />
                      <InternetRechargeModal
                        open={showInternetRecharge}
                        onClose={() => setShowInternetRecharge(false)}
                        internetAccountId={selectedInternetAccount}
                        internetInfo={internetInfo}
                        operatorId={customer?.operatorId}
                        token={token}
                        advance={internetRechargeAdvance}
                        onSuccess={() => {
                          setShowInternetRecharge(false);
                          loadInternetCustomer(selectedInternetAccount);
                          syncPlans();
                        }}
                      />
                      <RemoveMacModal
                        open={showRemoveMac}
                        internetId={selectedInternetAccount}
                        token={token}
                        onClose={() => setShowRemoveMac(false)}
                        onSuccess={() => {
                          setShowRemoveMac(false);
                          syncPlans();
                        }}
                      />
                      <PasswordModal
                        open={showPasswordModal}
                        internetId={selectedInternetAccount}
                        token={token}
                        onClose={() => setShowPasswordModal(false)}
                      />

                      <VerificationModal
                        open={showVerification}
                        internetId={selectedInternetAccount}
                        token={token}
                        username={internetInfo?.results?.username_org}
                        customerName={`${internetInfo?.results?.firstname} ${internetInfo?.results?.lastname}`}
                        onClose={() => setShowVerification(false)}
                        onSuccess={() => {
                          loadInternetCustomer(selectedInternetAccount);
                        }}
                      />
                      <SessionHistoryModal
                        open={showSessionHistory}
                        internetId={selectedInternetAccount}
                        token={token}
                        onClose={() =>
                          setShowSessionHistory(false)
                        }
                      />
                    </>
                  )}

                  {(activeProvider === "pioneeriptv") && (
                    <>
                      <h2 className="plan-title title-pioneeriptv">PIONEER IPTV</h2>
                      <PioneerPlanCard
                        customer={customer}
                        pioneerInfo={pioneerIptvInfo}
                        pioneerStbs={pioneerStbs}
                        plans={pioneerPlanOptions}
                        loading={actionLoading === "pioneeriptv"}
                        addUserLoading={addUserLoading}
                        addUserError={pioneerAddUserError}
                        onAddUser={openAddPioneerUserDialog}
                        onRecharge={openPioneerRechargePicker}
                        onRemove={handleRemovePioneerStb}
                        removeLoading={pioneerRemoveStbLoading}
                      />
                    </>
                  )}


                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.open}
        message="Once recharge is successful, it cannot be cancelled or reverted. Please confirm before proceeding."
        onConfirm={confirmRecharge}
        onCancel={() => setConfirmModal({ open: false, type: null })}
      />

      {showEditForm && (
        <div className="modal-overlay">
          <div className="modal-content edit-modal">
            <div className="modal-header">
              <h3>Edit Customer</h3>
              <button className="close-modal" onClick={() => setShowEditForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                {role === "superadmin" && (
                  <div className="form-group">
                    <label>Username</label>
                    <input name="username" placeholder="Username" value={editForm.username} onChange={handleEditChange} />
                  </div>
                )}
                <div className="form-group">
                  <label>Password</label>
                  <div className="password-wrapper">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="New Password"
                      value={editForm.password}
                      onChange={handleEditChange}
                    />
                    <span
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </span>
                  </div>
                </div>
                <div className="form-group">
                  <label>First Name *</label>
                  <input name="name" placeholder="First Name" value={editForm.name} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input name="lastName" placeholder="Last Name" value={editForm.lastName} onChange={handleEditChange} />
                </div>
                {role === "superadmin" && (
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input name="MobileNumber" placeholder="Phone Number" value={editForm.MobileNumber} onChange={handleEditChange} />
                  </div>
                )}
                <div className="form-group">
                  <label>Email ID</label>
                  <input name="EmailId" placeholder="Email Id" value={editForm.EmailId} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input name="address" placeholder="Address" value={editForm.address} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Remarks</label>
                  <input name="remarks" placeholder="Remarks" value={editForm.remarks} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Operator Details</label>
                  {role !== "operator" ? (
                    <select
                      name="operatorId"
                      value={editForm.operatorId}
                      onChange={(e) => {
                        const selectedId = Number(e.target.value);
                        const allOptions =
                          role === "admin"
                            ? [
                              {
                                id: Number(user.operatorId),
                                operatorName: user.operatorName,
                                phoneNumber: user.operatorPhoneNumber
                              },
                              ...operators
                            ]
                            : operators;

                        const selectedOp = allOptions.find(op => op.id === selectedId);

                        setEditForm({
                          ...editForm,
                          operatorId: selectedId,
                          operatorDetails: selectedOp
                            ? `${selectedOp.operatorName} - ${selectedOp.phoneNumber}`
                            : '',
                        });
                      }}
                    >
                      <option value="">-- Select Operator/Admin --</option>
                      {role === "admin" && (
                        <option
                          key={`admin-${user.operatorId}`}
                          value={user.operatorId}
                        >
                          {user.operatorName} - {user.phoneNumber}
                        </option>
                      )}
                      {operators.map(o => (
                        <option key={o.id} value={o.id}>
                          {o.operatorName} - {o.phoneNumber}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name="operatorDetails"
                      placeholder="Operator Details"
                      value={`${user.operatorName || ''} - ${user.phoneNumber || ''}`}
                      readOnly
                    />
                  )}
                </div>
                {role === "superadmin" && (
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input
                      type="date"
                      id="ExpiryDate"
                      name="ExpiryDate"
                      value={editForm.ExpiryDate}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                )}
                <div className="form-group">
                  <label>Autoplay</label>
                  <select name="autoplay" value={editForm.autoplay} onChange={handleEditChange}>
                    <option value="on">Autoplay On</option>
                    <option value="off">Autoplay Off</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button disabled={loading} className="btn btn-primary" onClick={submitEditForm}>
                {loading ? "Updating..." : "Update Customer"}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowEditForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={showRechargeDialog}
        maxWidth="sm"
        fullWidth
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>

          <DialogTitle>

            Pioneer IPTV Recharge

          </DialogTitle>

          <Button

            onClick={() => setShowRechargeDialog(false)}
            style={{ color: "red" }}
          >

            ✕

          </Button>
        </div>

        <DialogContent>

          <Typography sx={{ mb: 2 }}>

            Device :
            {" "}
            {selectedStb?.stb_box}

          </Typography>

          <FormControl fullWidth>

            <InputLabel>

              Package

            </InputLabel>

            <Select

              value={selectedPlan?.id || ""}

              label="Package"

              onChange={(e) => {

                const p = pioneerPlanOptions.find(
                  x => x.id === e.target.value
                );

                setSelectedPlan(p);

              }}

            >

              {pioneerPlanOptions.map(plan =>

                <MenuItem
                  key={plan.id}
                  value={plan.id}
                  sx={{
                    whiteSpace: "normal",
                    alignItems: "flex-start",
                    lineHeight: 1.4,
                    py: 1
                  }}
                >
                  <div style={{ width: "100%", borderBottom: "1px solid #e0e0e0", paddingBottom: 4 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        wordBreak: "break-word"
                      }}
                    >
                      {plan.planName}
                    </div>

                    <div
                      style={{
                        color: "#1976d2",
                        fontSize: 15,
                        marginTop: 4,
                        textAlign: "right",
                      }}
                    >
                      ₹ {plan.planPrice}
                    </div>
                  </div>
                </MenuItem>

              )}

            </Select>

          </FormControl>

          {/* Branch selection — silent auto-select when the operator only
              has one branch assigned; a real picker when they have more
              than one. Nothing shown while still loading, and a clear
              warning if none are assigned at all (recharge is blocked
              server-side either way, but this makes the reason visible
              up front instead of failing after clicking Recharge). */}
          {pioneerBranchesLoading && (
            <Typography sx={{ mt: 2, color: "text.secondary", fontSize: 14 }}>
              Loading branches…
            </Typography>
          )}

          {!pioneerBranchesLoading && pioneerBranches.length > 1 && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Branch</InputLabel>
              <Select
                value={selectedBranch?.id || ""}
                label="Branch"
                onChange={(e) => {
                  const b = pioneerBranches.find(x => x.id === e.target.value);
                  setSelectedBranch(b);
                }}
              >
                {pioneerBranches.map(branch => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.display_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {!pioneerBranchesLoading && pioneerBranches.length === 1 && (
            <Typography sx={{ mt: 2, color: "text.secondary", fontSize: 14 }}>
              Branch: <strong>{pioneerBranches[0].display_name}</strong>
            </Typography>
          )}

          {!pioneerBranchesLoading && pioneerBranches.length === 0 && (
            <Typography sx={{ mt: 2, color: "error.main", fontSize: 14 }}>
              No Pioneer IPTV branch is assigned to this operator yet — recharge will be blocked until your admin assigns one.
            </Typography>
          )}

        </DialogContent>

        <DialogActions>

          <Button

            onClick={() => setShowRechargeDialog(false)}

          >

            Cancel

          </Button>

          <Button
            variant="contained"
            onClick={confirmPioneerRecharge}
            disabled={actionLoading === "pioneeriptv" || pioneerBranchesLoading || !selectedBranch}
          >

            {actionLoading === "pioneeriptv" ? "Processing..." : "Recharge"}


          </Button>

        </DialogActions>

      </Dialog>

      <Dialog
        open={showAddPioneerUserDialog}
        onClose={() => setShowAddPioneerUserDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <DialogTitle>Add Pioneer IPTV Customer</DialogTitle>
          <Button onClick={() => setShowAddPioneerUserDialog(false)} style={{ color: "red" }}>
            ✕
          </Button>
        </div>

        <DialogContent>
          <Typography sx={{ mb: 2, color: "text.secondary", fontSize: 14 }}>
            This creates a new Pioneer IPTV account for {customer?.name} {customer?.lastName}.
          </Typography>

          {pioneerBranchesLoading && (
            <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
              Loading branches…
            </Typography>
          )}

          {!pioneerBranchesLoading && pioneerBranches.length > 1 && (
            <FormControl fullWidth>
              <InputLabel>Branch</InputLabel>
              <Select
                value={selectedBranch?.id || ""}
                label="Branch"
                onChange={(e) => {
                  const b = pioneerBranches.find(x => x.id === e.target.value);
                  setSelectedBranch(b);
                }}
              >
                {pioneerBranches.map(branch => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.display_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {!pioneerBranchesLoading && pioneerBranches.length === 1 && (
            <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
              Branch: <strong>{pioneerBranches[0].display_name}</strong>
            </Typography>
          )}

          {!pioneerBranchesLoading && pioneerBranches.length === 0 && (
            <Typography sx={{ color: "error.main", fontSize: 14 }}>
              No Pioneer IPTV branch is assigned to this operator yet — creating an account will
              be blocked until your admin assigns one.
            </Typography>
          )}

          {pioneerAddUserError && (
            <Typography sx={{ mt: 2, color: "error.main", fontSize: 14 }}>
              {pioneerAddUserError}
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowAddPioneerUserDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddPioneerUser}
            disabled={addUserLoading || pioneerBranchesLoading || !selectedBranch}
          >
            {addUserLoading ? "Creating..." : "Create Account"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};



export default Customer;