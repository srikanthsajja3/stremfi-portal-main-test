import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Header from "../Header";
import apiClient from "../../api/client";
import "./index.css";

/**
 * Which Aadhaar-verification provider(s) an operator can use — same
 * "assign like plans/branches" pattern as Pioneer IPTV branches,
 * just a fixed 2-item list rather than a fetched catalog.
 *
 * At verification time (Add Customer / Verify Aadhaar), the frontend
 * reads this via get_kyc_providers.php: one assigned → proceed with it
 * directly, two assigned → show a picker.
 */
const PROVIDERS = [
  { key: "digilocker", label: "DigiLocker", description: "Popup-based verification via DigiLocker's own portal." },
  { key: "scoreme", label: "ScoreMe (Aadhaar OTP)", description: "OTP sent directly to the Aadhaar holder's registered mobile — no popup." },
];

const KycProviderMapping = () => {
  const { id } = useParams();

  const [operator, setOperator] = useState(null);
  const [assignedProviders, setAssignedProviders] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchOperator = async () => {
    try {
      const { data } = await apiClient.get(`/operator_api.php?id=${id}`);
      setOperator(data.operator || null);
    } catch (err) {
      toast.error("Failed to load operator");
    }
  };

  const fetchMapping = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/kyc_operator_provider_mapping.php?operator_id=${id}`);
      if (data.success) {
        setAssignedProviders(new Set(data.providers || []));
      }
    } catch (err) {
      toast.error("Failed to load current provider assignment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperator();
    fetchMapping();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleProvider = (key) => {
    setAssignedProviders((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await apiClient.post("/kyc_operator_provider_mapping.php", {
        operator_id: id,
        providers: Array.from(assignedProviders),
      });
      if (data.success) {
        toast.success("KYC provider assignment saved");
      } else {
        toast.error(data.message || "Failed to save");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Server error while saving");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />
      <div className="kyc-mapping-container">
        <h1>
          Aadhaar Verification Providers{" "}
          {operator && <span>— {operator.operatorName}</span>}
        </h1>
        <p className="kyc-mapping-subtitle">
          If none are checked, this operator defaults to DigiLocker only. Check both to let
          this operator's staff choose which one to use at verification time.
        </p>

        {loading ? (
          <p>Loading current assignment...</p>
        ) : (
          <>
            <div className="kyc-provider-list">
              {PROVIDERS.map((p) => {
                const isSelected = assignedProviders.has(p.key);
                return (
                  <label key={p.key} className={`kyc-provider-row ${isSelected ? "selected" : ""}`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleProvider(p.key)}
                    />
                    <div>
                      <div className="kyc-provider-label">{p.label}</div>
                      <div className="kyc-provider-description">{p.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="kyc-mapping-actions">
              <button className="save-btn" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : `Save Assignment (${assignedProviders.size})`}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default KycProviderMapping;
