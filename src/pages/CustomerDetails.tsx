import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import {
    getCustomer,
    getCustomerDocuments,
    deleteCustomer,
    deleteCustomerDocument,
    addCustomerDocument,
    openCustomerDocument,
    downloadCustomerDocument,
    type Customer,
    type CustomerDocument,
    type DocumentType,
    getCustomerDocument,
    shareBlobFile,
} from "../services/localDb";

function CustomerDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const customerId = Number(id);

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [documents, setDocuments] = useState<CustomerDocument[]>([]);
    const [documentType, setDocumentType] = useState<DocumentType | "">("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [previewUrl, setPreviewUrl] = useState("");
    const [previewName, setPreviewName] = useState("");
    useEffect(() => {
  return () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };
}, [previewUrl]);
    const loadCustomer = useCallback(async () => {
        if (!id || !Number.isSafeInteger(customerId) || customerId <= 0) {
            setCustomer(null);
            setDocuments([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setErrorMessage("");

        try {
            const savedCustomer = await getCustomer(customerId);

            if (!savedCustomer) {
                setCustomer(null);
                setDocuments([]);
                return;
            }

            const savedDocuments = await getCustomerDocuments(customerId);

            setCustomer(savedCustomer);
            setDocuments(savedDocuments);
        } catch (error) {
            console.error("Failed to load local customer:", error);
            setErrorMessage("Could not load this customer's local records.");
        } finally {
            setLoading(false);
        }
    }, [id, customerId]);

    useEffect(() => {
        void loadCustomer();
    }, [loadCustomer]);

    const handleDelete = async () => {
        if (!customer) return;

        const confirmed = window.confirm(
            `Permanently delete ${customer.name} and all documents stored for this customer on this device? This cannot be undone.`
        );

        if (!confirmed) return;

        setBusy(true);
        setErrorMessage("");

        try {
            await deleteCustomer(customer.id!);
            alert("Customer and associated local documents deleted.");
            navigate("/dashboard", { replace: true });
        } catch (error) {
            console.error("Local customer deletion failed:", error);
            setErrorMessage("Could not delete the customer. Please try again.");
        } finally {
            setBusy(false);
        }
    };

    const handleDocumentUpload = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (!customer || customer.id === undefined) return;

        if (!documentType) {
            setErrorMessage("Please select a document type.");
            return;
        }

        if (!selectedFile) {
            setErrorMessage("Please select a file.");
            return;
        }

        setBusy(true);
        setErrorMessage("");

        try {
            await addCustomerDocument(
                customer.id,
                documentType,
                selectedFile
            );

            setDocumentType("");
            setSelectedFile(null);

            const fileInput = window.document.getElementById(
                "customer-document-file"
            ) as HTMLInputElement | null;

            if (fileInput) fileInput.value = "";

            await loadCustomer();
            alert("Document saved locally on this device.");
        } catch (error) {
            console.error("Local document upload failed:", error);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Could not save the document."
            );
        } finally {
            setBusy(false);
        }
    };

    const handleViewDocument = async (documentId: number) => {
  try {
    const savedDocument = await getCustomerDocument(documentId);

    if (savedDocument.mime_type.startsWith("image/")) {
      const url = URL.createObjectURL(savedDocument.file_data);
      setPreviewName(savedDocument.file_name);
      setPreviewUrl(url);
      return;
    }

    await openCustomerDocument(documentId);
  } catch (error) {
    console.error("Document viewing failed:", error);
    alert(
      error instanceof Error
        ? error.message
        : "Unable to open this document.",
    );
  }
};

    const handleDownloadDocument = async (documentId: number) => {
        try {
            await downloadCustomerDocument(documentId);
        } catch (error) {
            console.error("Document download failed:", error);
            alert(
                error instanceof Error
                    ? error.message
                    : "Unable to download this document."
            );
        }
    };

    const handleDeleteDocument = async (documentId: number) => {
        const confirmed = window.confirm(
            "Permanently delete this document from local storage?"
        );

        if (!confirmed) return;

        setBusy(true);
        setErrorMessage("");

        try {
            await deleteCustomerDocument(documentId);
            await loadCustomer();
        } catch (error) {
            console.error("Document deletion failed:", error);
            setErrorMessage("Could not delete this document.");
        } finally {
            setBusy(false);
        }
    };
    const handleSaveCustomerPdf = async () => {
  if (!customer) return;

  try {
    setBusy(true);
    setErrorMessage("");

    const pdf = new jsPDF();
    const margin = 15;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const textWidth = pageWidth - margin * 2;
    let y = 20;

    const addHeading = (heading: string) => {
      if (y > pageHeight - 25) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text(heading, margin, y);
      y += 9;
    };

    const addField = (label: string, value?: string | null) => {
      const text = `${label}: ${value || "N/A"}`;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);

      const lines = pdf.splitTextToSize(text, textWidth);

      if (y + lines.length * 5 > pageHeight - margin) {
        pdf.addPage();
        y = 20;
      }

      pdf.text(lines, margin, y);
      y += lines.length * 5 + 2;
    };

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("Customer Profile", margin, y);
    y += 12;

    addHeading("Basic Information");
    addField("Customer ID", String(customer.id ?? "N/A"));
    addField("User ID", customer.user_id);
    addField("Name", customer.name);
    addField("Email", customer.email);
    addField("Contact", customer.contact_number);
    addField("Status", customer.status);
    addField("Gender", customer.gender);
    addField("Date of Birth", customer.date_of_birth);

    addHeading("Bank Information");
    addField("DP Name", customer.dp_name);
    addField("DP ID", customer.dp_id);
    addField("CRN", customer.crn);
    addField("Bank Name", customer.bank_name);
    addField("Account Number", customer.account_number);
    addField("Client Number", customer.client_number);
    addField("Account Open Date", customer.account_open_date);

    addHeading("Personal Information");
    addField("Father Name", customer.father_name);
    addField("Mother Name", customer.mother_name);
    addField("Grandfather Name", customer.grandfather_name);
    addField("Citizenship Number", customer.citizenship_number);
    addField("PAN Number", customer.pan_number);
    addField("Issued Date", customer.issued_date);
    addField("Address", customer.address);

    addHeading("Record Information");
    addField(
      "Created",
      new Date(customer.created_at).toLocaleString(),
    );
    addField(
      "Last Updated",
      new Date(customer.updated_at).toLocaleString(),
    );

    addHeading("Attached Documents");

    if (documents.length === 0) {
      addField("Documents", "No documents attached");
    } else {
      documents.forEach((document) => {
        addField(
          document.document_type,
          `${document.file_name} — ${new Date(
            document.uploaded_at,
          ).toLocaleDateString()}`,
        );
      });
    }

    const pdfBlob = pdf.output("blob");

    await shareBlobFile(
      pdfBlob,
      `customer-${customer.id}-profile.pdf`,
      "Save or share customer PDF",
    );
  } catch (error) {
    console.error("Customer PDF generation failed:", error);
    setErrorMessage(
      error instanceof Error
        ? error.message
        : "Could not generate the customer PDF.",
    );
  } finally {
    setBusy(false);
  }
};

    if (loading) {
        return <h2 style={{ padding: "30px" }}>Loading customer...</h2>;
    }

    if (!customer) {
        return (
            <div style={{ padding: "30px" }}>
                <h2>Customer not found</h2>
                {errorMessage && <p role="alert">{errorMessage}</p>}
                <button onClick={() => navigate("/dashboard")}>
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: "30px", maxWidth: "1000px" }}>
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { color: #000; background: #fff; }
                    .customer-profile { padding: 0 !important; }
                    table { border-collapse: collapse; }
                    th, td { border: 1px solid #888; padding: 6px; }
                }
            `}</style>

            <div className="no-print">
                <button onClick={() => navigate("/dashboard")}>
                    ← Back to Dashboard
                </button>

                <button
                    onClick={() => navigate(`/customer/${customer.id}/edit`)}
                    style={{ marginLeft: "10px" }}
                >
                    Edit Customer
                </button>

                <button
  onClick={() => void handleSaveCustomerPdf()}
  disabled={busy}
  style={{ marginLeft: "10px" }}
>
  {busy ? "Preparing PDF..." : "Save Customer PDF"}
</button> 

                <button
                    onClick={() => void handleDelete()}
                    disabled={busy}
                    style={{ marginLeft: "10px" }}
                >
                    Delete Customer
                </button>
            </div>

            <div className="customer-profile">
                <h1>Customer Details</h1>

                {errorMessage && (
                    <p role="alert" style={{ color: "red" }}>
                        {errorMessage}
                    </p>
                )}

                <hr />

                <h2>Basic Information</h2>
                <p><strong>ID:</strong> {customer.id ?? "N/A"}</p>
                <p><strong>User ID:</strong> {customer.user_id}</p>
                <p><strong>Name:</strong> {customer.name}</p>
                <p><strong>Email:</strong> {customer.email || "N/A"}</p>
                <p><strong>Contact:</strong> {customer.contact_number || "N/A"}</p>
                <p><strong>Status:</strong> {customer.status}</p>
                <p><strong>Gender:</strong> {customer.gender || "N/A"}</p>
                <p><strong>Date of Birth:</strong> {customer.date_of_birth || "N/A"}</p>

                <h2>Bank Information</h2>
                <p><strong>DP Name:</strong> {customer.dp_name || "N/A"}</p>
                <p><strong>DP ID:</strong> {customer.dp_id || "N/A"}</p>
                <p><strong>CRN:</strong> {customer.crn || "N/A"}</p>
                <p><strong>Bank Name:</strong> {customer.bank_name || "N/A"}</p>
                <p><strong>Account Number:</strong> {customer.account_number || "N/A"}</p>
                <p><strong>Client Number:</strong> {customer.client_number || "N/A"}</p>
                <p><strong>Account Open Date:</strong> {customer.account_open_date || "N/A"}</p>

                <h2>Personal Information</h2>
                <p><strong>Father Name:</strong> {customer.father_name || "N/A"}</p>
                <p><strong>Mother Name:</strong> {customer.mother_name || "N/A"}</p>
                <p><strong>Grandfather Name:</strong> {customer.grandfather_name || "N/A"}</p>
                <p><strong>Citizenship Number:</strong> {customer.citizenship_number || "N/A"}</p>
                <p><strong>PAN Number:</strong> {customer.pan_number || "N/A"}</p>
                <p><strong>Issued Date:</strong> {customer.issued_date || "N/A"}</p>
                <p><strong>Address:</strong> {customer.address || "N/A"}</p>
                <p>
                    <strong>Created:</strong>{" "}
                    {new Date(customer.created_at).toLocaleString()}
                </p>
                <p>
                    <strong>Last Updated:</strong>{" "}
                    {new Date(customer.updated_at).toLocaleString()}
                </p>

                <h2>Documents</h2>

                <div className="no-print" style={{ marginBottom: "24px" }}>
                    <form onSubmit={handleDocumentUpload}>
                        <select
                            value={documentType}
                            onChange={(event) =>
                                setDocumentType(
                                    event.target.value as DocumentType | ""
                                )
                            }
                            required
                        >
                            <option value="">Select Document Type</option>
                            <option value="PHOTO">Photo</option>
                            <option value="PAN">PAN</option>
                            <option value="NID">NID</option>
                            <option value="CITIZENSHIP">Citizenship</option>
                            <option value="SIGNATURE">Signature</option>
                            <option value="THUMB">Thumb</option>
                            <option value="HARDCOPY">Hardcopy</option>
                            <option value="OTHER">Other</option>
                        </select>

                        <input
                            id="customer-document-file"
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                            onChange={(event) =>
                                setSelectedFile(
                                    event.target.files?.[0] ?? null
                                )
                            }
                            required
                            style={{ marginLeft: "10px" }}
                        />

                        <button
                            type="submit"
                            disabled={busy}
                            style={{ marginLeft: "10px" }}
                        >
                            {busy ? "Please wait..." : "Upload"}
                        </button>
                    </form>

                    <p>
                        Allowed formats: JPG, PNG, PDF. Maximum size: 10 MB.
                        Files are stored locally on this device.
                    </p>
                </div>

                {documents.length === 0 ? (
                    <p>No documents available.</p>
                ) : (
                    <table
                        border={1}
                        cellPadding={10}
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                        }}
                    >
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Document Type</th>
                                <th>File Name</th>
                                <th>Uploaded At</th>
                                <th className="no-print">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {documents.map((savedDocument) => (
                                <tr key={savedDocument.id}>
                                    <td>{savedDocument.id}</td>
                                    <td>{savedDocument.document_type}</td>
                                    <td>{savedDocument.file_name}</td>
                                    <td>
                                        {new Date(
                                            savedDocument.uploaded_at
                                        ).toLocaleString()}
                                    </td>
                                    <td className="no-print">
                                        <button
                                            onClick={() =>
                                                void handleViewDocument(
                                                    savedDocument.id!
                                                )
                                            }
                                        >
                                            View
                                        </button>

                                        <button
                                            onClick={() =>
                                                void handleDownloadDocument(
                                                    savedDocument.id!
                                                )
                                            }
                                            style={{ marginLeft: "6px" }}
                                        >
                                            Download
                                        </button>

                                        <button
                                            onClick={() =>
                                                void handleDeleteDocument(
                                                    savedDocument.id!
                                                )
                                            }
                                            disabled={busy}
                                            style={{ marginLeft: "6px" }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            {previewUrl && (
  <div
    role="dialog"
    aria-modal="true"
    aria-label="Document image preview"
    onClick={() => setPreviewUrl("")}
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "rgba(0, 0, 0, 0.88)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
    }}
  >
    <div
      style={{
        width: "100%",
        maxWidth: "900px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: "#fff",
        marginBottom: "12px",
      }}
    >
      <span
        style={{
          overflowWrap: "anywhere",
          paddingRight: "12px",
        }}
      >
        {previewName}
      </span>

      <button
        type="button"
        aria-label="Close image preview"
        onClick={() => setPreviewUrl("")}
        style={{
          fontSize: "24px",
          minWidth: "44px",
          minHeight: "44px",
        }}
      >
        ×
      </button>
    </div>

    <img
      src={previewUrl}
      alt={previewName}
      onClick={(event) => event.stopPropagation()}
      style={{
        display: "block",
        maxWidth: "100%",
        maxHeight: "80vh",
        width: "auto",
        height: "auto",
        objectFit: "contain",
      }}
    />
  </div>
)}
        </div>
    );
}

export default CustomerDetails;