//interface cho decortor custom dữ liệu user
export interface IUser {
  _id: string;

  email: string;

  role: string;

  status: string;

  fullname?: string;
}

export interface RfPayload {
  _id: string;
  fullname: string;
  email: string;
}
export interface Checkpass {
  oldPassword: string;
  newPassword: string;
}
export interface JwtPayload {
  id: string | number;
  role: string;
  status: string;
  fullname: string;
  email: string;
}

export interface AuthTokensResponse {
  accessToken?: string;
  refreshToken?: string;
  user?: Record<string, any>;
  message?: string;
}
export interface IApprovalUpdateData {
  newData: Record<string, any>;
}
//interface cho aproved response
export interface IApprovedSuccessPayload {
  email: string;
  deviceId: string;
  fullname: string;
  status: string;
  claimCode?: string;
}
