
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getCustomer,
  updateCustomer,
  type CustomerStatus,
  type CustomerGender,
} from "../services/localDb";

interface CustomerForm {
  user_id: string;
  name: string;
  email: string;
  contact_number: string;
  status: CustomerStatus;
  gender: CustomerGender | "";
  date_of_birth: string;
  citizenship_number: string;
  pan_number: string;
  father_name: string;
  mother_name: string;
  grandfather_name: string;
  account_open_date: string;
  issued_date: string;
  address: string;
  bank_name: string;
  account_number: string;
  client_number: string;
  dp_name: string;
  dp_id: string;
  crn: string;
}

const emptyForm: CustomerForm = {
  user_id: "",
  name: "",
  email: "",
  contact_number: "",
  status: "ACTIVE",
  gender: "",
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
};

function EditCustomer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CustomerForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCustomer() {
      if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
        setErrorMessage("Invalid customer ID.");
        setLoading(false);
        return;
      }

      try {
        const customer = await getCustomer(Number(id));

        if (!customer) {
          setErrorMessage("Customer not found in local storage.");
          return;
        }

        if (cancelled) return;

        setFormData({
          user_id: customer.user_id ?? "",
          name: customer.name ?? "",
          email: customer.email ?? "",
          contact_number: customer.contact_number ?? "",
          status: customer.status ?? "ACTIVE",
          gender: customer.gender ?? "",
          date_of_birth: customer.date_of_birth ?? "",
          citizenship_number: customer.citizenship_number ?? "",
          pan_number: customer.pan_number ?? "",
          father_name: customer.father_name ?? "",
          mother_name: customer.mother_name ?? "",
          grandfather_name: customer.grandfather_name ?? "",
          account_open_date: customer.account_open_date ?? "",
          issued_date: customer.issued_date ?? "",
          address: customer.address ?? "",
          bank_name: customer.bank_name ?? "",
          account_number: customer.account_number ?? "",
          client_number: customer.client_number ?? "",
          dp_name: customer.dp_name ?? "",
          dp_id: customer.dp_id ?? "",
          crn: customer.crn ?? "",
        });
      } catch (error) {
        console.error("Failed to load customer:", error);
        if (!cancelled) {
          setErrorMessage("Unable to load the customer from local storage.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadCustomer();

    return () => {
      cancelled = true;
    };
  }, [id]);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
      setErrorMessage("Invalid customer ID.");
      return;
    }

    const userId = formData.user_id.trim();
    const customerName = formData.name.trim();

    if (!userId || !customerName) {
      setErrorMessage("User ID and customer name are required.");
      return;
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (
      formData.contact_number.trim() &&
      !/^\d{10}$/.test(formData.contact_number.trim())
    ) {
      setErrorMessage("Contact number must contain exactly 10 digits.");
      return;
    }

    if (
      formData.pan_number.trim() &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(formData.pan_number.trim())
    ) {
      setErrorMessage("Please enter a valid PAN number.");
      return;
    }

    setSaving(true);

    try {
      await updateCustomer(Number(id), {
        user_id: userId,
        name: customerName,
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

      alert("Customer updated successfully!");
      navigate(`/customer/${id}`);
    } catch (error) {
      console.error("Failed to update customer:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update the customer."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 30 }}>Loading customer...</div>;
  }

  if (errorMessage && !formData.user_id && !formData.name) {
    return (
      <div style={{ padding: 30 }}>
        <h2>Unable to open customer</h2>
        <p role="alert">{errorMessage}</p>
        <button type="button" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    maxWidth: 600,
    boxSizing: "border-box",
    padding: "10px 12px",
    marginTop: 6,
    marginBottom: 16,
    border: "1px solid #ccc",
    borderRadius: 6,
    fontSize: 15,
  };

  function field(
    label: string,
    name: keyof CustomerForm,
    type = "text",
    required = false
  ) {
    return (
      <label key={name} style={{ display: "block", fontWeight: 500 }}>
        {label}
        <input
          style={inputStyle}
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          required={required}
        />
      </label>
    );
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <button
        type="button"
        onClick={() => navigate(`/customer/${id}`)}
        style={{ marginBottom: 16 }}
      >
        ← Back to Customer
      </button>

      <h1>Edit Customer</h1>
      <p>Changes are saved locally on this device.</p>

      {errorMessage && (
        <p role="alert" style={{ color: "crimson" }}>
          {errorMessage}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <h2>Basic Information</h2>
        {field("User ID *", "user_id", "text", true)}
        {field("Customer Name *", "name", "text", true)}
        {field("Email", "email", "email")}
        {field("Contact Number", "contact_number", "tel")}

        <label style={{ display: "block", fontWeight: 500 }}>
          Status
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </label>

        <label style={{ display: "block", fontWeight: 500 }}>
          Gender
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="">Select gender</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="O">Other</option>
          </select>
        </label>

        <h2>Personal Information</h2>
        {field("Date of Birth", "date_of_birth", "date")}
        {field("Father's Name", "father_name")}
        {field("Mother's Name", "mother_name")}
        {field("Grandfather's Name", "grandfather_name")}
        {field("Citizenship Number", "citizenship_number")}
        {field("PAN Number", "pan_number")}

        <h2>Bank and Account Information</h2>
        {field("Bank Name", "bank_name")}
        {field("Account Number", "account_number")}
        {field("Client Number", "client_number")}
        {field("DP Name", "dp_name")}
        {field("DP ID", "dp_id")}
        {field("CRN", "crn")}
        {field("Account Opening Date", "account_open_date", "date")}
        {field("Issued Date", "issued_date", "date")}

        <h2>Address</h2>
        <label style={{ display: "block", fontWeight: 500 }}>
          Customer Address
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={4}
            style={inputStyle}
          />
        </label>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Update Customer"}
        </button>
      </form>
    </main>
  );
}

export default EditCustomer;