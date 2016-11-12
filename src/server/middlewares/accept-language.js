import acceptLanguage from 'accept-language';

import config from '../../shared/config';

const languagesBCP47Map = {
  'ru-RU': 'ru',
  'en-US': 'en',
};

acceptLanguage.languages(Object.keys(languagesBCP47Map));

export default async (ctx, next) => {
  const header = ctx.request.header['accept-language'];

  ctx.language = config.defaultLang;

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

  ctx.language = languagesBCP47Map[parsed] || ctx.language;

  await next();
};
