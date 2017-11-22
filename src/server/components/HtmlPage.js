import PropTypes from 'prop-types';
import React from 'react';

const HtmlPage = ({
  initialState, body, assets, head,
}) => {
  const inlineScript = [`window.INITIAL_STATE = ${JSON.stringify(initialState)};`];

  return (
    <html lang={head.htmlAttributes.toComponent().lang}>
      <head>
        {head.title.toComponent()}
        {head.meta.toComponent()}
        {head.link.toComponent()}

        {assets.css.map(({ path, key }) => <link key={key} rel="stylesheet" href={path} />)}

        <script dangerouslySetInnerHTML={{ __html: inlineScript }} />
      </head>

      <body>
        <div dangerouslySetInnerHTML={{ __html: body }} />

        {assets.javascript.reverse().map(({ path, key }) => <script key={key} src={path} />)}
      </body>
    </html>
  );
};

HtmlPage.propTypes = {
  initialState: PropTypes.object.isRequired,
  body: PropTypes.string.isRequired,
  assets: PropTypes.object.isRequired,
  head: PropTypes.object.isRequired,
};

export default HtmlPage;
