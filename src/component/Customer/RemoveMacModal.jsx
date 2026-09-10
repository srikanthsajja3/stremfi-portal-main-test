import React, { useEffect, useState } from "react";
import apiClient from "../../api/client";
import "./InternetPlanCard.css";

const RemoveMacModal = ({
  open,
  internetId,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [bindings, setBindings] = useState([]);

  useEffect(() => {
    if (open) {
      loadBindings();
    }
  }, [open]);

  const loadBindings = async () => {
    setLoading(true);

    try {
      const { data } = await apiClient.get(
        `/customer/internet_get_mac_bindings.php?internet_id=${internetId}`
      );

      setBindings(data.results || []);

    } catch (e) {
      alert("Unable to load MAC bindings");
    }

    setLoading(false);
  };

  const removeBinding = async (bindingId) => {
    if (!window.confirm("Remove this MAC Binding?")) return;

    setRemoving(bindingId);

    try {
        await apiClient.post(
          "/customer/internet_remove_mac_binding.php",
          new URLSearchParams({
            internet_id: internetId,
            binding_id: bindingId,
          }),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

      setBindings((prev) =>
        prev.filter((x) => x.id !== bindingId)
      );

      if (onSuccess) onSuccess();
    } catch (e) {
      alert("Failed to remove MAC Binding");
    }

    setRemoving(null);
  };

  if (!open) return null;

  return (
    <div className="mac-modal-overlay">
      <div className="mac-modal">

        <div className="mac-header">
          <h2>MAC Bindings</h2>

          <button onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="mac-loading">
            Loading...
          </div>
        ) : bindings.length === 0 ? (
          <div className="mac-empty">
            No MAC Bindings Found
          </div>
        ) : (
          <table className="mac-table">

            <thead>
              <tr>
                <th>MAC</th>
                <th>IP</th>
                <th>Type</th>
                <th></th>
              </tr>
            </thead>

            <tbody>

              {bindings.map((item) => (
                <tr key={item.id}>

                  <td>{item.mac}</td>

                  <td>{item.ip || "--"}</td>

                  <td>{item.type}</td>

                  <td>

                    <button
                      className="remove-btn"
                      disabled={removing === item.id}
                      onClick={() =>
                        removeBinding(item.id)
                      }
                    >
                      {removing === item.id
                        ? "Removing..."
                        : "Remove"}
                    </button>

                  </td>

                </tr>
              ))}

            </tbody>

          </table>
        )}

      </div>
    </div>
  );
};

export default RemoveMacModal;