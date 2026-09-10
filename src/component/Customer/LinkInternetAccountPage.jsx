// LinkInternetAccountPage.jsx
import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserContext } from "../UserContext";
import { toast } from "react-toastify";
import apiClient from "../../api/client";
import InternetCustomerForm from "../InternetCustomerForm";
import Header from "../Header";

const LinkInternetAccountPage = () => {
  const { id } = useParams();
  const { token } = useContext(UserContext);
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      const { data } = await apiClient.get(
        `/customer/get_customer_full_details.php?id=${id}`
      );
      setCustomer(data.customer);
    };
    fetchCustomer();
  }, [id]);

  if (!customer) return <p>Loading...</p>;

  return (
    <><Header />
    <div className="form-container">
      <h2>Link Internet Account — {customer.name} {customer.lastName}</h2>
      <InternetCustomerForm
        mode="link"
        existingUser={customer}
        operatorId={customer.operatorId}
        token={token}
        onSuccess={() => navigate(`/customer/${id}`, { replace: true })}
        onCancel={() => navigate(`/customer/${id}`)}
      />
    </div>
    </>
  );
};

export default LinkInternetAccountPage;