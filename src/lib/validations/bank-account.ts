export interface BankAccountInfo {
  bankName: string;
  bankCode: string;
  branchName: string;
  branchCode: string;
  accountType: "ORDINARY" | "CHECKING" | "SAVINGS";
  accountNumber: string;
  accountHolderName: string;
}

export const ACCOUNT_TYPE_LABELS: Record<BankAccountInfo["accountType"], string> = {
  ORDINARY: "普通",
  CHECKING: "当座",
  SAVINGS: "貯蓄",
};

export function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber || accountNumber.length <= 4) return accountNumber ?? "";
  return "*".repeat(accountNumber.length - 4) + accountNumber.slice(-4);
}

export function isBankAccountComplete(info: unknown): info is BankAccountInfo {
  if (!info || typeof info !== "object") return false;
  const obj = info as Record<string, unknown>;
  return (
    typeof obj.bankName === "string" && obj.bankName.length > 0 &&
    typeof obj.bankCode === "string" && obj.bankCode.length > 0 &&
    typeof obj.branchName === "string" && obj.branchName.length > 0 &&
    typeof obj.branchCode === "string" && obj.branchCode.length > 0 &&
    typeof obj.accountType === "string" && obj.accountType.length > 0 &&
    typeof obj.accountNumber === "string" && obj.accountNumber.length > 0 &&
    typeof obj.accountHolderName === "string" && obj.accountHolderName.length > 0
  );
}
