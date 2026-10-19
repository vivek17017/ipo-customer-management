
import Dexie, { type EntityTable } from "dexie";
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
export type CustomerStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";
export type CustomerGender = "M" | "F" | "O";

export type DocumentType =
  | "PHOTO"
  | "CITIZENSHIP"
  | "PAN"
  | "NID"
  | "SIGNATURE"
  | "THUMB"
  | "HARDCOPY"
  | "OTHER";

export interface Customer {
  id?: number;
  user_id: string;
  name: string;
  dp_name?: string | null;
  dp_id?: string | null;
  crn?: string | null;
  email?: string | null;
  status: CustomerStatus;
  gender?: CustomerGender | null;
  date_of_birth?: string | null;
  citizenship_number?: string | null;
  pan_number?: string | null;
  father_name?: string | null;
  mother_name?: string | null;
  grandfather_name?: string | null;
  account_open_date?: string | null;
  contact_number?: string | null;
  issued_date?: string | null;
  address?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  client_number?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerDocument {
  id?: number;
  customerId: number;
  document_type: DocumentType;
  file_name: string;
  mime_type: string;
  file_data: Blob;
  uploaded_at: string;
  updated_at: string;
}

class CustomerDatabase extends Dexie {
  customers!: EntityTable<Customer, "id">;
  documents!: EntityTable<CustomerDocument, "id">;

  constructor() {
    super("IpoCustomerManagement");

    this.version(1).stores({
      customers:
        "++id, &user_id, name, status, contact_number, account_number, pan_number, citizenship_number",
      documents:
        "++id, customerId, document_type, uploaded_at",
    });
  }
}

export const localDb = new CustomerDatabase();

export async function getCustomers(): Promise<Customer[]> {
  return localDb.customers.orderBy("name").toArray();
}

export async function getCustomer(
  id: number,
): Promise<Customer | undefined> {
  return localDb.customers.get(id);
}

export async function createCustomer(
  input: Omit<Customer, "id" | "created_at" | "updated_at">,
): Promise<number> {
  const now = new Date().toISOString();

  return localDb.transaction(
    "rw",
    localDb.customers,
    async () => {
      const existing = await localDb.customers
        .where("user_id")
        .equals(input.user_id)
        .first();

      if (existing) {
        throw new Error("Customer User ID already exists.");
      }

      const id = await localDb.customers.add({
  ...input,
  created_at: now,
  updated_at: now,
});

if (id === undefined) {
  throw new Error("Failed to create customer.");
}

return id;
    },
  );
}

export async function updateCustomer(
  id: number,
  changes: Partial<Omit<Customer, "id" | "created_at">>,
): Promise<void> {
  const existing = await localDb.customers.get(id);

  if (!existing) {
    throw new Error("Customer not found.");
  }

  if (changes.user_id && changes.user_id !== existing.user_id) {
    const duplicate = await localDb.customers
      .where("user_id")
      .equals(changes.user_id)
      .first();

    if (duplicate) {
      throw new Error("Customer User ID already exists.");
    }
  }

  await localDb.customers.update(id, {
    ...changes,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteCustomer(id: number): Promise<void> {
  await localDb.transaction(
    "rw",
    localDb.customers,
    localDb.documents,
    async () => {
      await localDb.documents.where("customerId").equals(id).delete();
      await localDb.customers.delete(id);
    },
  );
}

export async function searchCustomers(
  query: string,
): Promise<Customer[]> {
  const term = query.trim().toLowerCase();

  const customers = await getCustomers();

  if (!term) return customers;

  return customers.filter((customer) =>
    [
      customer.user_id,
      customer.name,
      customer.contact_number,
      customer.account_number,
      customer.pan_number,
      customer.citizenship_number,
      customer.client_number,
    ].some((value) => value?.toLowerCase().includes(term)),
  );
}

export async function addCustomerDocument(
  customerId: number,
  documentType: DocumentType,
  file: File,
): Promise<number> {
  if (!(await localDb.customers.get(customerId))) {
    throw new Error("Customer not found.");
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only JPG, PNG, and PDF files are allowed.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File size must not exceed 10 MB.");
  }

  const now = new Date().toISOString();

  const id = await localDb.documents.add({
  customerId,
  document_type: documentType,
  file_name: file.name,
  mime_type: file.type,
  file_data: file,
  uploaded_at: now,
  updated_at: now,
});

if (id === undefined) {
  throw new Error("Failed to save document.");
}

return id;
}

export async function getCustomerDocuments(
  customerId: number,
): Promise<CustomerDocument[]> {
  return localDb.documents
    .where("customerId")
    .equals(customerId)
    .reverse()
    .sortBy("uploaded_at");
}

export async function deleteCustomerDocument(
  documentId: number,
): Promise<void> {
  await localDb.documents.delete(documentId);
}
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(new Error("Could not convert file."));
        return;
      }

      resolve(result.split(",")[1]);
    };

    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(blob);
  });
}

function safeFileName(fileName: string): string {
  return fileName.replace(/[\\/:*?"<>|]/g, "_");
}

export async function shareBlobFile(
  blob: Blob,
  fileName: string,
  title: string,
): Promise<void> {
  const safeName = safeFileName(fileName);

  if (Capacitor.isNativePlatform()) {
    const base64 = await blobToBase64(blob);

    const savedFile = await Filesystem.writeFile({
      path: safeName,
      data: base64,
      directory: Directory.Cache,
      recursive: true,
    });

    await Share.share({
      title,
      text: fileName,
      url: savedFile.uri,
      dialogTitle: title,
    });

    return;
  }

  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");

  anchor.href = url;
  anchor.download = safeName;
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 3000);
}

export async function getCustomerDocument(
  documentId: number,
): Promise<CustomerDocument> {
  const savedDocument = await localDb.documents.get(documentId);

  if (!savedDocument) {
    throw new Error("Document not found.");
  }

  return savedDocument;
}
export async function openCustomerDocument(
  documentId: number,
): Promise<void> {
  const savedDocument = await getCustomerDocument(documentId);

  if (Capacitor.isNativePlatform()) {
    await shareBlobFile(
      savedDocument.file_data,
      savedDocument.file_name,
      "Open or share document",
    );
    return;
  }

  const url = URL.createObjectURL(savedDocument.file_data);
  const opened = window.open(url, "_blank");

  if (!opened) {
    URL.revokeObjectURL(url);
    throw new Error("The browser blocked the document window.");
  }

  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export async function downloadCustomerDocument(
  documentId: number,
): Promise<void> {
  const savedDocument = await getCustomerDocument(documentId);

  await shareBlobFile(
    savedDocument.file_data,
    savedDocument.file_name,
    "Save or share document",
  );
}