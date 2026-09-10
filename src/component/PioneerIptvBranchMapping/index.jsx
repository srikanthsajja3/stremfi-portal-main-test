import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { UserContext } from "../UserContext";
import Header from "../Header";
import apiClient from "../../api/client";
import "./index.css";

/**
 * Simpler than RailtelPlanMapping / PlanMapping — branches aren't priced,
 * assigning one just means "this operator is allowed to recharge into
 * this branch". Flat checkbox list, no per-row price input.
 *
 * Also doubles as where custom (friendlier) branch names get set —
 * Pioneer's own branch_name values are raw codes like "POL_VJW", so
 * superadmin can give each one a real name here. Falls back to
 * branch_name everywhere a custom_name hasn't been set.
 */
const PioneerIptvBranchMapping = () => {
  const { id } = useParams();
  const { user } = useContext(UserContext);
  const isSuperadmin = user?.role === "superadmin";

  const [operator, setOperator] = useState(null);
  const [branches, setBranches] = useState([]); // [{ id, branch_code, branch_name, custom_name, is_active }]
  const [assignedBranchIds, setAssignedBranchIds] = useState(new Set());
  const [customNameDrafts, setCustomNameDrafts] = useState({}); // { [branchId]: string } — local edits before save
  const [savingNameId, setSavingNameId] = useState(null);
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

  const fetchBranches = async () => {
    try {
      const { data } = await apiClient.get("/get_pioneeriptv_branches.php");
      if (data.status === "success") {
        const active = (data.branches || []).filter(b => b.is_active === 1 || b.is_active === "1");
        setBranches(active);
        const drafts = {};
        active.forEach(b => { drafts[b.id] = b.custom_name || ""; });
        setCustomNameDrafts(drafts);
      }
    } catch (err) {
      toast.error("Failed to load branches");
    }
  };

  const fetchMapping = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/pioneeriptv_operator_branch_mapping.php?operator_id=${id}`);
      if (data.status === "success") {
        setAssignedBranchIds(new Set((data.branch_ids || []).map(Number)));
      }
    } catch (err) {
      toast.error("Failed to load current branch assignment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchOperator();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchMapping();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleBranch = (branchId) => {
    setAssignedBranchIds((prev) => {
      const next = new Set(prev);
      if (next.has(branchId)) {
        next.delete(branchId);
      } else {
        next.add(branchId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setAssignedBranchIds(new Set(branches.map((b) => b.id)));
  };

  const handleDeselectAll = () => {
    setAssignedBranchIds(new Set());
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await apiClient.post("/pioneeriptv_operator_branch_mapping.php", {
        operator_id: id,
        branch_ids: Array.from(assignedBranchIds),
      });
      if (data.status === "success") {
        toast.success("Branch assignment saved successfully!");
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch (err) {
      toast.error("Server error while saving");
    } finally {
      setSaving(false);
    }
  };

  // Saves a single branch's custom name — separate from the assignment
  // save above, since renaming a branch is a global catalog edit
  // (superadmin only), not part of "which branches does this operator
  // have".
  const saveCustomName = async (branchId) => {
    const original = branches.find(b => b.id === branchId);
    const newName = (customNameDrafts[branchId] || "").trim();

    if ((original?.custom_name || "") === newName) return; // nothing changed

    setSavingNameId(branchId);
    try {
      const { data } = await apiClient.put("/get_pioneeriptv_branches.php", {
        id: branchId,
        custom_name: newName,
      });
      if (data.status === "success") {
        setBranches(prev => prev.map(b => b.id === branchId ? { ...b, custom_name: newName || null } : b));
        toast.success("Custom name saved");
      } else {
        toast.error(data.error || "Failed to save custom name");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save custom name");
    } finally {
      setSavingNameId(null);
    }
  };

  return (
    <>
      <Header />
      <div className="railtel-mapping-container">
        <h1>
          Pioneer IPTV Branches{" "}
          {operator && <span>— {operator.operatorName}</span>}
        </h1>

        {loading ? (
          <p>Loading current assignment...</p>
        ) : branches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📡</div>
            <p>No Pioneer IPTV branches configured yet.</p>
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
                  {assignedBranchIds.size} of {branches.length} branches assigned
                </span>
              </div>
            </div>

            <div className="mapping-table-container">
              <table className="mapping-table">
                <thead>
                  <tr>
                    <th>Branch Name</th>
                    <th>Custom Name</th>
                    <th>Branch Code</th>
                    <th>Assign</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((branch) => {
                    const isSelected = assignedBranchIds.has(branch.id);
                    return (
                      <tr key={branch.id} className={isSelected ? "selected" : ""}>
                        <td>{branch.branch_name}</td>
                        <td>
                          {isSuperadmin ? (
                            <input
                              type="text"
                              placeholder="e.g. Vijayawada"
                              value={customNameDrafts[branch.id] ?? ""}
                              onChange={(e) =>
                                setCustomNameDrafts((prev) => ({ ...prev, [branch.id]: e.target.value }))
                              }
                              onBlur={() => saveCustomName(branch.id)}
                              disabled={savingNameId === branch.id}
                              style={{ width: "100%", padding: "4px 8px" }}
                            />
                          ) : (
                            branch.custom_name || <em>not set</em>
                          )}
                        </td>
                        <td>{branch.branch_code}</td>
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleBranch(branch.id)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mapping-actions">
              <button className="save-btn" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : `Save Assignment (${assignedBranchIds.size})`}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default PioneerIptvBranchMapping;
