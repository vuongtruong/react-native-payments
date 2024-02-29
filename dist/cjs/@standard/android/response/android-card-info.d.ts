import type { AndroidAssuranceDetailsSpecifications } from './android-assurance-details-specifications';
import type { AndroidFullAddress } from './android-full-address';
export interface AndroidCardInfo {
    assuranceDetails: AndroidAssuranceDetailsSpecifications;
    billingAddress?: AndroidFullAddress;
    cardDetails: string;
    cardNetwork: string;
}
//# sourceMappingURL=android-card-info.d.ts.map