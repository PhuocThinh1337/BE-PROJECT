export class FileResponseDto {
  fileId: string;
  fileName: string;
  contentType: string;
  size: number;
  url: string;
}

export class EnterpriseDetailResponseDto {
  name: string;
  taxCode: string;
  licenseIssueDate?: string | null;
  businessTypeId: string;
  businessIndustryId: string;
  province: string;
  ward: string;
  address?: string | null;
  foreignName?: string | null;
  email: string;
  officePhone?: string | null;
  operatingProvince?: string | null;
  operatingWard?: string | null;
  businessLocation?: string | null;
  representative?: string | null;
  representativePhone?: string | null;
  businessLicense?: FileResponseDto | null;
  otherDocument?: FileResponseDto | null;
}
