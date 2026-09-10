import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { UserContext } from "../UserContext";
import Header from "../Header";
import apiClient from "../../api/client";
import "./index.css";

/**
 * Which Internet branches (franchise locations) this operator/admin is
 * allowed to manage — same flat checkbox pattern as
 * PioneerIptvBranchMapping. An operator can be assigned more than one
 * branch; each branch is expected to belong to exactly one operator in
 * practice, but nothing here hard-enforces that (same as the Pioneer
 * table this mirrors) — sync_internet_customers.php reports it as
 * "ambiguous" rather than guessing if a branch ever ends up assigned
 * to more than one operator.
 */
const InternetBranchMapping = () => {
  const { id } = useParams();
  const { user } = useContext(UserContext);

  const [operator, setOperator] = useState(null);
  const [branches, setBranches] = useState([]); // [{ id, branch_code, branch_name, partner_name }]
  const [assignedBranchIds, setAssignedBranchIds] = useState(new Set());
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
    // Quietly refresh the shared Internet partner/branch catalog first
    // — no more "Sync Partners & Branches" dashboard button to
    // remember to press. Superadmin only (matches the sync endpoint's
    // own gating); admins just read whatever's already there. Uses
    // THIS operator's own credentials (?id=) since different
    // operators can have distinct RADIUS access. Throttled
    // server-side, per-operator.
    if (user?.role === "superadmin") {
      try {
        await apiClient.post(`/sync_internet_partners_and_branches.php?id=${id}`);
      } catch (err) {
        // Non-fatal — worst case the catalog is a little stale.
      }
    }
    try {
      const { data } = await apiClient.get("/get_internet_partners_and_branches.php");
      if (data.status === "success") {
        const flat = (data.partners || []).flatMap((p) =>
          (p.branches || []).map((b) => ({ ...b, partner_name: p.partner_name }))
        );
        setBranches(flat);
      }
    } catch (err) {
      toast.error("Failed to load branches");
    }
  };

  const fetchMapping = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/internet_operator_branch_mapping.php?operator_id=${id}`);
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
      const { data } = await apiClient.post("/internet_operator_branch_mapping.php", {
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

  return (
    <>
      <Header />
      <div className="railtel-mapping-container">
        <h1>
          Internet Branches{" "}
          {operator && <span>— {operator.operatorName}</span>}
        </h1>

        {loading ? (
          <p>Loading current assignment...</p>
        ) : branches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌐</div>
            <p>
              No Internet branches found yet. They're refreshed automatically each time this
              page opens — if none show up, check that Internet Base URL and Token are set
              correctly on the Superadmin account.
            </p>
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
                    <th>Partner</th>
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
                        <td>{branch.partner_name}</td>
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

export default InternetBranchMapping;