/* eslint-disable max-lines */
import uuid from 'react-native-uuid';
import { isAndroid, isIOS } from '@rnw-community/platform';
import { emptyFn, getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';
import { AndroidPaymentMethodTokenizationType } from '../../@standard/android/enum/android-payment-method-tokenization-type.enum';
import { defaultAndroidPaymentDataRequest } from '../../@standard/android/request/android-payment-data-request';
import { defaultAndroidPaymentMethod } from '../../@standard/android/request/android-payment-method';
import { defaultAndroidTransactionInfo } from '../../@standard/android/request/android-transaction-info';
import { IosPKMerchantCapability } from '../../@standard/ios/enum/ios-pk-merchant-capability.enum';
import { IosPKPaymentNetworksEnum } from '../../@standard/ios/enum/ios-pk-payment-networks.enum';
import { PaymentMethodNameEnum } from '../../enum/payment-method-name.enum';
import { PaymentsErrorEnum } from '../../enum/payments-error.enum';
import { SupportedNetworkEnum } from '../../enum/supported-networks.enum';
import { ConstructorError } from '../../error/constructor.error';
import { DOMException } from '../../error/dom.exception';
import { PaymentsError } from '../../error/payments.error';
import { validateDisplayItems } from '../../util/validate-display-items.util';
import { validatePaymentMethods } from '../../util/validate-payment-methods.util';
import { validateTotal } from '../../util/validate-total.util';
import { NativePayments } from '../native-payments/native-payments';
import { AndroidPaymentResponse } from '../payment-response/android-payment-response';
import { IosPaymentResponse } from '../payment-response/ios-payment-response';
/*
 * HINT: Troubleshooting: https://developers.google.com/pay/api/android/support/troubleshooting
 * HINT: Google Pay API Errors: https://developers.google.com/pay/api/web/reference/error-objects
 */
export class PaymentRequest {
    // eslint-disable-next-line max-statements
    constructor(methodData, details) {
        this.methodData = methodData;
        this.details = details;
        this.updating = false;
        this.state = 'created';
        this.acceptPromiseRejecter = emptyFn;
        // 3. Establish the request's id:
        if (!isNotEmptyString(details.id)) {
            // TODO: Can we avoid using external lib? Use Math.random?
            details.id = uuid.v4();
        }
        this.id = details.id;
        // 4. Process payment methods
        validatePaymentMethods(methodData);
        // 5. Process the total
        validateTotal(details.total, ConstructorError);
        // 6. If the displayItems member of details is present, then for each item in details.displayItems:
        validateDisplayItems(details.displayItems, ConstructorError);
        // 17. Set request.[[serializedMethodData]] to serializedMethodData.         */
        this.platformMethodData = this.findPlatformPaymentMethodData();
        const nativePlatformMethodData = isAndroid
            ? this.getAndroidPaymentMethodData(this.platformMethodData, details)
            : this.getIosPaymentMethodData(this.platformMethodData);
        this.serializedMethodData = JSON.stringify(nativePlatformMethodData);
    }
    // https://www.w3.org/TR/payment-request/#canmakepayment-method
    async canMakePayment() {
        if (this.state !== 'created') {
            throw new DOMException(PaymentsErrorEnum.InvalidStateError);
        }
        return await NativePayments.canMakePayments(this.serializedMethodData);
    }
    // https://www.w3.org/TR/payment-request/#show-method
    show() {
        return new Promise((resolve, reject) => {
            this.acceptPromiseRejecter = reject;
            if (this.state === 'created') {
                this.state = 'interactive';
                // HINT: We need to pass Android environment configuration to native module via details
                const details = isAndroid
                    ? {
                        ...this.details,
                        environment: this.platformMethodData.environment,
                    }
                    : this.details;
                NativePayments.show(this.serializedMethodData, details)
                    .then(jsonDetails => {
                    resolve(this.handleAccept(jsonDetails));
                    return void 0;
                })
                    .catch(reject);
            }
            else {
                reject(new DOMException(PaymentsErrorEnum.InvalidStateError));
            }
        });
    }
    // https://www.w3.org/TR/payment-request/#abort-method
    async abort() {
        if (this.state !== 'interactive') {
            throw new DOMException(PaymentsErrorEnum.InvalidStateError);
        }
        await NativePayments.abort().catch(() => {
            throw new DOMException(PaymentsErrorEnum.InvalidStateError);
        });
        this.state = 'closed';
        this.acceptPromiseRejecter(new DOMException(PaymentsErrorEnum.AbortError));
    }
    handleAccept(details) {
        try {
            return isAndroid
                ? new AndroidPaymentResponse(this.id, PaymentMethodNameEnum.AndroidPay, details)
                : new IosPaymentResponse(this.id, PaymentMethodNameEnum.ApplePay, details);
        }
        catch (e) {
            throw new PaymentsError(`Failed creating AndroidPaymentResponse: ${getErrorMessage(e)}`);
        }
    }
    findPlatformPaymentMethodData() {
        const platformSupportedMethod = isIOS ? PaymentMethodNameEnum.ApplePay : PaymentMethodNameEnum.AndroidPay;
        const platformMethod = this.methodData.find(paymentMethodData => paymentMethodData.supportedMethods === platformSupportedMethod);
        if (!isDefined(platformMethod)) {
            throw new DOMException(PaymentsErrorEnum.NotSupportedError);
        }
        return platformMethod.data;
    }
    // eslint-disable-next-line class-methods-use-this,@typescript-eslint/class-methods-use-this
    getAndroidPaymentMethodData(methodData, details) {
        return {
            ...defaultAndroidPaymentDataRequest,
            merchantInfo: {
                merchantName: details.total.label,
            },
            transactionInfo: {
                ...defaultAndroidTransactionInfo,
                currencyCode: methodData.currencyCode,
                totalPrice: details.total.amount.value,
                totalPriceLabel: details.total.label,
                countryCode: methodData.countryCode,
            },
            allowedPaymentMethods: [
                {
                    ...defaultAndroidPaymentMethod,
                    parameters: {
                        ...defaultAndroidPaymentMethod.parameters,
                        allowedCardNetworks: methodData.supportedNetworks.map(network => network.toUpperCase()),
                        allowedAuthMethods: methodData.allowedAuthMethods ?? defaultAndroidPaymentMethod.parameters.allowedAuthMethods,
                        ...(methodData.requestBilling === true && {
                            billingAddressRequired: true,
                            billingAddressParameters: {
                                format: 'FULL',
                                phoneNumberRequired: true,
                            },
                        }),
                    },
                    ...(isDefined(methodData.gatewayConfig) && {
                        tokenizationSpecification: {
                            parameters: methodData.gatewayConfig,
                            type: AndroidPaymentMethodTokenizationType.PAYMENT_GATEWAY,
                        },
                    }),
                    ...(isDefined(methodData.directConfig) && {
                        tokenizationSpecification: {
                            parameters: methodData.directConfig,
                            type: AndroidPaymentMethodTokenizationType.DIRECT,
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
            [SupportedNetworkEnum.Amex]: IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [SupportedNetworkEnum.Mastercard]: IosPKPaymentNetworksEnum.PKPaymentNetworkMasterCard,
            [SupportedNetworkEnum.Visa]: IosPKPaymentNetworksEnum.PKPaymentNetworkVisa,
            [SupportedNetworkEnum.Discover]: IosPKPaymentNetworksEnum.PKPaymentNetworkDiscover,
            [SupportedNetworkEnum.Bancontact]: IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [SupportedNetworkEnum.CartesBancaires]: IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [SupportedNetworkEnum.ChinaUnionPay]: IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [SupportedNetworkEnum.Dankort]: IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [SupportedNetworkEnum.Eftpos]: IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [SupportedNetworkEnum.Electron]: IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [SupportedNetworkEnum.Elo]: IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [SupportedNetworkEnum.Girocard]: IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [SupportedNetworkEnum.Interac]: IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [SupportedNetworkEnum.Jcb]: IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [SupportedNetworkEnum.Mada]: IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [SupportedNetworkEnum.Maestro]: IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [SupportedNetworkEnum.Mir]: IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [SupportedNetworkEnum.PrivateLabel]: IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
            [SupportedNetworkEnum.Vpay]: IosPKPaymentNetworksEnum.PKPaymentNetworkAmex,
        };
        const defaultMerchantCapabilities = [
            IosPKMerchantCapability.PKMerchantCapability3DS,
            IosPKMerchantCapability.PKMerchantCapabilityDebit,
            IosPKMerchantCapability.PKMerchantCapabilityCredit,
        ];
        return {
            countryCode: methodData.countryCode,
            currencyCode: methodData.currencyCode,
            merchantIdentifier: methodData.merchantIdentifier,
            supportedNetworks: methodData.supportedNetworks.map(network => supportedNetworkMap[network]),
            merchantCapabilities: isNotEmptyArray(methodData.merchantCapabilities)
                ? methodData.merchantCapabilities
                : defaultMerchantCapabilities,
            ...(methodData.requestBilling === true && { requiredBillingContactFields: true }),
            ...(methodData.requestShipping === true && { requiredShippingContactFields: true }),
        };
    }
}
//# sourceMappingURL=payment-request.js.map