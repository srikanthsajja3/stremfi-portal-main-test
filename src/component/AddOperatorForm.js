import React, { useState, useContext, useEffect, useRef } from 'react';
import apiClient from '../api/client';
import { UserContext } from "./UserContext";
import { useNavigate } from 'react-router-dom';
import './AddOperatorForm.css'; // 🎨 Add your CSS here
import FormHeader from '../FormHeader';
import { toast } from 'react-toastify';

const AddOperatorForm = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
    networkName: "",
    operatorName: "",
    phoneNumber: "",
    Email: "",
    address: "",

    operCode: user?.operCode || "",

    internetEnabled: user?.internetEnabled || 0,
    internetBaseUrl: user?.internetBaseUrl || "",
    internetToken: user?.internetToken || "",
    internetPartnerId: "",
    internetBranchId: "",

    pioneeriptvOprId: user?.pioneeriptvOprId || "",
    pioneeriptvToken: user?.pioneeriptvToken || "",

    role: "operator",
    created_by: user?.id,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // "Add this operator under" — lets a superadmin pick which admin (or
  // themselves) this new operator reports to, instead of it always
  // defaulting to whoever's currently logged in. Selecting one also
  // auto-fills the Internet/Pioneer credentials below FROM that
  // parent's own account, since operators don't have a way to type
  // their own (only superadmin sees those fields at all).
  const [parentOptions, setParentOptions] = useState([]); // full operator_details rows, role admin/superadmin
  const [selectedParentId, setSelectedParentId] = useState("");

  useEffect(() => {
    if (user?.role !== 'superadmin') return;
    const fetchParentOptions = async () => {
      try {
        const { data } = await apiClient.get('/operator_api.php');
        if (data.status === 'success') {
          const options = (data.operators || []).filter((o) =>
            o.role === 'admin' || o.role === 'superadmin'
          );
          setParentOptions(options);
          // Default to the logged-in superadmin themselves — matches
          // the old always-defaults-to-me behavior unless someone
          // deliberately picks a different admin.
          const self = options.find((o) => o.id === user.id);
          if (self) setSelectedParentId(self.id);
        }
      } catch (err) {
        // Non-fatal — the dropdown just won't have prefilled credentials.
      }
    };
    fetchParentOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleParentChange = (e) => {
    const parentId = e.target.value;
    setSelectedParentId(parentId);

    const parent = parentOptions.find((o) => String(o.id) === String(parentId));
    if (!parent) return;

    // Only the credentials themselves — NOT Partner/Branch (this new
    // operator may need a different branch than their parent's own)
    // and NOT pioneeriptvOprId (that comes from the live phone-number
    // lookup below, specific to this new operator's own identity).
    setForm((prev) => ({
      ...prev,
      internetBaseUrl: parent.internetBaseUrl || "",
      internetToken: parent.internetToken || "",
      pioneeriptvToken: parent.pioneeriptvToken || "",
    }));
  };

  // Synced Partner/Branch catalog (see sync_internet_partners_and_branches.php)
  // — Branch options are scoped to whichever Partner is currently
  // selected, same cascading-select idea as Internet Plan -> Sub-Plan.
  const [partnersCatalog, setPartnersCatalog] = useState([]); // [{ partner_code, partner_name, branches: [{ branch_code, branch_name }] }]

  // Refreshes itself quietly the moment this form opens — no more
  // "Sync Partners & Branches" dashboard button to remember to press.
  // Throttled server-side (sync_internet_partners_and_branches.php),
  // so opening this form repeatedly doesn't hammer the RADIUS API.
  useEffect(() => {
    const refreshAndFetchPartners = async () => {
      try {
        await apiClient.post('/sync_internet_partners_and_branches.php');
      } catch (err) {
        // Non-fatal — worst case the dropdown is a little stale, not empty.
      }
      try {
        const { data } = await apiClient.get('/get_internet_partners_and_branches.php');
        if (data.status === 'success') {
          setPartnersCatalog(data.partners || []);
        }
      } catch (err) {
        // Non-fatal — the dropdowns just show empty.
      }
    };
    refreshAndFetchPartners();
  }, []);

  const selectedPartnerBranches =
    partnersCatalog.find((p) => String(p.partner_code) === String(form.internetPartnerId))?.branches || [];

  // ---- Pioneer IPTV live lookup ----
  // 'idle' | 'checking' | 'found' | 'not_found' | 'error'
  const [pioneerLookup, setPioneerLookup] = useState({ status: 'idle', data: null });
  const lookupRequestId = useRef(0);

  const checkPioneerAccount = async (mobile) => {
    const thisRequestId = ++lookupRequestId.current;
    setPioneerLookup({ status: 'checking', data: null });
    try {
      const { data } = await apiClient.get(`/pioneeriptv_lookup_by_mobile.php?mobile=${mobile}`);
      // Ignore stale responses if the phone number changed again while
      // this request was in flight.
      if (thisRequestId !== lookupRequestId.current) return;

      if (data.status === 'success' && data.found) {
        setPioneerLookup({ status: 'found', data });
        setForm((prev) => ({ ...prev, pioneeriptvOprId: data.pioneer_opr_id }));
      } else {
        setPioneerLookup({ status: 'not_found', data: null });
      }
    } catch (err) {
      if (thisRequestId !== lookupRequestId.current) return;
      setPioneerLookup({ status: 'error', data: null });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    const updatedForm = {
      ...form,
      [name]: value,
    };

    if (name === 'phoneNumber') {
      updatedForm.username = value;
      updatedForm.password = value;
    }

    // Changing partner invalidates whichever branch was picked under the
    // old partner.
    if (name === 'internetPartnerId') {
      updatedForm.internetBranchId = "";
    }

    setForm(updatedForm);

    setErrors((prev) => ({ ...prev, [name]: '' }));

    // Live Pioneer IPTV check the moment a full 10-digit number is
    // typed — no separate button, no waiting for submit to find out.
    if (name === 'phoneNumber') {
      if (/^\d{10}$/.test(value)) {
        checkPioneerAccount(value);
      } else {
        lookupRequestId.current++; // invalidate any in-flight lookup
        setPioneerLookup({ status: 'idle', data: null });
      }
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.networkName.trim()) newErrors.networkName = "Network name is required";
    if (!form.operatorName.trim()) newErrors.operatorName = "Operator name is required";
    if (!form.phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required";
    if (!/^\d{10}$/.test(form.phoneNumber)) newErrors.phoneNumber = "Phone number must be 10 digits";
    if (!form.Email.trim()) newErrors.Email = "Email is required";
    if (!/\S+@\S+\.\S+/.test(form.Email)) newErrors.Email = "Invalid email format";
    if (!form.address.trim()) newErrors.address = "Address is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fired after the operator's own row is safely created — never
  // blocks navigation on these, they surface their own toasts
  // whenever they finish (react-toastify's container lives at the
  // app root, so a toast fired here still shows up after navigate()).
  const runPostCreationLinking = (newOperatorId) => {
    if (pioneerLookup.status === 'found') {
      apiClient
        .post('/sync_pioneeriptv_operators_and_branches.php', { operator_id: newOperatorId })
        .then(({ data }) => {
          if (data.status === 'success') {
            const s = data.summary || {};
            toast.success(
              `Pioneer IPTV linked — ${s.branches_added || 0} new branch(es), ` +
              `${s.branch_mappings_added || 0} branch assignment(s)`
            );
          }
        })
        .catch(() => toast.warn('Could not auto-link Pioneer IPTV branches — you can assign them manually later.'));
    }

    if (form.internetEnabled === 1 && form.internetBaseUrl && form.internetToken) {
      apiClient
        .post('/sync_internet_customers.php', { operator_id: newOperatorId })
        .then(({ data }) => {
          if (data.status === 'success') {
            const s = data.summary || {};
            const imported = (s.linked_created_new_customer || 0) + (s.linked_matched_existing_customer || 0);
            if (imported > 0) {
              toast.success(`Imported ${imported} existing Internet customer(s) for this operator.`);
            }
          }
        })
        .catch(() => toast.warn('Could not auto-import existing Internet customers — you can run this later if needed.'));
    }
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.warn("Please Add required fields.");
      return;
    }

    const operatorId = selectedParentId || user.operatorId;
    setSubmitting(true);
    try {
      const { data } = await apiClient.post('/operator_api.php', {
        ...form,
        created_by: operatorId,
      });
      console.log('Add operator response:', data);
      toast.success('Operator added successfully!');

      if (data?.id) {
        runPostCreationLinking(data.id);
      }

      navigate('/operators', { replace: true });

    } catch (err) {
      console.error('Error adding operator:', err);
      if (err.response && err.response.status === 409) {
        toast.warn('Operator already exists.');
      } else if (err.response && err.response.status === 400) {
        toast.error('Missing required fields.');
      } else {
        toast('Failed to add Operator. Please try again later.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <FormHeader />

      <div className={`form-container ${Object.keys(errors).length > 0 ? "form-container-error" : ""}`}>
        <h2>Add Operator</h2>
        <label>Network Name</label>
        <input
          name="networkName"
          placeholder="Network Name"
          onChange={handleChange}
          className={errors.networkName ? "error-input" : ""}
        />
        {errors.networkName && <p className="error-text">{errors.networkName}</p>}

        <label>Operator Name</label>
        <input
          name="operatorName"
          placeholder="Name"
          onChange={handleChange}
          className={errors.operatorName ? "error-input" : ""}
        />
        {errors.operatorName && <p className="error-text">{errors.operatorName}</p>}

        <label>Phone Number</label>
        <input
          name="phoneNumber"
          placeholder="Phone"
          onChange={handleChange}
          className={errors.phoneNumber ? "error-input" : ""}
        />
        {errors.phoneNumber && <p className="error-text">{errors.phoneNumber}</p>}

        <label>Email</label>
        <input
          name="Email"
          placeholder="Email"
          onChange={handleChange}
          className={errors.Email ? "error-input" : ""}
        />
        {errors.Email && <p className="error-text">{errors.Email}</p>}

        <label>Address</label>
        <input
          name="address"
          placeholder="Address"
          onChange={handleChange}
          className={errors.address ? "error-input" : ""}
        />
        {errors.address && <p className="error-text">{errors.address}</p>}

        {user?.role === "superadmin" && (
          <>
            <label>Add this operator under</label>
            <select value={selectedParentId} onChange={handleParentChange}>
              <option value="">-- Select admin/superadmin --</option>
              {parentOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.role === 'superadmin' ? `${p.operatorName} (Superadmin)` : `${p.operatorName} (Admin)`}
                </option>
              ))}
            </select>
            <p className="field-hint">
              Internet and Pioneer IPTV credentials below will be filled in automatically from whoever's selected.
            </p>

            <div className="toggle-container">
              <label className="toggle-label">
                <span className="toggle-text">Enable Internet Integration</span>
                <input
                  type="checkbox"
                  checked={form.internetEnabled === 1}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      internetEnabled: e.target.checked ? 1 : 0,
                    })
                  }
                />
                <span className="toggle-switch">
                  <span className="toggle-slider"></span>
                </span>
              </label>
            </div>

            {form.internetEnabled === 1 && (
              <div className="internet-section">
                <div className="internet-fields">
                  <label>Internet Base URL</label>
                  <input
                    name="internetBaseUrl"
                    type="text"
                    autoComplete="new-password"
                    value={form.internetBaseUrl}
                    onChange={handleChange}
                    placeholder="https://radius.example.com"
                  />

                  <label>Internet Token</label>
                  <input
                    name="internetToken"
                    type="password"
                    autoComplete="new-password"
                    value={form.internetToken}
                    onChange={handleChange}
                    placeholder="Bearer Token"
                  />

                  <label>Internet Partner</label>
                  <select
                    name="internetPartnerId"
                    value={form.internetPartnerId}
                    onChange={handleChange}
                  >
                    <option value="">Select a partner...</option>
                    {partnersCatalog.map((p) => (
                      <option key={p.partner_code} value={p.partner_code}>
                        {p.partner_name}
                      </option>
                    ))}
                  </select>

                  <label>Internet Branch</label>
                  <select
                    name="internetBranchId"
                    value={form.internetBranchId}
                    onChange={handleChange}
                    disabled={!form.internetPartnerId}
                  >
                    <option value="">
                      {form.internetPartnerId ? "Select a branch..." : "Select a partner first"}
                    </option>
                    {selectedPartnerBranches.map((b) => (
                      <option key={b.branch_code} value={b.branch_code}>
                        {b.branch_name}
                      </option>
                    ))}
                  </select>

                  {form.internetBaseUrl && form.internetToken && (
                    <p className="field-hint">
                      Existing customers for this branch will be imported automatically once the operator is created.
                    </p>
                  )}
                </div>
              </div>
            )}

            <label>Pioneer IPTV Operator ID</label>
            <input
              name="pioneeriptvOprId"
              value={form.pioneeriptvOprId}
              onChange={handleChange}
              placeholder="Filled in automatically if a match is found"
            />
            {pioneerLookup.status === 'checking' && (
              <p className="field-hint">🔍 Checking Pioneer IPTV for this phone number…</p>
            )}
            {pioneerLookup.status === 'found' && (
              <p className="field-hint field-hint-success">
                ✅ Found — {pioneerLookup.data.company_name || 'existing account'}, Operator ID {pioneerLookup.data.pioneer_opr_id},{" "}
                {pioneerLookup.data.branches?.length || 0} branch(es) will be linked automatically.
              </p>
            )}
            {pioneerLookup.status === 'not_found' && (
              <p className="field-hint">
                No matching Pioneer IPTV account found for this number — you can still set this up manually below or later.
              </p>
            )}
            {pioneerLookup.status === 'error' && (
              <p className="field-hint field-hint-error">
                Couldn't check Pioneer IPTV right now — you can still enter the Operator ID manually below.
              </p>
            )}

            <label>Pioneer IPTV Token</label>
            <input
              name="pioneeriptvToken"
              type="password"
              autoComplete="new-password"
              value={form.pioneeriptvToken}
              onChange={handleChange}
              placeholder="Pioneer IPTV Token"
            />
          </>
        )}

        <div className="add-cancel">
          <button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Adding..." : "Add Operator"}
          </button>
          <button
            className="cancel-btn"
            onClick={() => { navigate('/operators', { replace: true }); }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

export default AddOperatorForm;