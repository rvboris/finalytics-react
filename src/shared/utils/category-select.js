import React from 'react';
import classnames from 'classnames';

const indent = (node, rootLevel = false, spacer = '&#160;', rate = 3) => {
  const repeatCount = node.getPath().length - (1 + Number(!rootLevel));
  return `${repeatCount ? spacer.repeat(repeatCount * rate) : ''}${node.model.name}`;
};

export const virtualizedOptionRenderer = (rootLevel = false) => {
  const option = ({ focusedOption, focusOption, key, option, selectValue, style }) => {
    const className = ['VirtualizedSelectOption'];

    if (option === focusedOption) {
      className.push('VirtualizedSelectFocusedOption');
    }

    if (option.disabled) {
      className.push('VirtualizedSelectDisabledOption');
    }

    const events = option.disabled ? {} : {
      onClick: () => selectValue(option),
      onMouseOver: () => focusOption(option),
    };

    return (
      <div
        className={classnames(...className)}
        key={key}
        style={style}
        {...events}
        dangerouslySetInnerHTML={{ __html: indent(option.node, rootLevel) }}
      />
    );
  };

  option.propTypes = {
    focusedOption: React.PropTypes.object.isRequired,
    focusOption: React.PropTypes.object.isRequired,
    key: React.PropTypes.string.isRequired,
    labelKey: React.PropTypes.string.isRequired,
    option: React.PropTypes.object.isRequired,
    selectValue: React.PropTypes.func.isRequired,
    style: React.PropTypes.string.isRequired,
  };

  return option;
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
