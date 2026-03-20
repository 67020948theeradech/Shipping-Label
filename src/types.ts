export type UserRole = 'admin' | 'staff';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  weight?: number;
  dimensions?: string;
  createdAt: any;
}

export interface Recipient {
  id: string;
  name: string;
  phone: string;
  address: string;
  province: string;
  district: string;
  postalCode: string;
  createdAt: any;
}

export type LabelSize = '100x75' | '100x150';
export type LabelStatus = 'pending' | 'printed';

export interface ShippingLabel {
  id: string;
  recipientId: string;
  productIds?: string[];
  size: LabelSize;
  status: LabelStatus;
  createdAt: any;
  printedAt?: any;
}

export interface OperationType {
  CREATE: 'create';
  UPDATE: 'update';
  DELETE: 'delete';
  LIST: 'list';
  GET: 'get';
  WRITE: 'write';
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: string;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}
