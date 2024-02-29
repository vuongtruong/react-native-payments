"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRequest = void 0;
/* eslint-disable max-lines */
const react_native_uuid_1 = __importDefault(require("react-native-uuid"));
const platform_1 = require("@rnw-community/platform");
const shared_1 = require("@rnw-community/shared");
const android_payment_method_tokenization_type_enum_1 = require("../../@standard/android/enum/android-payment-method-tokenization-type.enum");
const android_payment_data_request_1 = require("../../@standard/android/request/android-payment-data-request");
const android_payment_method_1 = require("../../@standard/android/request/android-payment-method");
const android_transaction_info_1 = require("../../@standard/android/request/android-transaction-info");
const ios_pk_merchant_capability_enum_1 = require("../../@standard/ios/enum/ios-pk-merchant-capability.enum");
const ios_pk_payment_networks_enum_1 = require("../../@standard/ios/enum/ios-pk-payment-networks.enum");
const payment_method_name_enum_1 = require("../../enum/payment-method-name.enum");
const payments_error_enum_1 = require("../../enum/payments-error.enum");
const supported_networks_enum_1 = require("../../enum/supported-networks.enum");
const constructor_error_1 = require("../../error/constructor.error");
const dom_exception_1 = require("../../error/dom.exception");
const payments_error_1 = require("../../error/payments.error");
const validate_display_items_util_1 = require("../../util/validate-display-items.util");
const validate_payment_methods_util_1 = require("../../util/validate-payment-methods.util");
const validate_total_util_1 = require("../../util/validate-total.util");
const native_payments_1 = require("../native-payments/native-payments");
const android_payment_response_1 = require("../payment-response/android-payment-response");
const ios_payment_response_1 = require("../payment-response/ios-payment-response");
/*
 * HINT: Troubleshooting: https://developers.google.com/pay/api/android/support/troubleshooting
 * HINT: Google Pay API Errors: https://developers.google.com/pay/api/web/reference/error-objects
 */
