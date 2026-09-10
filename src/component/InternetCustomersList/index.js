import React, { useContext, useEffect, useMemo, useState } from "react";
import { UserContext } from "../UserContext";
import Header from "../Header";
import apiClient from "../../api/client";
import { toast } from "react-toastify";
import { HiOutlineRefresh } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import "./index.css";

const InternetCustomerList = () => {

    const { token } = useContext(UserContext);

    const [customers, setCustomers] = useState([]);

    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [internetInfo, setInternetInfo] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {

        loadCustomers();

    }, []);

    const loadCustomers = async () => {

        setLoading(true);

        try {

            const { data } = await apiClient.get(
                "/customer/internet_customer_list.php"
            );
console.log("Fetched customers:", data);
            if (data.status === 200) {

                setCustomers(data.results || []);

            } else {

                toast.error(data.message || "Unable to load customers");

            }

        } catch (e) {
console.error("Error fetching customers:", e);
            toast.error("Network Error");

        }

        setLoading(false);

    };

    const filteredCustomers = useMemo(() => {

        return customers.filter(c => {

            const text = search.toLowerCase();

            return (

                (c.firstname + " " + c.lastname).toLowerCase().includes(text) ||

                (c.username_org || "").toLowerCase().includes(text) ||

                (c.mobile || "").includes(text) ||

                (c.package_name || "").toLowerCase().includes(text) ||

                (c.branch_name || "").toLowerCase().includes(text)

            );

        });

    }, [customers, search]);


    const redirectToCustomer = async (customer) => {

        try {

            const { data } = await apiClient.get(
                `/customer/get_customer_by_mobile.php?mobile=${customer.mobile}`
            );

            if (!data.success) {
                toast.error("Customer not found in Portal");
                return;
            }

            navigate(
                `/customer/${data.customer_id}?internet=${customer.acc_id}`
            );

        } catch (err) {

            toast.error("Unable to open customer");

        }

    };

    return (

        <>

            <Header />

            <div className="internet-list-container">

                <div className="internet-list-header">

                    <h2>Internet Customers</h2>

                    <button
                        className="refresh-btn"
                        onClick={loadCustomers}
                    >
                        Refresh
                    </button>
                    <button
                        className="refresh-btn-mobile"
                        onClick={loadCustomers}
                    >
                        <HiOutlineRefresh />
                    </button>


                </div>

                <input
                    className="internet-search"
                    placeholder="Search Customer, Username, Mobile, Package..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                {loading ? (

                    <>
                        <div className="skeleton-loader">
                            {[...Array(6)].map((_, index) => (
                                <div key={index} className="skeleton-row">
                                    <div className="skeleton-cell"></div>
                                    <div className="skeleton-cell"></div>
                                    <div className="skeleton-cell"></div>
                                    <div className="skeleton-cell"></div>
                                    <div className="skeleton-cell"></div>
                                    <div className="skeleton-cell"></div>
                                    <div className="skeleton-cell"></div>
                                    <div className="skeleton-cell"></div>
                                    <div className="skeleton-cell"></div>
                                </div>
                            ))}
                        </div>
                    </>

                ) : (

                    <div className="operator-table-wrapper">

                        <table className="operator-table">

                            <thead>

                                <tr>

                                    <th>#</th>

                                    <th>Customer</th>
                                    <th>Mobile</th>
                                    <th>Username</th>
                                    <th>Status</th>
                                    <th>Online</th>
                                    <th>Package</th>
                                    <th>Sub Plan</th>
                                    <th>Expiry Date</th>
                                    <th>Renewal Date</th>
                                    <th>Registration Date</th>
                                    <th>Installation Address</th>

                                </tr>

                            </thead>

                            <tbody>

                                {filteredCustomers.length === 0 && (

                                    <tr>

                                        <td colSpan="9">

                                            No Customers Found

                                        </td>

                                    </tr>

                                )}

                                {filteredCustomers.map((c, index) => (

                                    <tr
                                        key={c.acc_id}
                                        onClick={() => setSelectedCustomer(c)}
                                        style={{ cursor: "pointer" }}
                                    >

                                        <td>{index + 1}</td>

                                        <td>

                                            {c.firstname} {c.lastname}

                                        </td>
                                        <td>
                                            <span
                                                className="internet-link"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    redirectToCustomer(c);
                                                }}
                                            >
                                                {c.mobile}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                className="internet-link"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    redirectToCustomer(c);
                                                }}
                                            >
                                                {c.username_org}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${c.status === "Active" ? "active" : "inactive"}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ color: c.online_status === "ONLINE" ? "green" : "gray" }} >
                                                {c.online_status === "ONLINE"
                                                    ? "🟢 ONLINE"
                                                    : "⚪ OFFLINE"}
                                            </div>
                                        </td>
                                        <td>{c.package_name}</td>
                                        <td>{c.sub_plan_name}</td>
                                        <td>{c.expiry_date}</td>
                                        <td>{c.renewal_date}</td>
                                        <td>{c.registered_date}</td>
                                        <td>{c.installation_address}</td>
                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </>
    );

};

export default InternetCustomerList;