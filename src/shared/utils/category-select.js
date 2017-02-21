import React from 'react';

const indent = (node, rootLevel = false, spacer = '&#160;', rate = 3) => {
  const repeatCount = node.getPath().length - (1 + Number(!rootLevel));
  return `${repeatCount ? spacer.repeat(repeatCount * rate) : ''}${node.model.name}`;
};

export const optionRenderer = (rootLevel = false) => (option) =>
  <span dangerouslySetInnerHTML={{ __html: indent(option.node, rootLevel) }} />;

export const valueRenderer = (rootLevel = false, delimiter = '/') => (option) => {
  const nodePath = option.node.getPath().map(node => node.model.name);

  if (!rootLevel) {
    nodePath.shift();
  }

  return <span>{nodePath.join(delimiter)}</span>;
};
