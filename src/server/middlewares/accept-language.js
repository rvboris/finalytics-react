import acceptLanguage from 'accept-language';
import { isArray, isEmpty, maxBy } from 'lodash';

import { error } from '../../shared/log';
import config from '../../shared/config';

const languages = ['ru', 'en'];

export default async(ctx, next) => {
  const header = ctx.request.header['accept-language'];

  ctx.language = config.defaultLang;

  if (!header) {
    await next();
    return;
  }

  let parsed;

  try {
    parsed = acceptLanguage.parse(header);
  } catch (err) {
    error(err);

    await next();
    return;
  }

  if (isArray(parsed) && !isEmpty(parsed)) {
    const userLanguage = maxBy(parsed, (lang) => lang.quality);
    const selectedLanguage = languages.indexOf(userLanguage.language || ctx.language);

    ctx.language = languages[selectedLanguage];
  }

  await next();
};
