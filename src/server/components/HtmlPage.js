import React from 'react';

const HtmlPage = ({ initialState, body, assets, locale, head }) => {
  delete initialState.locale;

  const inlineScript = [`window.INITIAL_STATE = ${JSON.stringify(initialState)};`];

  return (
    <html lang={locale}>
      <head>
        {head.title.toComponent()}
        {head.meta.toComponent()}
        {head.link.toComponent()}

        {assets.css.map((href, idx) => <link key={idx} rel="stylesheet" href={href} />)}

        <script dangerouslySetInnerHTML={{ __html: inlineScript }} />
      </head>

      <body>
        <div dangerouslySetInnerHTML={{ __html: body }} />
        {assets.javascript.map((src, idx) => <script key={idx} src={src} />)}
      </body>
    </html>
  );
};

HtmlPage.propTypes = {
  initialState: React.PropTypes.object.isRequired,
  body: React.PropTypes.string.isRequired,
  assets: React.PropTypes.object.isRequired,
  locale: React.PropTypes.string.isRequired,
  head: React.PropTypes.object.isRequired,
};

export default HtmlPage;
