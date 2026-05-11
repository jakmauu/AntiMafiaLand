import StatusBadge from "./StatusBadge";
import { formatDate, shortAddress } from "../../utils/format";

export const transactionColumns = [
  { key: "txHash", label: "TX Hash", render: (row) => shortAddress(row.txHash) },
  { key: "type", label: "Type" },
  { key: "landId", label: "Land ID" },
  { key: "from", label: "From", render: (row) => shortAddress(row.from) },
  { key: "to", label: "To", render: (row) => shortAddress(row.to) },
  { key: "riskLevel", label: "Risk", render: (row) => <StatusBadge tone={row.riskLevel}>{row.riskLevel ?? "-"}</StatusBadge> },
  { key: "status", label: "Status", render: (row) => <StatusBadge tone={row.status}>{row.status}</StatusBadge> },
  { key: "dateTime", label: "Date", render: (row) => formatDate(row.dateTime) },
];

export const landColumns = [
  { key: "landId", label: "Land ID" },
  { key: "owner", label: "Owner", render: (row) => shortAddress(row.owner) },
  { key: "metadataURI", label: "Metadata URI" },
  { key: "price", label: "Price" },
  { key: "exists", label: "Status", render: (row) => <StatusBadge tone={row.exists ? "approved" : "rejected"}>{row.exists ? "Active" : "Inactive"}</StatusBadge> },
];

export const transferColumns = [
  { key: "landId", label: "Land ID" },
  { key: "from", label: "From", render: (row) => shortAddress(row.from) },
  { key: "to", label: "To", render: (row) => shortAddress(row.to) },
  { key: "riskScore", label: "Risk Score" },
  { key: "riskLevel", label: "Risk", render: (row) => <StatusBadge tone={row.riskLevel}>{row.riskLevel}</StatusBadge> },
  { key: "status", label: "Status", render: (row) => <StatusBadge tone={row.status}>{row.status}</StatusBadge> },
];

export const userColumns = [
  { key: "fullName", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role", render: (row) => <StatusBadge tone={row.role}>{row.role}</StatusBadge> },
  { key: "walletAddress", label: "Wallet", render: (row) => row.walletAddress ? shortAddress(row.walletAddress) : "Not linked" },
  { key: "status", label: "Status", render: (row) => <StatusBadge tone={row.status}>{row.status}</StatusBadge> },
  { key: "createdAt", label: "Joined", render: (row) => formatDate(row.createdAt) },
];
