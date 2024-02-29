"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativePayments = void 0;
const react_native_1 = require("react-native");
const shared_1 = require("@rnw-community/shared");
const LINKING_ERROR = `The package 'react-native-payments' doesn't seem to be linked. Make sure: \n\n${react_native_1.Platform.select({
    ios: "- You have run 'pod install'\n",
    default: '',
})}- You rebuilt the app after installing the package\n- You are not using Expo Go\n`;
// @ts-expect-error Temporary hack
// eslint-disable-next-line no-underscore-dangle
const isTurboModuleEnabled = global.__turboModuleProxy !== null;
// eslint-disable-next-line @typescript-eslint/no-require-imports,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-var-requires,node/no-missing-require
const PaymentsModule = (isTurboModuleEnabled ? require('../../NativePayments').default : react_native_1.NativeModules['Payments']);
const PaymentsProxy = new Proxy({}, {
    get() {
        throw new Error(LINKING_ERROR);
    },
});
exports.NativePayments = (0, shared_1.isDefined)(PaymentsModule) ? PaymentsModule : PaymentsProxy;
//# sourceMappingURL=native-payments.js.map