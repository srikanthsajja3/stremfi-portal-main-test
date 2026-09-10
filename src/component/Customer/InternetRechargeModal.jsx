import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  CircularProgress
} from "@mui/material";
import { toast } from "react-toastify";
import apiClient from "../../api/client";

const InternetRechargeModal = ({
  open,
  onClose,
  internetAccountId,
  internetInfo,
  operatorId,
  advance,
  onSuccess
}) => {
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);

  const [selectedPackage, setSelectedPackage] = useState(null);
  const [subPlans, setSubPlans] = useState([]);
  const [selectedSubPlanId, setSelectedSubPlanId] = useState("");
  const [loadingSubPlans, setLoadingSubPlans] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const desiredSubPlanCodeRef = useRef(null);

  useEffect(() => {
    if (!open || !operatorId) return;

    let cancelled = false;

    const fetchAndPreselect = async () => {
      setLoadingPackages(true);
      setSelectedPackage(null);
      setSubPlans([]);
      setSelectedSubPlanId("");

      try {
        const { data } = await apiClient.get(
          `/customer/get_internet_plans.php?operator_id=${operatorId}`
        );

        if (cancelled) return;

        if (!data.success) {
          toast.error(data.error || "Failed to load internet packages");
          setPackages([]);
          return;
        }

        const list = data.plans || [];
        setPackages(list);

        if (list.length === 0) return;

        const currentPackageCode = internetInfo?.results?.package_id;
        const currentSubPlanCode = internetInfo?.results?.sub_plan_id;

        desiredSubPlanCodeRef.current =
          currentSubPlanCode !== undefined && currentSubPlanCode !== null
            ? String(currentSubPlanCode)
            : null;


        const matched =
          currentPackageCode !== undefined && currentPackageCode !== null
            ? list.find((p) => String(p.plan_code) === String(currentPackageCode))
            : null;

        setSelectedPackage(matched || list[0]);
      } catch (err) {
        if (!cancelled) toast.error("Failed to load internet packages");
      } finally {
        if (!cancelled) setLoadingPackages(false);
      }
    };

    fetchAndPreselect();

    return () => {
      cancelled = true;
    };
  }, [open, operatorId, internetInfo]);

  // Fetch sub-plans (with pricing) whenever the package changes.
  useEffect(() => {
    if (!open || !selectedPackage) return;

    const fetchSubPlans = async () => {
      setLoadingSubPlans(true);
      setSubPlans([]);
      setSelectedSubPlanId("");

      try {
        const { data } = await apiClient.get(
          `/customer/internet_subplans.php?package_id=${selectedPackage.id}&internet_id=${internetAccountId}`
        );

        if (data.success) {
          const list = data.sub_plans || [];
          setSubPlans(list);

          if (list.length) {
            const desired = desiredSubPlanCodeRef.current;
            const match = desired
              ? list.find((sp) => String(sp.sub_plan_code) === desired)
              : null;

            setSelectedSubPlanId((match || list[0]).id);
          }

          desiredSubPlanCodeRef.current = null;
        } else {
          toast.error(data.error || "No sub-plans found for this package");
        }
      } catch (err) {
        toast.error("Failed to load sub-plans");
      } finally {
        setLoadingSubPlans(false);
      }
    };

    fetchSubPlans();
  }, [selectedPackage, open, internetAccountId]);

  const handleConfirm = async () => {
  if (!selectedPackage || !selectedSubPlanId) {
    toast.error("Select a package and sub-plan first");
    return;
  }
  if (submitting) return;

  setSubmitting(true);

  try {
    const res = await apiClient.post(
      "/customer/recharge_internet.php",
      {
        internet_id: internetAccountId,
        package_id: selectedPackage.id,
        sub_plan_id: selectedSubPlanId,
        advance
      },
      {
        responseType: "text",
        validateStatus: () => true, // handle non-2xx ourselves, same as the old res.ok check
      }
    );

    let data;
    try {
      data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
    } catch (parseErr) {
      // Not valid JSON — log the raw body so the real PHP error is visible
      // in devtools instead of a generic toast.
      console.error("Non-JSON response from recharge_internet.php:", res.data);
      toast.error("Server returned an invalid response. Check console for details.");
      return;
    }

    if (res.status < 200 || res.status >= 300 || !data.success) {
      toast.error(data.error || "Renewal failed");
      return;
    }

    toast.success(
      advance ? "Advance Renewal successful ✅" : "Recharge successful ✅"
    );
    onSuccess?.();
  } catch (err) {
    console.error("Network error during renewal:", err);
    toast.error("Network error during renewal");
  } finally {
    setSubmitting(false);
  }
};

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {advance ? "Internet Advance Renewal" : "Internet Recharge"}
      </DialogTitle>

      <DialogContent>
        <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
          <InputLabel>Package</InputLabel>
          <Select
            value={selectedPackage?.id || ""}
            label="Package"
            disabled={loadingPackages || packages.length === 0}
            onChange={(e) => {
              const p = packages.find((x) => x.id === e.target.value);
              setSelectedPackage(p || null);
            }}
          >
            {packages.map((plan) => (
              <MenuItem key={plan.id} value={plan.id}>
                {plan.plan_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Sub Plan</InputLabel>
          <Select
            value={selectedSubPlanId}
            label="Sub Plan"
            disabled={loadingSubPlans || subPlans.length === 0}
            onChange={(e) => setSelectedSubPlanId(e.target.value)}
          >
            {subPlans.map((sp) => (
              <MenuItem key={sp.id} value={sp.id}>
                {sp.name} — ₹{sp.price}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {(loadingPackages || loadingSubPlans) && (
          <Typography sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={16} />
            {loadingPackages ? "Loading packages..." : "Loading sub-plans..."}
          </Typography>
        )}

        {!loadingPackages && packages.length === 0 && (
          <Typography sx={{ mt: 1 }} color="text.secondary">
            No Internet packages are assigned to this operator yet. Please contact your admin.
          </Typography>
        )}

        {!loadingSubPlans && selectedPackage && subPlans.length === 0 && (
          <Typography sx={{ mt: 1 }} color="text.secondary">
            No sub-plans available for this package.
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={submitting || !selectedSubPlanId}
        >
          {submitting ? "Processing..." : advance ? "Advance Renewal" : "Recharge"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InternetRechargeModal;