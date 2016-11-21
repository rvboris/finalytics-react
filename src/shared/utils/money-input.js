export const toPositive = (txt = '') => txt.replace('-', '');

export const toNegative = (txt = '') => `-${toPositive(txt)}`;