class PaymentRequest {
    // eslint-disable-next-line max-statements
    constructor(methodData, details) {
        this.methodData = methodData;
        this.details = details;
        this.updating = false;
        this.state = 'created';
        this.acceptPromiseRejecter = shared_1.emptyFn;
        // 3. Establish the request's id:
        if (!(0, shared_1.isNotEmptyString)(details.id)) {
            // TODO: Can we avoid using external lib? Use Math.random?
            details.id = react_native_uuid_1.default.v4();
        }
        this.id = details.id;
        // 4. Process payment methods
        (0, validate_payment_methods_util_1.validatePaymentMethods)(methodData);
        // 5. Process the total
        (0, validate_total_util_1.validateTotal)(details.total, constructor_error_1.ConstructorError);
        // 6. If the displayItems member of details is present, then for each item in details.displayItems:
        (0, validate_display_items_util_1.validateDisplayItems)(details.displayItems, constructor_error_1.ConstructorError);
        // 17. Set request.[[serializedMethodData]] to serializedMethodData.         */
        this.platformMethodData = this.findPlatformPaymentMethodData();
        const nativePlatformMethodData = platform_1.isAndroid
            ? this.getAndroidPaymentMethodData(this.platformMethodData, details)
            : this.getIosPaymentMethodData(this.platformMethodData);
        this.serializedMethodData = JSON.stringify(nativePlatformMethodData);
    }
    // https://www.w3.org/TR/payment-request/#canmakepayment-method
    async canMakePayment() {
        if (this.state !== 'created') {
            throw new dom_exception_1.DOMException(payments_error_enum_1.PaymentsErrorEnum.InvalidStateError);
        }
        return await native_payments_1.NativePayments.canMakePayments(this.serializedMethodData);
    }
    // https://www.w3.org/TR/payment-request/#show-method
    show() {
        return new Promise((resolve, reject) => {
            this.acceptPromiseRejecter = reject;
            if (this.state === 'created') {
                this.state = 'interactive';
                // HINT: We need to pass Android environment configuration to native module via details
                const details = platform_1.isAndroid
                    ? {
                        ...this.details,
                        environment: this.platformMethodData.environment,
                    }
                    : this.details;
                native_payments_1.NativePayments.show(this.serializedMethodData, details)
                    .then(jsonDetails => {
                    resolve(this.handleAccept(jsonDetails));
                    return void 0;
                })
                    .catch(reject);
            }
            else {
                reject(new dom_exception_1.DOMException(payments_error_enum_1.PaymentsErrorEnum.InvalidStateError));
            }
        });
    }
    // https://www.w3.org/TR/payment-request/#abort-method
    async abort() {
        if (this.state !== 'interactive') {
            throw new dom_exception_1.DOMException(payments_error_enum_1.PaymentsErrorEnum.InvalidStateError);
        }
        await native_payments_1.NativePayments.abort().catch(() => {
            throw new dom_exception_1.DOMException(payments_error_enum_1.PaymentsErrorEnum.InvalidStateError);
        });
        this.state = 'closed';
        this.acceptPromiseRejecter(new dom_exception_1.DOMException(payments_error_enum_1.PaymentsErrorEnum.AbortError));
    }
    handleAccept(details) {
        try {
            return platform_1.isAndroid
                ? new android_payment_response_1.AndroidPaymentResponse(this.id, payment_method_name_enum_1.PaymentMethodNameEnum.AndroidPay, details)
                : new ios_payment_response_1.IosPaymentResponse(this.id, payment_method_name_enum_1.PaymentMethodNameEnum.ApplePay, details);
        }
        catch (e) {
            throw new payments_error_1.PaymentsError(`Failed creating AndroidPaymentResponse: ${(0, shared_1.getErrorMessage)(e)}`);
        }
    }
    findPlatformPaymentMethodData() {
        const platformSupportedMethod = platform_1.isIOS ? payment_method_name_enum_1.PaymentMethodNameEnum.ApplePay : payment_method_name_enum_1.PaymentMethodNameEnum.AndroidPay;
        const platformMethod = this.methodData.find(paymentMethodData => paymentMethodData.supportedMethods === platformSupportedMethod);
        if (!(0, shared_1.isDefined)(platformMethod)) {
            throw new dom_exception_1.DOMException(payments_error_enum_1.PaymentsErrorEnum.NotSupportedError);
        }
        return platformMethod.data;
    }
    // eslint-disable-next-line class-methods-use-this,@typescript-eslint/class-methods-use-this
    getAndroidPaymentMethodData(methodData, details) {
        return {
            ...android_payment_data_request_1.defaultAndroidPaymentDataRequest,
            merchantInfo: {
                merchantName: details.total.label,
            },
            transactionInfo: {
                ...android_transaction_info_1.defaultAndroidTransactionInfo,
                currencyCode: methodData.currencyCode,
                totalPrice: details.total.amount.value,
                totalPriceLabel: details.total.label,
                countryCode: methodData.countryCode,
            },
            allowedPaymentMethods: [
                {
                    ...android_payment_method_1.defaultAndroidPaymentMethod,
                    parameters: {
                        ...android_payment_method_1.defaultAndroidPaymentMethod.parameters,
                        allowedCardNetworks: methodData.supportedNetworks.map(network => network.toUpperCase()),
                        allowedAuthMethods: methodData.allowedAuthMethods ?? android_payment_method_1.defaultAndroidPaymentMethod.parameters.allowedAuthMethods,
                        ...(methodData.requestBilling === true && {
                            billingAddressRequired: true,
                            billingAddressParameters: {
                                format: 'FULL',
                                phoneNumberRequired: true,
                            },
                        }),
                    },
                    ...((0, shared_1.isDefined)(methodData.gatewayConfig) && {
                        tokenizationSpecification: {
                            parameters: methodData.gatewayConfig,
                            type: android_payment_method_tokenization_type_enum_1.AndroidPaymentMethodTokenizationType.PAYMENT_GATEWAY,
                        },
                    }),
                    ...((0, shared_1.isDefined)(methodData.directConfig) && {
                        tokenizationSpecification: {
                            parameters: methodData.directConfig,
                            type: android_payment_method_tokenization_type_enum_1.AndroidPaymentMethodTokenizationType.DIRECT,
                        },
                    }),
                },
            ],
            ...(methodData.requestEmail === true && { emailRequired: true }),
            ...(methodData.requestShipping === true && {
                shippingAddressRequired: true,
                shippingAddressParameters: {
                    phoneNumberRequired: true,
                },
            }),
        };
    }
    // eslint-disable-next-line class-methods-use-this,@typescript-eslint/class-methods-use-this
    getIosPaymentMethodData(methodData) {
        // TODO: Add mappings for other systems if needed
        const supportedNetworkMap = {
            [supported_networks_enum_1.SupportedNetworkEnum.Amex]: ios_pk_payment_networks_enum_1.IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [supported_networks_enum_1.SupportedNetworkEnum.Mastercard]: ios_pk_payment_networks_enum_1.IosPKPaymentNetworksEnum.PKPaymentNetworkMasterCard,
            [supported_networks_enum_1.SupportedNetworkEnum.Visa]: ios_pk_payment_networks_enum_1.IosPKPaymentNetworksEnum.PKPaymentNetworkVisa,
            [supported_networks_enum_1.SupportedNetworkEnum.Discover]: ios_pk_payment_networks_enum_1.IosPKPaymentNetworksEnum.PKPaymentNetworkDiscover,
            [supported_networks_enum_1.SupportedNetworkEnum.Bancontact]: ios_pk_payment_networks_enum_1.IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [supported_networks_enum_1.SupportedNetworkEnum.CartesBancaires]: ios_pk_payment_networks_enum_1.IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [supported_networks_enum_1.SupportedNetworkEnum.ChinaUnionPay]: ios_pk_payment_networks_enum_1.IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [supported_networks_enum_1.SupportedNetworkEnum.Dankort]: ios_pk_payment_networks_enum_1.IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [supported_networks_enum_1.SupportedNetworkEnum.Eftpos]: ios_pk_payment_networks_enum_1.IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [supported_networks_enum_1.SupportedNetworkEnum.Electron]: ios_pk_payment_networks_enum_1.IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [supported_networks_enum_1.SupportedNetworkEnum.Elo]: ios_pk_payment_networks_enum_1.IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [supported_networks_enum_1.SupportedNetworkEnum.Girocard]: ios_pk_payment_networks_enum_1.IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [supported_networks_enum_1.SupportedNetworkEnum.Interac]: ios_pk_payment_networks_enum_1.IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [supported_networks_enum_1.SupportedNetworkEnum.Jcb]: ios_pk_payment_networks_enum_1.IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [supported_networks_enum_1.SupportedNetworkEnum.Mada]: ios_pk_payment_networks_enum_1.IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [supported_networks_enum_1.SupportedNetworkEnum.Maestro]: ios_pk_payment_networks_enum_1.IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [supported_networks_enum_1.SupportedNetworkEnum.Mir]: ios_pk_payment_networks_enum_1.IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [supported_networks_enum_1.SupportedNetworkEnum.PrivateLabel]: ios_pk_payment_networks_enum_1.IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [supported_networks_enum_1.SupportedNetworkEnum.Vpay]: ios_pk_payment_networks_enum_1.IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
        };
        const defaultMerchantCapabilities = [
            ios_pk_merchant_capability_enum_1.IosPKMerchantCapability.PKMerchantCapability3DS,
            ios_pk_merchant_capability_enum_1.IosPKMerchantCapability.PKMerchantCapabilityDebit,
            ios_pk_merchant_capability_enum_1.IosPKMerchantCapability.PKMerchantCapabilityCredit,
        ];
        return {
            countryCode: methodData.countryCode,
            currencyCode: methodData.currencyCode,
            merchantIdentifier: methodData.merchantIdentifier,
            supportedNetworks: methodData.supportedNetworks.map(network => supportedNetworkMap[network]),
            merchantCapabilities: (0, shared_1.isNotEmptyArray)(methodData.merchantCapabilities)
                ? methodData.merchantCapabilities
                : defaultMerchantCapabilities,
            ...(methodData.requestBilling === true && { requiredBillingContactFields: true }),
            ...(methodData.requestShipping === true && { requiredShippingContactFields: true }),
        };
    }
}
exports.PaymentRequest = PaymentRequest;
//# sourceMappingURL=payment-request.js.map