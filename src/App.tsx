import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CustomerDetails from "./pages/CustomerDetails";
import ProtectedRoute from "./components/ProtectedRoute";
import AddCustomer from "./pages/AddCustomer";
import EditCustomer from "./pages/EditCustomer";
function App() {
    return (
        <Routes>

            {/* Public route */}
            <Route
                path="/"
                element={<Login />}
            />

            {/* Protected Dashboard */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />

            {/* Protected Customer Details */}
            <Route
                path="/customer/:id"
                element={
                    <ProtectedRoute>
                        <CustomerDetails />
                    </ProtectedRoute>
                }
            />
            {/* Add Customer */}
            <Route
                path="/customer/add"
                element={
                    <ProtectedRoute>
                        <AddCustomer />
                    </ProtectedRoute>
                }
            />

            {/* Edit Customer */}
            <Route
                path="/customer/:id/edit"
                element={
                    <ProtectedRoute>
                        <EditCustomer />
                    </ProtectedRoute>
                }
            />

        </Routes>
    );
}

export default App;