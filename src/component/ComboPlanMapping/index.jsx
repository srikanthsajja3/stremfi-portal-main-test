import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { UserContext } from "../UserContext";
import Header from "../Header";
import apiClient from "../../api/client";
import "./index.css";

/**
 * Combined Combo Plan (Internet + Pioneer IPTV bundle) catalog
 * (superadmin add/deactivate) + per-operator combo assignment with
 * custom pricing. Same flat-list pattern as PioneerIptvPlanMapping —
 * a combo plan is just one Internet sub-plan + one Pioneer IPTV plan
 * bundled under one name and one price, no further hierarchy.
 */
const ComboPlanMapping = () => {
  const { id } = useParams();
  const { user } = useContext(UserContext);
  const isSuperadmin = user?.role === "superadmin";
  const isAdmin = user?.role === "admin";

  const [operator, setOperator] = useState(null);
  const [combos, setCombos] = useState([]); // [{ id, combo_name, internet_sub_plan_id, sub_plan_name, pioneeriptv_plan_id, pioneeriptv_plan_name, description, is_active }]
  const [internetSubPlans, setInternetSubPlans] = useState([]); // flattened [{ id, sub_plan_name, plan_name, base_price }]
  const [pioneerPlans, setPioneerPlans] = useState([]);
  const [mappedCombos, setMappedCombos] = useState({}); // { [combo_plan_id]: price }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bulkAmount, setBulkAmount] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newCombo, setNewCombo] = useState({
    combo_name: "",
    internet_sub_plan_id: "",
    pioneeriptv_plan_id: "",
    description: "",
  });
  const [savingNewCombo, setSavingNewCombo] = useState(false);

  const fetchOperator = async () => {
    try {
      const { data } = await apiClient.get(`/operator_api.php?id=${id}`);
      setOperator(data.operator || null);
    } catch (err) {
      toast.error("Failed to load operator");
    }
  };

  const fetchCombos = async () => {
    try {
      const { data } = await apiClient.get("/combo_plans.php");
      if (data.status === "success") {
        const list = data.combos || [];
        setCombos(isSuperadmin ? list : list.filter((c) => Number(c.is_active) === 1));
      }
    } catch (err) {
      toast.error("Failed to load combo plans");
    }
  };

  const fetchCatalogsForAddForm = async () => {
    if (!isSuperadmin) return;
    // Quietly refresh the shared Internet plan catalog first — same
    // idea as InternetPlanMapping. Uses THIS operator's own
    // credentials (?id=) since different operators can have distinct
    // RADIUS access. Throttled server-side, per-operator.
    try {
      await apiClient.post(`/sync_internet_plans.php?id=${id}`);
    } catch (err) {
      // Non-fatal — worst case the catalog is a little stale.
    }
    try {
      const { data } = await apiClient.get("/get_internet_plans_with_subplans.php");
      if (data.status === "success") {
        const flat = (data.plans || []).flatMap((p) =>
          (p.sub_plans || []).map((sp) => ({ ...sp, plan_name: p.plan_name }))
        );
        setInternetSubPlans(flat);
      }
    } catch (err) {
      // Non-fatal — the add-combo form just won't have options yet.
    }
    try {
      const { data } = await apiClient.get("/pioneeriptv_plans.php");
      if (data.status === "success") {
        setPioneerPlans((data.plans || []).filter((p) => Number(p.is_active) === 1));
      }
    } catch (err) {
      // same as above
    }
  };

  const fetchMapping = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/combo_operator_plan_mapping.php?operator_id=${id}`);
      if (data.status === "success" && Array.isArray(data.mappings)) {
        const map = {};
        data.mappings.forEach((m) => {
          map[m.combo_plan_id] = m.price;
        });
        setMappedCombos(map);
      } else {
        setMappedCombos({});
      }
    } catch (err) {
      toast.error("Failed to load operator mapping");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCombos();
    fetchOperator();
    fetchCatalogsForAddForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchMapping();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const findCombo = (comboId) => combos.find((c) => c.id === Number(comboId));

  // A combo's "base price" is just the sum of its two component base
  // prices — there's no separate base_price column on combo_plans
  // itself, since the whole point is it's built from two existing
  // priced things.
  const comboBasePrice = (combo) =>
    parseFloat(combo.internet_base_price || 0) + parseFloat(combo.pioneeriptv_base_price || 0);

  const toggleCombo = (comboId) => {
    setMappedCombos((prev) => {
      const current = { ...prev };
      if (current[comboId] !== undefined) {
        delete current[comboId];
      } else {
        const c = findCombo(comboId);
        let price = "";
        if (c) {
          const base = comboBasePrice(c);
          const bulk = bulkAmount && parseInt(bulkAmount) > 0 ? parseInt(bulkAmount) : 0;
          price = (base + bulk).toString();
        }
        current[comboId] = price;
      }
      return current;
    });
  };

  const handlePriceChange = (comboId, value) => {
    setMappedCombos((prev) => ({ ...prev, [comboId]: value }));
  };

  const handleSelectAll = () => {
    const map = {};
    combos.forEach((c) => {
      if (isAdmin || isSuperadmin) {
        const base = comboBasePrice(c);
        const bulk = bulkAmount && parseInt(bulkAmount) > 0 ? parseInt(bulkAmount) : 0;
        map[c.id] = (base + bulk).toString();
      } else {
        map[c.id] = "";
      }
    });
    setMappedCombos(map);
  };

  const handleDeselectAll = () => {
    setMappedCombos({});
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
    const selectedIds = Object.keys(mappedCombos);
    if (selectedIds.length === 0) {
      toast.warn("No combo plans selected");
      return;
    }
    const updated = { ...mappedCombos };
    selectedIds.forEach((comboId) => {
      const c = findCombo(comboId);
      if (c) updated[comboId] = (comboBasePrice(c) + amount).toString();
    });
    setMappedCombos(updated);
    toast.success(`Added ₹${amount} to ${selectedIds.length} combo(s)`);
  };

  const handleSaveMapping = async () => {
    const mappings = Object.keys(mappedCombos)
      .map((comboId) => {
        const c = findCombo(comboId);
        const entered = mappedCombos[comboId];
        const price =
          entered !== "" && entered !== null && entered !== undefined
            ? parseFloat(entered)
            : c
              ? comboBasePrice(c)
              : null;
        return { combo_plan_id: parseInt(comboId), price };
      })
      .filter((m) => m.price !== null && !isNaN(m.price));

    if (mappings.length === 0) {
      toast.warn("No combo plans selected");
      return;
    }

    setSaving(true);
    try {
      const { data } = await apiClient.post("/combo_operator_plan_mapping.php", {
        operator_id: id,
        mappings,
      });
      if (data.status === "success") {
        toast.success("Combo plan pricing saved successfully!");
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

  const handleAddCombo = async () => {
    if (!newCombo.combo_name || !newCombo.internet_sub_plan_id || !newCombo.pioneeriptv_plan_id) {
      toast.warn("Combo name, Internet sub-plan and Pioneer IPTV plan are all required");
      return;
    }
    setSavingNewCombo(true);
    try {
      const { data } = await apiClient.post("/combo_plans.php", newCombo);
      if (data.status === "success") {
        toast.success("Combo plan added successfully");
        setNewCombo({ combo_name: "", internet_sub_plan_id: "", pioneeriptv_plan_id: "", description: "" });
        setShowAddForm(false);
        fetchCombos();
      } else {
        toast.error(data.error || "Failed to add combo plan");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add combo plan");
    } finally {
      setSavingNewCombo(false);
    }
  };

  const toggleActive = async (combo) => {
    try {
      const { data } = await apiClient.put("/combo_plans.php", {
        id: combo.id,
        is_active: Number(combo.is_active) === 1 ? 0 : 1,
      });
      if (data.status === "success") {
        setCombos((prev) =>
          prev.map((c) => (c.id === combo.id ? { ...c, is_active: Number(combo.is_active) === 1 ? 0 : 1 } : c))
        );
      } else {
        toast.error(data.error || "Failed to update combo plan");
      }
    } catch (err) {
      toast.error("Failed to update combo plan");
    }
  };

  const deleteCombo = async (comboId) => {
    if (!window.confirm("Delete this combo plan? Any operator pricing for it will be removed too.")) return;
    try {
      const { data } = await apiClient.delete(`/combo_plans.php?id=${comboId}`);
      if (data.status === "success") {
        toast.success("Combo plan deleted");
        fetchCombos();
      } else {
        toast.error(data.error || "Failed to delete combo plan");
      }
    } catch (err) {
      toast.error("Failed to delete combo plan");
    }
  };

  return (
    <>
      <Header />
      <div className="railtel-mapping-container">
        <h1>
          Internet + Pioneer IPTV Combo Plans{" "}
          {operator && <span>— {operator.operatorName}</span>}{" "}
          {isAdmin && <span className="admin-badge">(Admin)</span>}
        </h1>

        {isSuperadmin && (
          <div className="plan-form-panel">
            <button className="bulk-btn" onClick={() => setShowAddForm((s) => !s)}>
              {showAddForm ? "Cancel" : "+ Add New Combo Plan"}
            </button>

            {showAddForm && (
              <>
                <div className="plan-form-grid" style={{ marginTop: 12 }}>
                  <label>
                    Combo Name
                    <input
                      value={newCombo.combo_name}
                      onChange={(e) => setNewCombo({ ...newCombo, combo_name: e.target.value })}
                      placeholder="e.g. 100 Mbps + SD Pack"
                    />
                  </label>
                  <label>
                    Internet Sub-Plan
                    <select
                      value={newCombo.internet_sub_plan_id}
                      onChange={(e) => setNewCombo({ ...newCombo, internet_sub_plan_id: e.target.value })}
                    >
                      <option value="">Select...</option>
                      {internetSubPlans.map((sp) => (
                        <option key={sp.id} value={sp.id}>
                          {sp.plan_name} — {sp.sub_plan_name} (₹{sp.base_price})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Pioneer IPTV Plan
                    <select
                      value={newCombo.pioneeriptv_plan_id}
                      onChange={(e) => setNewCombo({ ...newCombo, pioneeriptv_plan_id: e.target.value })}
                    >
                      <option value="">Select...</option>
                      {pioneerPlans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.plan_name} (₹{p.base_price})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Description
                    <input
                      value={newCombo.description}
                      onChange={(e) => setNewCombo({ ...newCombo, description: e.target.value })}
                      placeholder="Optional"
                    />
                  </label>
                </div>
                <div className="plan-form-actions">
                  <button className="save-btn" onClick={handleAddCombo} disabled={savingNewCombo}>
                    {savingNewCombo ? "Saving..." : "Save Combo Plan"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {loading ? (
          <p>Loading mapped combo plans...</p>
        ) : combos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <p>No combo plans configured yet.</p>
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
                  {Object.keys(mappedCombos).length} of {combos.length} combos selected
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
                    <th>Combo</th>
                    <th>Includes</th>
                    <th>Base Price</th>
                    {isSuperadmin && <th>Status</th>}
                    <th>Assign</th>
                    <th>Custom Price</th>
                    <th>Difference</th>
                    {isSuperadmin && <th>Manage</th>}
                  </tr>
                </thead>
                <tbody>
                  {combos.map((combo) => {
                    const isSelected = mappedCombos[combo.id] !== undefined;
                    const customPrice = isSelected ? mappedCombos[combo.id] : "";
                    const basePrice = comboBasePrice(combo);
                    const difference = customPrice ? parseFloat(customPrice) - basePrice : 0;

                    return (
                      <tr key={combo.id} className={isSelected ? "selected" : ""}>
                        <td>
                          {combo.combo_name}
                          {combo.description && (
                            <div style={{ fontSize: "0.8rem", color: "#888" }}>{combo.description}</div>
                          )}
                        </td>
                        <td style={{ fontSize: "0.85rem" }}>
                          🌐 {combo.sub_plan_name}
                          <br />
                          📡 {combo.pioneeriptv_plan_name}
                        </td>
                        <td>₹{basePrice}</td>
                        {isSuperadmin && (
                          <td>
                            <span className={`plan-status-badge ${Number(combo.is_active) === 1 ? "active" : "inactive"}`}>
                              {Number(combo.is_active) === 1 ? "Active" : "Inactive"}
                            </span>
                          </td>
                        )}
                        <td>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleCombo(combo.id)} />
                        </td>
                        <td>
                          {isSelected ? (
                            <input
                              type="number"
                              placeholder="Enter custom price"
                              value={customPrice}
                              onChange={(e) => handlePriceChange(combo.id, e.target.value)}
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
                              <button className="bulk-btn" onClick={() => toggleActive(combo)}>
                                {Number(combo.is_active) === 1 ? "Deactivate" : "Activate"}
                              </button>
                              <button className="bulk-btn deselect-all-btn" onClick={() => deleteCombo(combo.id)}>
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
                disabled={saving || Object.keys(mappedCombos).length === 0}
              >
                {saving ? "Saving..." : `Save Mapping (${Object.keys(mappedCombos).length})`}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ComboPlanMapping;