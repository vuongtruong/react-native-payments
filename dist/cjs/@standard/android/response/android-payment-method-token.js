"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptyAndroidPaymentMethodToken = void 0;
const android_intermediate_signing_key_1 = require("./android-intermediate-signing-key");
const android_signed_message_1 = require("./android-signed-message");
exports.emptyAndroidPaymentMethodToken = {
    intermediateSigningKey: android_intermediate_signing_key_1.emptyAndroidIntermediateSigningKey,
    protocolVersion: '',
    signature: '',
    signedMessage: android_signed_message_1.emptyAndroidSignedMessage,
    rawToken: '',
};
//# sourceMappingURL=android-payment-method-token.js.map