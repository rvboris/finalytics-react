import React from 'react';
import styles from './ServerLayout.css';

export default function ServerLayout({ initialState, body, assets, locale, title, description }) {
  const inlineScript = [
    `window.__INITIAL_STATE__ = ${JSON.stringify(initialState)}`,
  ];

  return (
    <html lang={locale} className={styles.html}>
      <head>
        <meta name="description" content={description} />
        <meta charSet="utf-8" />

        <link rel="icon" type="image/ico" href="/favicon.ico" />

        {assets.styles.map((href, idx) => <link key={idx} rel="stylesheet" href={href} />)}

        <title>{title}</title>

        <script dangerouslySetInnerHTML={{ __html: inlineScript.join(';') }}></script>
      </head>

      <body>
        <div dangerouslySetInnerHTML={{ __html: body }} />

        {assets.scripts.map((src, idx) => <script key={idx} src={src} />)}
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
