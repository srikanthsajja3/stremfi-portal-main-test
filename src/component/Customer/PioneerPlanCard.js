import React from "react";
import { ASSET_BASE_URL } from "../../config/env";
import "./index.css";

const PioneerPlanCard = ({
    customer,
    pioneerInfo,
    pioneerStbs = [],
    plans = [],
    loading,
    addUserLoading,
    addUserError,
    onAddUser,
    onRecharge,
    onRemove,
    removeLoading
}) => {

    const customerExists =
        pioneerInfo &&
        pioneerInfo.status === 200;

    const hasStbs = pioneerStbs.length > 0;

    // Pioneer sends expiry as "YYYY-MM-DD HH:mm:ss" (a space, not a "T").
    // That format isn't part of the ECMAScript Date spec — V8/Chrome
    // happens to parse it, but Safari and some other engines return
    // Invalid Date for it, which silently breaks every comparison below.
    // Normalizing to ISO-8601 makes the parse reliable everywhere.
    const parseExpiry = (expiry) => {
        if (!expiry) return null;
        const iso = expiry.includes("T") ? expiry : expiry.replace(" ", "T");
        const parsed = new Date(iso);
        return isNaN(parsed.getTime()) ? null : parsed;
    };

    const isActive = (expiry) => {
        const parsed = parseExpiry(expiry);
        if (!parsed) return false;
        return parsed >= new Date();
    };

    const formatDate = (date) => {
        const parsed = parseExpiry(date);
        if (!parsed) return "--";

        return parsed.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    const getPackageName = (stb) => {

        if (!stb.plans || stb.plans.length === 0)
            return "--";

        const packages = stb.plans
            .filter(plan => plan.prdtype !== "1")
            .map(plan => plan.prdname);

        if (packages.length > 0)
            return packages.join(", ");

        return stb.plans[0].prdname;
    };

    return (
        <div className="pioneer-plan-card">

            {/* -------------------------------
                CUSTOMER NOT REGISTERED
            -------------------------------- */}

            {!customerExists && (
                <div className="pioneer-empty-state">
                    <div className="pioneer-empty-icon">📡</div>
                    <p className="pioneer-empty-title">
                        Customer not registered with Pioneer IPTV
                    </p>
                    <p className="pioneer-empty-subtitle">
                        Create an account to enable Pioneer IPTV services
                    </p>

                    {addUserError && (
                        <div className="pioneer-error-banner">
                            ⚠️ {addUserError}
                        </div>
                    )}<br />

                    <button
                        className="pioneer-btn-primary"
                        onClick={onAddUser}
                        disabled={addUserLoading}
                    >
                        {addUserLoading ? (
                            <>
                                <span className="pioneer-spinner-small"></span>
                                Creating Account...
                            </>
                        ) : (
                            "➕ Add Customer"
                        )}
                    </button>
                </div>
            )}

            {/* -------------------------------
                REGISTERED BUT NO STB
            -------------------------------- */}

            {customerExists && !hasStbs && (
                <div className="pioneer-empty-state">
                    <div className="pioneer-status-badge success">
                        ✅ Customer Registered
                    </div>
                    <div className="pioneer-empty-icon">📺</div>
                    <p className="pioneer-empty-title">
                        No devices linked
                    </p>
                    <p className="pioneer-empty-subtitle">
                        Login to the Pioneer Digital TV to enable recharge
                    </p>
                    <h4>
                        Please Refresh the Page After Logging In To See The Devices
                    </h4>
                </div>
            )}

            {/* -------------------------------
                DEVICE LIST
            -------------------------------- */}

            {customerExists && hasStbs && (
                <div className="pioneer-stb-list">
                    {pioneerStbs.map((stb, index) => {
                        const active = isActive(stb.expiration);

                        return (
                            <div
                                key={stb.id || index}
                                className={`pioneer-stb-card ${active ? "status-active" : "status-expired"}`}
                            >
                                <div className="pioneer-stb-header">
                                    <div className="pioneer-stb-title-wrapper">
                                        <h3 className="pioneer-stb-title">
                                            Device #{index + 1}
                                        </h3>
                                    </div>
                                    <span className={`pioneer-stb-badge ${active ? "active" : "expired"}`}>
                                        {active ? "● Active" : "● Expired"}
                                    </span>
                                </div>

                                <div className="pioneer-stb-grid">
                                    <div className="pioneer-stb-field">
                                        <span className="pioneer-stb-label">Expiry Date</span>
                                        <strong className={`pioneer-stb-value ${!active ? "expired-text" : ""}`}>
                                            {formatDate(stb.expiration)}
                                        </strong>
                                    </div>

                                    <div className="pioneer-stb-field">
                                        <span className="pioneer-stb-label">Package</span>
                                        <strong className="pioneer-stb-value">
                                            {getPackageName(stb)}
                                        </strong>
                                    </div>

                                    <div className="pioneer-stb-field">
                                        <span className="pioneer-stb-label">Device ID</span>
                                        <strong className="pioneer-stb-value mono">
                                            {stb.stb_box || "--"}
                                        </strong>
                                    </div>

                                    <div className="pioneer-stb-field">
                                        <span className="pioneer-stb-label">Serial No</span>
                                        <strong className="pioneer-stb-value mono">
                                            {stb.smartcard || "--"}
                                        </strong>
                                    </div>
                                </div>

                                <div className="pioneer-stb-footer">
                                    <img
                                        src={`${ASSET_BASE_URL}/pioneeriptv.png`}
                                        alt="Pioneer IPTV"
                                        className="pioneer-plan-logo"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                    <div className="pioneer-stb-actions">

                                        {!active && (
                                            <button
                                                className="pioneer-btn-recharge"
                                                disabled={loading}
                                                onClick={() => onRecharge(stb, false)}
                                            >
                                                {loading ? (
                                                    <span className="pioneer-spinner-small"></span>
                                                ) : (
                                                    "Recharge"
                                                )}
                                            </button>
                                        )}

                                        {active && (
                                            <button
                                                className="pioneer-btn-advance"
                                                disabled={loading}
                                                onClick={() => onRecharge(stb, true)}
                                            >
                                                {loading ? (
                                                    <span className="pioneer-spinner-small"></span>
                                                ) : (
                                                    "Advance Recharge"
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PioneerPlanCard;