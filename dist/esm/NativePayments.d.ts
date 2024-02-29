import type { TurboModule } from 'react-native';
export interface Spec extends TurboModule {
    abort: () => Promise<void>;
    canMakePayments: (methodData: string) => Promise<boolean>;
    complete: (paymentComplete: string) => Promise<void>;
    show: (methodData: string, details: Object) => Promise<string>;
}
declare const _default: Spec;
export default _default;
//# sourceMappingURL=NativePayments.d.ts.map