import isDecimal from 'validator/es/lib/isDecimal';
import { isNumber, isString } from '@rnw-community/shared';
const isValidStringAmount = (stringAmount) => {
    if (stringAmount.endsWith('.')) {
        return false;
    }
    return isDecimal(stringAmount);
};
export const isValidDecimalMonetaryValue = (amountValue) => {
    if (!isNumber(amountValue) && !isString(amountValue)) {
        return false;
    }
    return isNumber(amountValue) || isValidStringAmount(amountValue);
};
//# sourceMappingURL=is-valid-decimal-monetary-value.util.js.map