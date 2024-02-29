import type { AndroidRawIntermediateSigningKey } from './android-raw-intermediate-signing-key';
export interface AndroidRawPaymentMethodToken {
    intermediateSigningKey: AndroidRawIntermediateSigningKey;
    protocolVersion: string;
    signature: string;
    signedMessage: string;
}
//# sourceMappingURL=android-raw-payment-method-token.d.ts.map