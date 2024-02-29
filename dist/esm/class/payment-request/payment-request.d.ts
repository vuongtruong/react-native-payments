import { AndroidPaymentResponse } from '../payment-response/android-payment-response';
import { IosPaymentResponse } from '../payment-response/ios-payment-response';
import type { PaymentDetailsInit } from '../../@standard/w3c/payment-details-init';
import type { PaymentMethodData } from '../../@standard/w3c/payment-method-data';
export declare class PaymentRequest {
    readonly methodData: PaymentMethodData[];
    details: PaymentDetailsInit;
    readonly id: string;
    updating: boolean;
    state: 'closed' | 'created' | 'interactive';
    private readonly serializedMethodData;
    private readonly platformMethodData;
    private acceptPromiseRejecter;
    constructor(methodData: PaymentMethodData[], details: PaymentDetailsInit);
    canMakePayment(): Promise<boolean>;
    show(): Promise<AndroidPaymentResponse | IosPaymentResponse>;
    abort(): Promise<void>;
    private handleAccept;
    private findPlatformPaymentMethodData;
    private getAndroidPaymentMethodData;
    private getIosPaymentMethodData;
}
//# sourceMappingURL=payment-request.d.ts.map