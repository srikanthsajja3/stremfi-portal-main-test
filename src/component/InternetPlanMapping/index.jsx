import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { UserContext } from "../UserContext";
import { toast } from "react-toastify";
import Header from "../Header";
import apiClient from "../../api/client";
import "./index.css";

const InternetPlanMapping = () => {
  const { id } = useParams();
  const { user, token } = useContext(UserContext);

  const [operator, setOperator] = useState(null);
  const [plans, setPlans] = useState([]);           // [{ id, plan_name, sub_plans: [...] }]
  const [mappedSubPlans, setMappedSubPlans] = useState({}); // { [sub_plan_id]: price }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [bulkAmount, setBulkAmount] = useState("");

  const isAdmin = user?.role === "admin";

  const toggleRowExpansion = (planId) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(planId) ? next.delete(planId) : next.add(planId);
      return next;
    });
  };

  // Flat list of all sub-plans across all packages — convenient for
  // Select All / bulk-amount math without nested loops everywhere.
  const allSubPlans = plans.flatMap((p) => p.sub_plans);

  const fetchOperator = async () => {
    try {
      const { data } = await apiClient.get(`/operator_api.php?id=${id}`);
      setOperator(data.operator || null);
    } catch (err) {
      toast.error("Failed to load operator");
    }
  };

  const fetchPlans = async () => {
    // Quietly refresh the shared Internet plan catalog first — no more
    // "Sync Internet Plans" dashboard button to remember to press.
    // Superadmin only (matches the sync endpoint's own gating); other
    // roles just read whatever's already there. Uses THIS operator's
    // own credentials (?id=) since different operators can have
    // distinct RADIUS partner/branch access — throttled per-operator
    // server-side, so opening this page repeatedly doesn't hammer the
    // RADIUS API.
    if (user?.role === "superadmin") {
      try {
        await apiClient.post(`/sync_internet_plans.php?id=${id}`);
      } catch (err) {
        // Non-fatal — worst case the catalog is a little stale.
      }
    }
    try {
      const { data } = await apiClient.get(
        "/get_internet_plans_with_subplans.php"
      );
      if (data.status === "success") {
        setPlans(data.plans || []);
      }
    } catch (err) {
      toast.error("Failed to load internet plans");
    }
  };

  const fetchOperatorMapping = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get(
        `/internet_operator_plan_mapping.php?operator_id=${id}`
      );

      if (data.status === "success" && Array.isArray(data.mappings)) {
        const map = {};
        data.mappings.forEach((m) => {
          map[m.sub_plan_id] = m.price;
        });
        setMappedSubPlans(map);
      } else {
        setMappedSubPlans({});
      }
    } catch (err) {
      toast.error("Failed to load operator mapping");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchOperator();
  }, []);

  useEffect(() => {
    fetchOperatorMapping();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const findSubPlan = (subPlanId) =>
    allSubPlans.find((sp) => sp.id === Number(subPlanId));

  const toggleSubPlan = (subPlanId) => {
    setMappedSubPlans((prev) => {
      const current = { ...prev };

      if (current[subPlanId] !== undefined) {
        delete current[subPlanId];
      } else {
        const sp = findSubPlan(subPlanId);
        let price = "";

        if (sp) {
          const base = parseFloat(sp.base_price);
          const bulk = bulkAmount && parseInt(bulkAmount) > 0 ? parseInt(bulkAmount) : 0;
          price = (base + bulk).toString();
        }

        current[subPlanId] = price;
      }

      return current;
    });
  };

  const handlePriceChange = (subPlanId, value) => {
    setMappedSubPlans((prev) => ({ ...prev, [subPlanId]: value }));
  };

  const handleSelectAll = () => {
    const map = {};
    allSubPlans.forEach((sp) => {
      if (isAdmin) {
        const base = parseFloat(sp.base_price);
        const bulk = bulkAmount && parseInt(bulkAmount) > 0 ? parseInt(bulkAmount) : 0;
        map[sp.id] = (base + bulk).toString();
      } else {
        map[sp.id] = "";
      }
    });
    setMappedSubPlans(map);
  };

  const handleDeselectAll = () => {
    setMappedSubPlans({});
    setBulkAmount("");
  };

  const applyBulkAmount = () => {
    if (!bulkAmount || isNaN(parseInt(bulkAmount))) {
      toast.warn("Please enter a valid amount");
      return;
    }
    const amount = parseInt(bulkAmount);
    if (amount < 0) {
      toast.warn("Amount cannot be negative");
      return;
    }

    const selectedIds = Object.keys(mappedSubPlans);
    if (selectedIds.length === 0) {
      toast.warn("No sub-plans selected");
      return;
    }

    const updated = { ...mappedSubPlans };
    selectedIds.forEach((subPlanId) => {
      const sp = findSubPlan(subPlanId);
      if (sp) {
        updated[subPlanId] = (parseFloat(sp.base_price) + amount).toString();
      }
    });

    setMappedSubPlans(updated);
    toast.success(`Added ₹${amount} to ${selectedIds.length} sub-plan(s)`);
  };

  const allSelected =
    allSubPlans.length > 0 &&
    Object.keys(mappedSubPlans).length === allSubPlans.length;

  const handleSaveMapping = async () => {
    const mappings = Object.keys(mappedSubPlans)
      .map((subPlanId) => {
        const sp = findSubPlan(subPlanId);
        const entered = mappedSubPlans[subPlanId];

        // Fall back to the sub-plan's base price when no custom price was
        // entered, instead of dropping the selection from the payload.
        const price =
          entered !== "" && entered !== null && entered !== undefined
            ? parseFloat(entered)
            : sp
              ? parseFloat(sp.base_price)
              : null;

        return {
          sub_plan_id: parseInt(subPlanId),
          price
        };
      })
      .filter((m) => m.price !== null && !isNaN(m.price)); // only drop truly unresolvable ones (sub-plan not found)

    if (mappings.length === 0) {
      toast.warn("No sub-plans selected");
      return;
    }

    setSaving(true);
    try {
      const { data } = await apiClient.post(
        "/internet_operator_plan_mapping.php",
        { operator_id: id, mappings }
      );

      if (data.status === "success") {
        toast.success("Internet plan pricing saved successfully!");
        fetchOperatorMapping(); // refresh so the UI reflects what actually saved
      } else {
        toast.error(data.message || "Failed to save mapping");
      }
    } catch (err) {
      toast.error("Server error while saving");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />

      <div className="mapping-container">
        <h1>
          Internet Plan Mapping{" "}
          {operator && <span>— {operator.operatorName}</span>}{" "}
          {isAdmin && <span className="admin-badge">(Admin)</span>}
        </h1>

        {loading ? (
          <p>Loading mapped plans...</p>
        ) : plans.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌐</div>
            <p>No Internet packages configured yet.</p>
          </div>
        ) : (
          <>
            <div className="bulk-actions">
              <div className="bulk-selection">
                <div className="bulk-btn-group">
                  <button
                    className="bulk-btn select-all-btn"
                    onClick={handleSelectAll}
                    disabled={allSelected}
                  >
                    Select All
                  </button>
                  <button className="bulk-btn deselect-all-btn" onClick={handleDeselectAll}>
                    Deselect All
                  </button>
                </div>
                <span className="selected-count">
                  {Object.keys(mappedSubPlans).length} of {allSubPlans.length} sub-plans selected
                </span>
              </div>

              {isAdmin && (
                <div className="bulk-amount-section">
                  <input
                    type="number"
                    placeholder="Bulk add amount"
                    value={bulkAmount}
                    onChange={(e) => setBulkAmount(e.target.value)}
                  />
                  <button className="bulk-btn" onClick={applyBulkAmount}>
                    Apply to Selected
                  </button>
                </div>
              )}
            </div>

            <div className="mapping-table-container">
              <table className="mapping-table">
                <thead>
                  <tr>
                    <th>Package</th>
                    <th>Sub Plan</th>
                    <th>Assign</th>
                    <th>Base Price</th>
                    <th>Custom Price</th>
                    <th>Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <React.Fragment key={plan.id}>
                      <tr className="plan-group-row">
                        <td colSpan="6">
                          <button
                            className="expand-btn"
                            onClick={() => toggleRowExpansion(plan.id)}
                          >
                            {expandedRows.has(plan.id) ? "−" : "+"}
                          </button>
                          <strong style={{ marginLeft: 8 }}>{plan.plan_name}</strong>
                          <span style={{ marginLeft: 8, color: "#888" }}>
                            ({plan.sub_plans.length} sub-plan{plan.sub_plans.length !== 1 ? "s" : ""})
                          </span>
                        </td>
                      </tr>

                      {expandedRows.has(plan.id) &&
                        plan.sub_plans.map((sp) => {
                          const isSelected = mappedSubPlans[sp.id] !== undefined;
                          const customPrice = isSelected ? mappedSubPlans[sp.id] : "";
                          const basePrice = parseFloat(sp.base_price);
                          const difference = customPrice
                            ? parseFloat(customPrice) - basePrice
                            : 0;

                          return (
                            <tr key={sp.id} className={isSelected ? "selected" : ""}>
                              <td></td>
                              <td>{sp.sub_plan_name}</td>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSubPlan(sp.id)}
                                />
                              </td>
                              <td>₹{basePrice}</td>
                              <td>
                                {isSelected ? (
                                  <input
                                    type="number"
                                    placeholder="Enter custom price"
                                    value={customPrice}
                                    onChange={(e) => handlePriceChange(sp.id, e.target.value)}
                                    min="0"
                                    step="0.01"
                                  />
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td>
                                {isSelected && customPrice ? (
                                  <span
                                    className={`price-difference ${difference >= 0 ? "positive" : "negative"}`}
                                  >
                                    {difference >= 0 ? "+" : ""}₹{difference}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mapping-actions">
              <button
                className="save-btn"
                onClick={handleSaveMapping}
                disabled={saving || Object.keys(mappedSubPlans).length === 0}
              >
                {saving ? "Saving..." : `Save Mapping (${Object.keys(mappedSubPlans).length})`}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default InternetPlanMapping;