export interface OpenDartCorporation {
  corpCode: string;
  corpName: string;
  stockCode: string | null;
}

export type OpenDartCorporationLookupStatus =
  | "success"
  | "not_configured"
  | "company_not_found"
  | "stock_code_not_found"
  | "rate_limited"
  | "auth_error"
  | "unavailable";

export interface OpenDartCorporationLookupResult {
  company: OpenDartCorporation | null;
  message: string;
  requestedName: string | null;
  status: OpenDartCorporationLookupStatus;
}

export interface OpenDartDisclosure {
  corpCode: string;
  corpName: string;
  filerName: string;
  originalUrl: string | null;
  receiptDate: string;
  receiptNo: string;
  remarks: string;
  reportName: string;
  stockCode: string | null;
}

export type OpenDartLookupStatus =
  | "success"
  | "not_configured"
  | "company_not_found"
  | "no_disclosures"
  | "rate_limited"
  | "auth_error"
  | "unavailable";

export interface OpenDartLookupResult {
  company: OpenDartCorporation | null;
  disclosures: OpenDartDisclosure[];
  message: string;
  requestedName: string | null;
  searchRange: {
    from: string;
    to: string;
  } | null;
  status: OpenDartLookupStatus;
}
