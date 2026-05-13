// ─── UPI Payment Details ──────────────────────────────────────────────────────
export const UPI_ID = "unityems2@indianbk";
export const UPI_NAME = "Emerald International School";
export const ACADEMIC_YEAR = "2025-26";

// ─── Fee Structure ────────────────────────────────────────────────────────────
// LKG / UKG           → ₹16,000
// I, II               → ₹15,000
// III, IV, V          → ₹15,500
// VI, VII and above   → ₹16,000
export function getCourseFee(classSection: string): number {
  const s = classSection.trim();
  if (/^(LKG|UKG)$/i.test(s)) return 16_000;
  if (/^(I|II)-/i.test(s)) return 15_000;
  if (/^(III|IV|V)-/i.test(s)) return 15_500;
  return 16_000; // VI, VII, VIII, IX, X, XI, XII
}

export const FEE_STRUCTURE_LABELS = [
  { label: "LKG / UKG", amount: 16_000 },
  { label: "Class 1 – 2", amount: 15_000 },
  { label: "Class 3 – 5", amount: 15_500 },
  { label: "Class 6 & above", amount: 16_000 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

/** Returns a QR code image URL (api.qrserver.com) for the UPI ID. */
export function getQrUrl(size = 240): string {
  const data = encodeURIComponent(`upi://pay?pa=${UPI_ID}&pn=${UPI_NAME}&cu=INR`);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${data}&color=1a1a1a&bgcolor=ffffff`;
}

/** Returns a UPI deep-link that pre-fills the amount (optional). */
export function getUpiLink(amount?: number): string {
  let url = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&cu=INR`;
  if (amount && amount > 0) url += `&am=${amount}`;
  return url;
}
