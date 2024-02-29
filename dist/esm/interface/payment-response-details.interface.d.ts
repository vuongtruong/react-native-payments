import type { PaymentResponseAddressInterface } from './payment-response-address.interface';
import type { AndroidPaymentMethodToken } from '../@standard/android/response/android-payment-method-token';
import type { IosPKToken } from '../@standard/ios/response/ios-pk-token';
export interface PaymentResponseDetailsInterface {
    androidPayToken: AndroidPaymentMethodToken;
    applePayToken: IosPKToken;
    billingAddress?: PaymentResponseAddressInterface;
    payerEmail?: string;
    payerName?: string;
    payerPhone?: string;
    shippingAddress?: PaymentResponseAddressInterface;
}
//# sourceMappingURL=payment-response-details.interface.d.ts.map