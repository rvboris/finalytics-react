import PropTypes from 'prop-types';
import React from 'react';
import { noop } from 'lodash';
import classnames from 'classnames';
import FaAngleDown from 'react-icons/lib/fa/angle-down';
import FaAngleUp from 'react-icons/lib/fa/angle-up';

export default class TreeView extends React.Component {
  static propTypes = {
    itemId: PropTypes.string.isRequired,
    label: PropTypes.any.isRequired,
    selected: PropTypes.bool.isRequired,
    onSelect: PropTypes.func,
    children: PropTypes.any,
    itemClassName: PropTypes.string,
    itemNoChildrenClassName: PropTypes.string,
    chidlrenContainerClassName: PropTypes.string,
    labelClassName: PropTypes.string,
    labelSelectedClassName: PropTypes.string,
    arrowClassName: PropTypes.string,
  };

  static defaultProps = {
    onSelect: noop,
    children: null,
    itemClassName: null,
    itemNoChildrenClassName: null,
    chidlrenContainerClassName: null,
    labelClassName: null,
    labelSelectedClassName: null,
    arrowClassName: null,
  };

  constructor(...args) {
    super(...args);

    this.state = {
      collapsed: true,
    };
  }

  getCollapseButton = () => {
    const { children, arrowClassName } = this.props;
    const { collapsed } = this.state;

    if (!children) {
      return null;
    }

    return (
      <button type="button" className={arrowClassName} onClick={this.handleCollapse}>
        { collapsed ? <FaAngleDown /> : <FaAngleUp /> }
      </button>
    );
  }

  handleSelect = () => {
    const { onSelect, itemId } = this.props;

    if (onSelect) {
      onSelect(itemId);
    }
  }

  handleCollapse = () => {
    this.setState({ collapsed: !this.state.collapsed });
  }

  render() {
    const {
      selected,
      label,
      children,
      itemClassName,
      itemNoChildrenClassName,
      labelClassName,
      labelSelectedClassName,
      chidlrenContainerClassName,
    } = this.props;

    const { collapsed } = this.state;

    return (
      <div>
        <div className={classnames(itemClassName, !children && itemNoChildrenClassName)}>
          { this.getCollapseButton() }

          <button
            type="button"
            onClick={this.handleSelect}
            className={classnames(labelClassName, selected && labelSelectedClassName)}
          >
            {label}
          </button>
        </div>

        <div className={chidlrenContainerClassName}>{collapsed ? null : children}</div>
      </div>
    );
  }
}
