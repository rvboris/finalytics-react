import acceptLanguage from 'accept-language';

import config from '../../shared/config';

const languagesBCP47Map = {
  'ru-RU': 'ru',
  'en-US': 'en',
};

acceptLanguage.languages(Object.keys(languagesBCP47Map));

export default async (ctx, next) => {
  const header = ctx.request.header['accept-language'];

  ctx.locale = config.defaultLocale;

  if (!header) {
    await next();
    return;
  }

  let parsed;

  try {
    parsed = acceptLanguage.get(header);
  } catch (err) {
    ctx.log.error(err);

    await next();
    return;
  }

  ctx.locale = languagesBCP47Map[parsed] || ctx.locale;

  await next();
};
