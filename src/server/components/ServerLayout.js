import React from 'react';

export default function ServerLayout({ initialState, body, assets, locale, title, description }) {
  delete initialState.locale;

  const inlineScript = [`window.INITIAL_STATE = ${JSON.stringify(initialState)}`];

  return (
    <html lang={locale}>
      <head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta charSet="utf-8" />
        <link rel="icon" type="image/ico" href="/favicon.ico" />

        {assets.css.map((href, idx) => <link key={idx} rel="stylesheet" href={href} />)}

        <script dangerouslySetInnerHTML={{ __html: inlineScript.join(';') }} />
      </head>

      <body>
        <div dangerouslySetInnerHTML={{ __html: body }} />

        {assets.javascript.map((src, idx) => <script key={idx} src={src} />)}
      </body>
    </html>
  );
}

ServerLayout.propTypes = {
  initialState: React.PropTypes.object.isRequired,
  body: React.PropTypes.string.isRequired,
  assets: React.PropTypes.object.isRequired,
  locale: React.PropTypes.string.isRequired,
  title: React.PropTypes.string.isRequired,
  description: React.PropTypes.string.isRequired,
};
