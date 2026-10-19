import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    createCustomer,
    type CustomerGender,
    type CustomerStatus,
} from "../services/localDb";

function AddCustomer() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        user_id: "",
        name: "",
        email: "",
        contact_number: "",
        status: "ACTIVE" as CustomerStatus,
        gender: "" as CustomerGender | "",
        date_of_birth: "",
        citizenship_number: "",
        pan_number: "",
        father_name: "",
        mother_name: "",
        grandfather_name: "",
        account_open_date: "",
        issued_date: "",
        address: "",
        bank_name: "",
        account_number: "",
        client_number: "",
        dp_name: "",
        dp_id: "",
        crn: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setErrors((previous) => ({
            ...previous,
            [name]: "",
        }));

        setSaveError("");
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.user_id.trim()) {
            newErrors.user_id = "User ID is required.";
        }

        if (!formData.name.trim()) {
            newErrors.name = "Customer name is required.";
        }

        if (
            formData.email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
        ) {
            newErrors.email = "Please enter a valid email address.";
        }

        if (
            formData.contact_number &&
            !/^\d{10}$/.test(formData.contact_number.trim())
        ) {
            newErrors.contact_number =
                "Contact number must contain exactly 10 digits.";
        }

        if (
            formData.pan_number &&
            !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(
                formData.pan_number.trim().toUpperCase()
            )
        ) {
            newErrors.pan_number = "Please enter a valid PAN number.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaveError("");

        if (!validateForm()) {
            return;
        }

        setIsSaving(true);

        try {
            const customerId = await createCustomer({
                user_id: formData.user_id.trim(),
                name: formData.name.trim(),
                email: formData.email.trim() || null,
                contact_number: formData.contact_number.trim() || null,
                status: formData.status,
                gender: formData.gender || null,
                date_of_birth: formData.date_of_birth || null,
                citizenship_number: formData.citizenship_number.trim() || null,
                pan_number: formData.pan_number.trim().toUpperCase() || null,
                father_name: formData.father_name.trim() || null,
                mother_name: formData.mother_name.trim() || null,
                grandfather_name: formData.grandfather_name.trim() || null,
                account_open_date: formData.account_open_date || null,
                issued_date: formData.issued_date || null,
                address: formData.address.trim() || null,
                bank_name: formData.bank_name.trim() || null,
                account_number: formData.account_number.trim() || null,
                client_number: formData.client_number.trim() || null,
                dp_name: formData.dp_name.trim() || null,
                dp_id: formData.dp_id.trim() || null,
                crn: formData.crn.trim() || null,
            });

            alert("Customer saved successfully on this device.");
            navigate(`/customer/${customerId}`);
        } catch (error) {
            console.error("Failed to save customer locally:", error);

            if (
                error instanceof Error &&
                error.message === "Customer User ID already exists."
            ) {
                setErrors((previous) => ({
                    ...previous,
                    user_id: "This User ID already exists.",
                }));
                setSaveError("Please use a unique User ID.");
            } else {
                setSaveError(
                    "Could not save the customer locally. Please try again."
                );
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{ padding: "30px", maxWidth: "900px" }}>
            <button
                type="button"
                onClick={() => navigate("/dashboard")}
            >
                ← Back to Dashboard
            </button>

            <h1>Add Customer</h1>

            <p>
                Customer information will be saved locally on this device.
            </p>

            <form onSubmit={handleSubmit}>
                <h2>Basic Information</h2>

                <input
                    name="user_id"
                    placeholder="User ID"
                    value={formData.user_id}
                    onChange={handleChange}
                    required
                />
                {errors.user_id && (
                    <p style={{ color: "red" }}>{errors.user_id}</p>
                )}

                <br /><br />

                <input
                    name="name"
                    placeholder="Customer Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
                {errors.name && (
                    <p style={{ color: "red" }}>{errors.name}</p>
                )}

                <br /><br />

                <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                />
                {errors.email && (
                    <p style={{ color: "red" }}>{errors.email}</p>
                )}

                <br /><br />

                <input
                    name="contact_number"
                    type="tel"
                    placeholder="Contact Number (10 digits)"
                    value={formData.contact_number}
                    onChange={handleChange}
                />
                {errors.contact_number && (
                    <p style={{ color: "red" }}>
                        {errors.contact_number}
                    </p>
                )}

                <br /><br />

                <label htmlFor="status">Status: </label>
                <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="BLOCKED">BLOCKED</option>
                </select>

                <br /><br />

                <label htmlFor="gender">Gender: </label>
                <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                >
                    <option value="">Select Gender</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                </select>

                <h2>Personal Information</h2>

                <label htmlFor="date_of_birth">Date of Birth: </label>
                <input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                />

                <br /><br />

                <input
                    name="father_name"
                    placeholder="Father Name"
                    value={formData.father_name}
                    onChange={handleChange}
                />

                <br /><br />

                <input
                    name="mother_name"
                    placeholder="Mother Name"
                    value={formData.mother_name}
                    onChange={handleChange}
                />

                <br /><br />

                <input
                    name="grandfather_name"
                    placeholder="Grandfather Name"
                    value={formData.grandfather_name}
                    onChange={handleChange}
                />

                <br /><br />

                <input
                    name="citizenship_number"
                    placeholder="Citizenship Number"
                    value={formData.citizenship_number}
                    onChange={handleChange}
                />

                <br /><br />

                <input
                    name="pan_number"
                    placeholder="PAN Number"
                    value={formData.pan_number}
                    onChange={handleChange}
                />
                {errors.pan_number && (
                    <p style={{ color: "red" }}>{errors.pan_number}</p>
                )}

                <h2>Bank Information</h2>

                <input
                    name="bank_name"
                    placeholder="Bank Name"
                    value={formData.bank_name}
                    onChange={handleChange}
                />

                <br /><br />

                <input
                    name="account_number"
                    placeholder="Account Number"
                    value={formData.account_number}
                    onChange={handleChange}
                />

                <br /><br />

                <input
                    name="client_number"
                    placeholder="Client Number"
                    value={formData.client_number}
                    onChange={handleChange}
                />

                <br /><br />

                <input
                    name="dp_name"
                    placeholder="DP Name"
                    value={formData.dp_name}
                    onChange={handleChange}
                />

                <br /><br />

                <input
                    name="dp_id"
                    placeholder="DP ID"
                    value={formData.dp_id}
                    onChange={handleChange}
                />

                <br /><br />

                <input
                    name="crn"
                    placeholder="CRN"
                    value={formData.crn}
                    onChange={handleChange}
                />

                <br /><br />

                <label htmlFor="account_open_date">Account Open Date: </label>
                <input
                    id="account_open_date"
                    name="account_open_date"
                    type="date"
                    value={formData.account_open_date}
                    onChange={handleChange}
                />

                <br /><br />

                <label htmlFor="issued_date">Issued Date: </label>
                <input
                    id="issued_date"
                    name="issued_date"
                    type="date"
                    value={formData.issued_date}
                    onChange={handleChange}
                />

                <h2>Address</h2>

                <textarea
                    name="address"
                    placeholder="Customer Address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={4}
                    cols={40}
                />

                <br /><br />

                {saveError && (
                    <p role="alert" style={{ color: "red" }}>
                        {saveError}
                    </p>
                )}

                <button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Create Customer"}
                </button>
            </form>
        </div>
    );
}

export default AddCustomer;