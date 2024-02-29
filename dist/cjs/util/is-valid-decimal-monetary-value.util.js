"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidDecimalMonetaryValue = void 0;
const isDecimal_1 = __importDefault(require("validator/es/lib/isDecimal"));
const shared_1 = require("@rnw-community/shared");
const isValidStringAmount = (stringAmount) => {
    if (stringAmount.endsWith('.')) {
        return false;
    }
    return (0, isDecimal_1.default)(stringAmount);
};
const isValidDecimalMonetaryValue = (amountValue) => {
    if (!(0, shared_1.isNumber)(amountValue) && !(0, shared_1.isString)(amountValue)) {
        return false;
    }
    return (0, shared_1.isNumber)(amountValue) || isValidStringAmount(amountValue);
};
exports.isValidDecimalMonetaryValue = isValidDecimalMonetaryValue;
//# sourceMappingURL=is-valid-decimal-monetary-value.util.js.map