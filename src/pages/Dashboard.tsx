import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getCustomers,
    searchCustomers,
    type Customer,
} from "../services/localDb";

function Dashboard() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const navigate = useNavigate();

    // Load all locally saved customers.
    const loadCustomers = async (searchValue = "") => {
        setLoading(true);
        setErrorMessage("");

        try {
            const results = searchValue.trim()
                ? await searchCustomers(searchValue)
                : await getCustomers();

            setCustomers(results);
        } catch (error) {
            console.error("Failed to load local customers:", error);
            setErrorMessage("Could not load customers from local storage.");
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadCustomers();
    }, []);

    // End the current local login session.
    const handleLogout = () => {
        sessionStorage.removeItem("offline_authenticated");
        navigate("/", { replace: true });
    };

    const handleSearch = () => {
        void loadCustomers(search);
    };

    const handleClear = () => {
        setSearch("");
        void loadCustomers("");
    };

    return (
        <div style={{ padding: "30px" }}>
            <h1>Dashboard</h1>

            <p>
                Total customers: <strong>{customers.length}</strong>
            </p>

            <button
                onClick={handleLogout}
                style={{ marginBottom: "20px" }}
            >
                Logout
            </button>

            <br />

            <button
                onClick={() => navigate("/customer/add")}
                style={{ marginBottom: "20px" }}
            >
                + Add Customer
            </button>

            {/* Local customer search */}
            <div style={{ marginBottom: "20px" }}>
                <input
                    type="text"
                    placeholder="Search by name, User ID, contact, account, PAN..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            handleSearch();
                        }
                    }}
                />

                <button
                    onClick={handleSearch}
                    style={{ marginLeft: "10px" }}
                    disabled={loading}
                >
                    Search
                </button>

                <button
                    onClick={handleClear}
                    style={{ marginLeft: "10px" }}
                    disabled={loading}
                >
                    Clear
                </button>
            </div>

            {errorMessage && (
                <p role="alert" style={{ color: "red" }}>
                    {errorMessage}
                </p>
            )}

            {/* Local customer table */}
            <table
                border={1}
                cellPadding={10}
                style={{
                    borderCollapse: "collapse",
                    width: "100%",
                    maxWidth: "1000px",
                }}
            >
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>User ID</th>
                        <th>Name</th>
                        <th>Contact</th>
                    </tr>
                </thead>

                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={4}>Loading customers...</td>
                        </tr>
                    ) : customers.length === 0 ? (
                        <tr>
                            <td colSpan={4}>
                                {search.trim()
                                    ? "No matching customers found."
                                    : "No customers saved locally yet."}
                            </td>
                        </tr>
                    ) : (
                        customers.map((customer) => (
                            <tr
                                key={customer.id ?? customer.user_id}
                                onClick={() => {
                                    if (customer.id !== undefined) {
                                        navigate(`/customer/${customer.id}`);
                                    }
                                }}
                                style={{
                                    cursor:
                                        customer.id !== undefined
                                            ? "pointer"
                                            : "default",
                                }}
                            >
                                <td>{customer.id ?? "—"}</td>
                                <td>{customer.user_id}</td>
                                <td>{customer.name}</td>
                                <td>{customer.contact_number || "N/A"}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default Dashboard;