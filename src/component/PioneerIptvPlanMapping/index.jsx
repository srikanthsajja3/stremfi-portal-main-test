import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { UserContext } from "../UserContext";
import Header from "../Header";
import apiClient from "../../api/client";
import "./index.css";

/**
 * Combined Pioneer IPTV plan catalog (superadmin add/deactivate) +
 * per-operator plan assignment with custom pricing, same pattern as
 * InternetPlanMapping — flat list (Pioneer plans were never a two-level
 * plan/sub-plan hierarchy), checkbox + price per row, bulk actions,
 * replace-all save.
 */
const PioneerIptvPlanMapping = () => {
  const { id } = useParams();
  const { user } = useContext(UserContext);
  const isSuperadmin = user?.role === "superadmin";
  const isAdmin = user?.role === "admin";

  const [operator, setOperator] = useState(null);
  const [plans, setPlans] = useState([]); // [{ id, plan_code, plan_name, description, duration, base_price, is_active }]
  const [mappedPlans, setMappedPlans] = useState({}); // { [plan_id]: price }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bulkAmount, setBulkAmount] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlan, setNewPlan] = useState({
    plan_code: "",
    plan_name: "",
    description: "",
    duration: "",
    base_price: "",
  });
  const [savingNewPlan, setSavingNewPlan] = useState(false);

  const fetchOperator = async () => {
    try {
      const { data } = await apiClient.get(`/operator_api.php?id=${id}`);
      setOperator(data.operator || null);
    } catch (err) {
      toast.error("Failed to load operator");
    }
  };

  const fetchPlans = async () => {
    try {
      const { data } = await apiClient.get("/pioneeriptv_plans.php");
      if (data.status === "success") {
        const list = data.plans || [];
        setPlans(isSuperadmin ? list : list.filter((p) => Number(p.is_active) === 1));
      }
    } catch (err) {
      toast.error("Failed to load Pioneer IPTV plans");
    }
  };

  const fetchMapping = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/pioneeriptv_operator_plan_mapping.php?operator_id=${id}`);
      if (data.status === "success" && Array.isArray(data.mappings)) {
        const map = {};
        data.mappings.forEach((m) => {
          map[m.plan_id] = m.price;
        });
        setMappedPlans(map);
      } else {
        setMappedPlans({});
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchMapping();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const findPlan = (planId) => plans.find((p) => p.id === Number(planId));

  const togglePlan = (planId) => {
    setMappedPlans((prev) => {
      const current = { ...prev };
      if (current[planId] !== undefined) {
        delete current[planId];
      } else {
        const p = findPlan(planId);
        let price = "";
        if (p) {
          const base = parseFloat(p.base_price);
          const bulk = bulkAmount && parseInt(bulkAmount) > 0 ? parseInt(bulkAmount) : 0;
          price = (base + bulk).toString();
        }
        current[planId] = price;
      }
      return current;
    });
  };

  const handlePriceChange = (planId, value) => {
    setMappedPlans((prev) => ({ ...prev, [planId]: value }));
  };

  const handleSelectAll = () => {
    const map = {};
    plans.forEach((p) => {
      if (isAdmin || isSuperadmin) {
        const base = parseFloat(p.base_price);
        const bulk = bulkAmount && parseInt(bulkAmount) > 0 ? parseInt(bulkAmount) : 0;
        map[p.id] = (base + bulk).toString();
      } else {
        map[p.id] = "";
      }
    });
    setMappedPlans(map);
  };

  const handleDeselectAll = () => {
    setMappedPlans({});
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
    const selectedIds = Object.keys(mappedPlans);
    if (selectedIds.length === 0) {
      toast.warn("No plans selected");
      return;
    }
    const updated = { ...mappedPlans };
    selectedIds.forEach((planId) => {
      const p = findPlan(planId);
      if (p) updated[planId] = (parseFloat(p.base_price) + amount).toString();
    });
    setMappedPlans(updated);
    toast.success(`Added ₹${amount} to ${selectedIds.length} plan(s)`);
  };

  const handleSaveMapping = async () => {
    const mappings = Object.keys(mappedPlans)
      .map((planId) => {
        const p = findPlan(planId);
        const entered = mappedPlans[planId];
        const price =
          entered !== "" && entered !== null && entered !== undefined
            ? parseFloat(entered)
            : p
              ? parseFloat(p.base_price)
              : null;
        return { plan_id: parseInt(planId), price };
      })
      .filter((m) => m.price !== null && !isNaN(m.price));

    if (mappings.length === 0) {
      toast.warn("No plans selected");
      return;
    }

    setSaving(true);
    try {
      const { data } = await apiClient.post("/pioneeriptv_operator_plan_mapping.php", {
        operator_id: id,
        mappings,
      });
      if (data.status === "success") {
        toast.success("Pioneer IPTV plan pricing saved successfully!");
        fetchMapping();
      } else {
        toast.error(data.message || "Failed to save mapping");
      }
    } catch (err) {
      toast.error("Server error while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPlan = async () => {
    if (!newPlan.plan_code || !newPlan.plan_name || !newPlan.duration || !newPlan.base_price) {
      toast.warn("Plan code, name, duration and base price are required");
      return;
    }
    setSavingNewPlan(true);
    try {
      const { data } = await apiClient.post("/pioneeriptv_plans.php", newPlan);
      if (data.status === "success") {
        toast.success("Plan added successfully");
        setNewPlan({ plan_code: "", plan_name: "", description: "", duration: "", base_price: "" });
        setShowAddForm(false);
        fetchPlans();
      } else {
        toast.error(data.error || "Failed to add plan");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add plan");
    } finally {
      setSavingNewPlan(false);
    }
  };

  const toggleActive = async (plan) => {
    try {
      const { data } = await apiClient.put("/pioneeriptv_plans.php", {
        id: plan.id,
        is_active: Number(plan.is_active) === 1 ? 0 : 1,
      });
      if (data.status === "success") {
        setPlans((prev) =>
          prev.map((p) => (p.id === plan.id ? { ...p, is_active: Number(plan.is_active) === 1 ? 0 : 1 } : p))
        );
      } else {
        toast.error(data.error || "Failed to update plan");
      }
    } catch (err) {
      toast.error("Failed to update plan");
    }
  };

  const deletePlan = async (planId) => {
    if (!window.confirm("Delete this plan? Any operator pricing and combo plans using it will be removed too.")) return;
    try {
      const { data } = await apiClient.delete(`/pioneeriptv_plans.php?id=${planId}`);
      if (data.status === "success") {
        toast.success("Plan deleted");
        fetchPlans();
      } else {
        toast.error(data.error || "Failed to delete plan");
      }
    } catch (err) {
      toast.error("Failed to delete plan");
    }
  };

  return (
    <>
      <Header />
      <div className="railtel-mapping-container">
        <h1>
          Pioneer IPTV Plans{" "}
          {operator && <span>— {operator.operatorName}</span>}{" "}
          {isAdmin && <span className="admin-badge">(Admin)</span>}
        </h1>

        {isSuperadmin && (
          <div className="plan-form-panel">
            <button className="bulk-btn" onClick={() => setShowAddForm((s) => !s)}>
              {showAddForm ? "Cancel" : "+ Add New Plan"}
            </button>

            {showAddForm && (
              <>
                <div className="plan-form-grid" style={{ marginTop: 12 }}>
                  <label>
                    Plan Code
                    <input
                      value={newPlan.plan_code}
                      onChange={(e) => setNewPlan({ ...newPlan, plan_code: e.target.value })}
                      placeholder="e.g. 101"
                    />
                  </label>
                  <label>
                    Plan Name
                    <input
                      value={newPlan.plan_name}
                      onChange={(e) => setNewPlan({ ...newPlan, plan_name: e.target.value })}
                      placeholder="e.g. SD Pack"
                    />
                  </label>
                  <label>
                    Description
                    <input
                      value={newPlan.description}
                      onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                      placeholder="Optional"
                    />
                  </label>
                  <label>
                    Duration (days)
                    <input
                      type="number"
                      value={newPlan.duration}
                      onChange={(e) => setNewPlan({ ...newPlan, duration: e.target.value })}
                      placeholder="e.g. 30"
                    />
                  </label>
                  <label>
                    Base Price (₹)
                    <input
                      type="number"
                      value={newPlan.base_price}
                      onChange={(e) => setNewPlan({ ...newPlan, base_price: e.target.value })}
                      placeholder="e.g. 199"
                    />
                  </label>
                </div>
                <div className="plan-form-actions">
                  <button className="save-btn" onClick={handleAddPlan} disabled={savingNewPlan}>
                    {savingNewPlan ? "Saving..." : "Save Plan"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {loading ? (
          <p>Loading mapped plans...</p>
        ) : plans.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📡</div>
            <p>No Pioneer IPTV plans configured yet.</p>
          </div>
        ) : (
          <>
            <div className="bulk-actions">
              <div className="bulk-selection">
                <div className="bulk-btn-group">
                  <button className="bulk-btn select-all-btn" onClick={handleSelectAll}>
                    Select All
                  </button>
                  <button className="bulk-btn deselect-all-btn" onClick={handleDeselectAll}>
                    Deselect All
                  </button>
                </div>
                <span className="selected-count">
                  {Object.keys(mappedPlans).length} of {plans.length} plans selected
                </span>
              </div>

              {(isAdmin || isSuperadmin) && (
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
                    <th>Plan Name</th>
                    <th>Duration</th>
                    <th>Base Price</th>
                    {isSuperadmin && <th>Status</th>}
                    <th>Assign</th>
                    <th>Custom Price</th>
                    <th>Difference</th>
                    {isSuperadmin && <th>Manage</th>}
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => {
                    const isSelected = mappedPlans[plan.id] !== undefined;
                    const customPrice = isSelected ? mappedPlans[plan.id] : "";
                    const basePrice = parseFloat(plan.base_price);
                    const difference = customPrice ? parseFloat(customPrice) - basePrice : 0;

                    return (
                      <tr key={plan.id} className={isSelected ? "selected" : ""}>
                        <td>
                          {plan.plan_name}
                          {plan.description && (
                            <div style={{ fontSize: "0.8rem", color: "#888" }}>{plan.description}</div>
                          )}
                        </td>
                        <td>{plan.duration} days</td>
                        <td>₹{basePrice}</td>
                        {isSuperadmin && (
                          <td>
                            <span className={`plan-status-badge ${Number(plan.is_active) === 1 ? "active" : "inactive"}`}>
                              {Number(plan.is_active) === 1 ? "Active" : "Inactive"}
                            </span>
                          </td>
                        )}
                        <td>
                          <input type="checkbox" checked={isSelected} onChange={() => togglePlan(plan.id)} />
                        </td>
                        <td>
                          {isSelected ? (
                            <input
                              type="number"
                              placeholder="Enter custom price"
                              value={customPrice}
                              onChange={(e) => handlePriceChange(plan.id, e.target.value)}
                              min="0"
                              step="0.01"
                            />
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>
                          {isSelected && customPrice ? (
                            <span className={`price-difference ${difference >= 0 ? "positive" : "negative"}`}>
                              {difference >= 0 ? "+" : ""}₹{difference}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        {isSuperadmin && (
                          <td>
                            <div className="plan-row-actions">
                              <button className="bulk-btn" onClick={() => toggleActive(plan)}>
                                {Number(plan.is_active) === 1 ? "Deactivate" : "Activate"}
                              </button>
                              <button className="bulk-btn deselect-all-btn" onClick={() => deletePlan(plan.id)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mapping-actions">
              <button
                className="save-btn"
                onClick={handleSaveMapping}
                disabled={saving || Object.keys(mappedPlans).length === 0}
              >
                {saving ? "Saving..." : `Save Mapping (${Object.keys(mappedPlans).length})`}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default PioneerIptvPlanMapping;
