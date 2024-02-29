"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AndroidPaymentResponse = void 0;
const shared_1 = require("@rnw-community/shared");
const android_intermediate_signing_key_1 = require("../../@standard/android/response/android-intermediate-signing-key");
const android_payment_method_token_1 = require("../../@standard/android/response/android-payment-method-token");
const ios_pk_token_1 = require("../../@standard/ios/response/ios-pk-token");
const payment_response_1 = require("./payment-response");
class AndroidPaymentResponse extends payment_response_1.PaymentResponse {
    constructor(requestId, methodName, jsonData) {
        const data = JSON.parse(jsonData);
        super(requestId, methodName, {
            billingAddress: AndroidPaymentResponse.parseFullAddress(data.paymentMethodData.info.billingAddress),
            androidPayToken: AndroidPaymentResponse.parseToken(data.paymentMethodData.tokenizationData.token),
            applePayToken: ios_pk_token_1.emptyIosPKToken,
            payerEmail: data.email,
            ...((0, shared_1.isDefined)(data.shippingAddress) && {
                payerName: data.shippingAddress.name,
                payerPhone: data.shippingAddress.phoneNumber ?? '',
            }),
            ...((0, shared_1.isDefined)(data.paymentMethodData.info.billingAddress) && {
                payerName: data.paymentMethodData.info.billingAddress.name,
                payerPhone: data.paymentMethodData.info.billingAddress.phoneNumber ?? '',
            }),
            shippingAddress: AndroidPaymentResponse.parseFullAddress(data.shippingAddress),
        });
    }
    static parseToken(input = '{}') {
        if (input === 'examplePaymentMethodToken') {
            return android_payment_method_token_1.emptyAndroidPaymentMethodToken;
        }
        const parsedToken = JSON.parse(input);
        return {
            ...android_payment_method_token_1.emptyAndroidPaymentMethodToken,
            ...parsedToken,
            rawToken: input,
            intermediateSigningKey: {
                ...((0, shared_1.isDefined)(parsedToken.intermediateSigningKey)
                    ? {
                        ...parsedToken.intermediateSigningKey,
                        signedKey: JSON.parse(parsedToken.intermediateSigningKey.signedKey),
                    }
                    : android_intermediate_signing_key_1.emptyAndroidIntermediateSigningKey),
            },
            signedMessage: JSON.parse(parsedToken.signedMessage),
        };
    }
    static parseFullAddress(input) {
        return {
            countryCode: input?.countryCode ?? '',
            postalCode: input?.postalCode ?? '',
            address1: input?.address1 ?? '',
            address2: input?.address2 ?? '',
            address3: input?.address3 ?? '',
            administrativeArea: input?.administrativeArea ?? '',
            locality: input?.locality ?? '',
            sortingCode: input?.sortingCode ?? '',
        };
    }
}
exports.AndroidPaymentResponse = AndroidPaymentResponse;
//# sourceMappingURL=android-payment-response.js.map