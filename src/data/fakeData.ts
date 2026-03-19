export interface Invoice {
  id: string;
  vendorName: string;
  vendorId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  currency: string;
  lineItems: { description: string; qty: number; unitPrice: number; total: number }[];
  poReference: string | null;
  submittedBy: string;
}

export interface PurchaseOrder {
  poNumber: string;
  vendorId: string;
  vendorName: string;
  approvedAmount: number;
  remainingBalance: number;
  approvedBy: string;
  expiryDate: string;
  category: string;
}

export const PURCHASE_ORDERS: PurchaseOrder[] = [
  { poNumber: "PO-2024-0041", vendorId: "V-1021", vendorName: "Acme Office Supplies", approvedAmount: 12000, remainingBalance: 7450, approvedBy: "Sarah Chen", expiryDate: "2024-12-31", category: "Office Supplies" },
  { poNumber: "PO-2024-0055", vendorId: "V-1034", vendorName: "TechForce IT Solutions", approvedAmount: 45000, remainingBalance: 28000, approvedBy: "Mark Rivera", expiryDate: "2024-09-30", category: "IT Services" },
  { poNumber: "PO-2024-0062", vendorId: "V-1047", vendorName: "CloudHost Inc", approvedAmount: 8400, remainingBalance: 8400, approvedBy: "Sarah Chen", expiryDate: "2025-03-31", category: "Cloud Infrastructure" },
  { poNumber: "PO-2024-0078", vendorId: "V-1058", vendorName: "Meridian Consulting", approvedAmount: 30000, remainingBalance: 4200, approvedBy: "James Okafor", expiryDate: "2024-11-30", category: "Consulting" },
];

export const INVOICES: Invoice[] = [
  {
    id: "INV-001",
    vendorName: "Acme Office Supplies",
    vendorId: "V-1021",
    invoiceNumber: "ACM-88231",
    invoiceDate: "2024-10-15",
    dueDate: "2024-11-14",
    amount: 3240.00,
    currency: "USD",
    lineItems: [
      { description: "Printer paper (case x20)", qty: 20, unitPrice: 48.00, total: 960.00 },
      { description: "Ergonomic desk chairs", qty: 6, unitPrice: 380.00, total: 2280.00 },
    ],
    poReference: "PO-2024-0041",
    submittedBy: "Linda Park",
  },
  {
    id: "INV-002",
    vendorName: "TechForce IT Solutions",
    vendorId: "V-1034",
    invoiceNumber: "TF-2024-5591",
    invoiceDate: "2024-10-18",
    dueDate: "2024-11-17",
    amount: 31500.00,
    currency: "USD",
    lineItems: [
      { description: "Managed IT support — Q4 retainer", qty: 1, unitPrice: 18000.00, total: 18000.00 },
      { description: "Network infrastructure upgrade", qty: 1, unitPrice: 13500.00, total: 13500.00 },
    ],
    poReference: "PO-2024-0055",
    submittedBy: "Derek Johnson",
  },
  {
    id: "INV-003",
    vendorName: "Meridian Consulting",
    vendorId: "V-1058",
    invoiceNumber: "MC-10042",
    invoiceDate: "2024-10-20",
    dueDate: "2024-11-19",
    amount: 7500.00,
    currency: "USD",
    lineItems: [
      { description: "Strategy consulting — October", qty: 50, unitPrice: 150.00, total: 7500.00 },
    ],
    poReference: "PO-2024-0078",
    submittedBy: "Rachel Kim",
  },
  {
    id: "INV-004",
    vendorName: "SupplyChain Direct",
    vendorId: "V-9901",
    invoiceNumber: "SCD-44021",
    invoiceDate: "2024-10-22",
    dueDate: "2024-11-21",
    amount: 5800.00,
    currency: "USD",
    lineItems: [
      { description: "Warehouse shelving units x12", qty: 12, unitPrice: 350.00, total: 4200.00 },
      { description: "Packing materials (bulk)", qty: 1, unitPrice: 1600.00, total: 1600.00 },
    ],
    poReference: null,
    submittedBy: "Tom Nguyen",
  },
  {
    id: "INV-005",
    vendorName: "CloudHost Inc",
    vendorId: "V-1047",
    invoiceNumber: "CH-2024-0310",
    invoiceDate: "2024-10-01",
    dueDate: "2024-10-31",
    amount: 2100.00,
    currency: "USD",
    lineItems: [
      { description: "Cloud hosting — October 2024", qty: 1, unitPrice: 2100.00, total: 2100.00 },
    ],
    poReference: "PO-2024-0062",
    submittedBy: "Linda Park",
  },
];
