import React, { useEffect, useState, useContext } from 'react';
import apiClient from '../api/client';
import { UserContext } from "./UserContext";
import { useNavigate } from 'react-router-dom';
import './AddCustomerForm.css';
import FormHeader from '../FormHeader';
import InternetCustomerForm from "./InternetCustomerForm";

// Every customer is an Internet customer now — there's no more
// "Normal Customer" path or a type-choice screen. Once an operator is
// known (either the logged-in operator themselves, or picked from the
// dropdown below), this goes straight to InternetCustomerForm.
const AddCustomerForm = () => {
  const { user, token } = useContext(UserContext);
  const navigate = useNavigate();

  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  const role = user.role;

  const [operatorId, setOperatorId] = useState(
    role === "operator" || role === "admin" ? user.operatorId : ""
  );
  const [operatorDetails, setOperatorDetails] = useState(
    role === "operator"
      ? `${user.operatorName || ''} - ${user.phoneNumber || ''}`
      : role === "admin"
        ? `${user.operatorName || ''} - ${user.operatorPhoneNumber || ''}`
        : ""
  );

  // ---------------------------------------------------------------
  // FETCH OPERATORS
  // ---------------------------------------------------------------

  const fetchOperators = async () => {
    setLoading(true);

    try {
      const { data } = await apiClient.get('/operator_api.php');
      setOperators(data.operators || []);
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

  // ---------------------------------------------------------------
  // HANDLE OPERATOR SELECTION
  // ---------------------------------------------------------------

  const handleOperatorChange = (e) => {
    const selectedId = Number(e.target.value);

    // Admin can select their own operator or any operator returned by the API.
    const allOptions =
      role === "admin"
        ? [
            {
              id: Number(user.operatorId),
              operatorName: user.operatorName,
              phoneNumber: user.operatorPhoneNumber,
            },
            ...operators,
          ]
        : operators;

    const selectedOp = allOptions.find((op) => Number(op.id) === selectedId);

    setOperatorId(selectedId);
    setOperatorDetails(
      selectedOp ? `${selectedOp.operatorName} - ${selectedOp.phoneNumber}` : ""
    );

    setErrors((prev) => ({ ...prev, operatorId: '' }));
  };

  // ---------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------

  return (
    <>
      <FormHeader />

      {loading ? (
        <div className="dashboard-loading">
          <div className="loader"></div>
          <p>Loading...</p>
        </div>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <div className={`form-container ${Object.keys(errors).length > 0 ? "form-container-error" : ""}`}>
          <h2>Add Customer</h2>

          {/* -----------------------------------------------------
              OPERATOR SELECTION
              ----------------------------------------------------- */}

          {role !== "operator" ? (
            <>
              <select
                name="operatorId"
                value={operatorId}
                className={errors.operatorId ? "error-input" : ""}
                onChange={handleOperatorChange}
              >
                <option value="">-- Select Operator/Admin --</option>

                {role === "admin" && (
                  <option key={`admin-${user.operatorId}`} value={user.operatorId}>
                    {user.operatorName} - {user.phoneNumber}
                  </option>
                )}

                {operators.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.operatorName} - {o.phoneNumber}
                  </option>
                ))}
              </select>

              {errors.operatorId && <p className="error-text">{errors.operatorId}</p>}
            </>
          ) : (
            <input
              name="operatorDetails"
              placeholder="Operator Details"
              value={operatorDetails}
              readOnly
            />
          )}

          {/* -----------------------------------------------------
              INTERNET CUSTOMER FORM — the only path there is now.
              For "operator" role this shows immediately (operatorId
              is already known); for admin/superadmin it appears the
              moment an operator is picked above.
              ----------------------------------------------------- */}

          {operatorId ? (
            <div className="internet-customer-section">
              <InternetCustomerForm
                mode="new"
                operatorId={operatorId}
                token={token}
                onSuccess={() => navigate("/internet-customers", { replace: true })}
                onCancel={() => navigate("/internet-customers")}
              />
            </div>
          ) : (
            role !== "operator" && (
              <p className="field-hint" style={{ marginTop: 12 }}>
                Select an operator above to continue.
              </p>
            )
          )}
        </div>
      )}
    </>
  );
};

export default AddCustomerForm;