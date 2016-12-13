import React from 'react';
import classnames from 'classnames';
import FaAngleDown from 'react-icons/lib/fa/angle-down';
import FaAngleUp from 'react-icons/lib/fa/angle-up';

export default class TreeView extends React.Component {
  static propTypes = {
    itemId: React.PropTypes.string.isRequired,
    label: React.PropTypes.any.isRequired,
    selected: React.PropTypes.bool.isRequired,
    onSelect: React.PropTypes.func,
    children: React.PropTypes.any,
    itemClassName: React.PropTypes.string,
    itemNoChildrenClassName: React.PropTypes.string,
    chidlrenContainerClassName: React.PropTypes.string,
    labelClassName: React.PropTypes.string,
    labelSelectedClassName: React.PropTypes.string,
    arrowClassName: React.PropTypes.string,
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
