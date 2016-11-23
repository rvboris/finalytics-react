export const toPositive = (txt = '') => txt.replace('-', '');

export const toNegative = (txt = '') => txt ? `-${toPositive(txt)}` : '';
