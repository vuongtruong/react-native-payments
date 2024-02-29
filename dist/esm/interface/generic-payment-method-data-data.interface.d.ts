import type { SupportedNetworkEnum } from '../enum/supported-networks.enum';
/**
 * Common PaymentMethod data field shared across platforms
 */
export interface GenericPaymentMethodDataDataInterface {
    countryCode?: string;
    currencyCode: string;
    requestBilling?: boolean;
    requestEmail?: boolean;
    requestShipping?: boolean;
    supportedNetworks: SupportedNetworkEnum[];
}
//# sourceMappingURL=generic-payment-method-data-data.interface.d.ts.map