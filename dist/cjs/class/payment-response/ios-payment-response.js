"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IosPaymentResponse = void 0;
const shared_1 = require("@rnw-community/shared");
const android_payment_method_token_1 = require("../../@standard/android/response/android-payment-method-token");
const ios_payment_data_1 = require("../../@standard/ios/response/ios-payment-data");
const payment_response_1 = require("./payment-response");
class IosPaymentResponse extends payment_response_1.PaymentResponse {
    constructor(requestId, methodName, jsonData) {
        const data = JSON.parse(jsonData);
        super(requestId, methodName, {
            billingAddress: IosPaymentResponse.parsePKContact(data.billingContact?.postalAddress),
            applePayToken: IosPaymentResponse.parsePkToken(data.token),
            androidPayToken: android_payment_method_token_1.emptyAndroidPaymentMethodToken,
            payerEmail: data.shippingContact?.emailAddress ?? '',
            payerName: IosPaymentResponse.parseNSPersonNameComponents(data.shippingContact?.name),
            payerPhone: IosPaymentResponse.parseCNPhoneNumber(data.shippingContact?.phoneNumber),
            shippingAddress: IosPaymentResponse.parsePKContact(data.shippingContact?.postalAddress),
        });
    }
    static parsePkToken(input) {
        return {
            ...input,
            paymentData: (0, shared_1.isNotEmptyString)(input.paymentData)
                ? JSON.parse(input.paymentData)
                : ios_payment_data_1.emptyIosPaymentData,
        };
    }
    static parsePKContact(input) {
        return {
            countryCode: input?.ISOCountryCode ?? '',
            postalCode: input?.postalCode ?? '',
            address1: input?.street ?? '',
            address2: input?.city ?? '',
            address3: input?.state ?? '',
            administrativeArea: input?.subAdministrativeArea ?? '',
            locality: input?.subLocality ?? '',
            sortingCode: '',
        };
    }
    static parseNSPersonNameComponents(input) {
        return [input?.familyName, input?.middleName, input?.givenName].filter(shared_1.isNotEmptyString).join('');
    }
    static parseCNPhoneNumber(input) {
        return input?.stringValue ?? '';
    }
}
exports.IosPaymentResponse = IosPaymentResponse;
//# sourceMappingURL=ios-payment-response.js.map