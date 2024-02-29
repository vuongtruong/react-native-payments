import type { IosCNPhoneNumber } from './ios-cn-phone-number';
import type { IosCNPostalAddress } from './ios-cn-postal-address';
import type { IosNSPersonNameComponents } from './ios-ns-person-name-components';
export interface IosPKContact {
    emailAddress: string;
    name: IosNSPersonNameComponents;
    phoneNumber: IosCNPhoneNumber;
    postalAddress: IosCNPostalAddress;
}
//# sourceMappingURL=ios-pk-contact.d.ts.map