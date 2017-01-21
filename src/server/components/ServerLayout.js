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

        {assets.css.map(({ path, key }) => <link key={key} rel="stylesheet" href={path} />)}

        <script dangerouslySetInnerHTML={{ __html: inlineScript.join(';') }} />
      </head>

      <body>
        <div dangerouslySetInnerHTML={{ __html: body }} />

        {assets.javascript.map(({ path, key }) => <script key={key} src={path} />)}
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
