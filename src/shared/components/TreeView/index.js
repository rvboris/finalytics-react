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
    if (!this.props.children) {
      return null;
    }

    return (
      <button className={this.props.arrowClassName} onClick={this.handleCollapse}>
        { this.state.collapsed ? <FaAngleDown /> : <FaAngleUp /> }
      </button>
    );
  }

  handleSelect = () => {
    if (this.props.onSelect) {
      this.props.onSelect(this.props.itemId);
    }
  }

  handleCollapse = () => {
    this.setState({ collapsed: !this.state.collapsed });
  }

  render() {
    const { selected, label, children } = this.props;
    const { collapsed } = this.state;

    return (
      <div>
        <div
          className={classnames(
            this.props.itemClassName,
            !children && this.props.itemNoChildrenClassName
          )}
        >
          { this.getCollapseButton() }
          <button
            onClick={this.handleSelect}
            className={classnames(
              this.props.labelClassName,
              selected && this.props.labelSelectedClassName
            )}
          >
            {label}
          </button>
        </div>
        <div className={this.props.chidlrenContainerClassName}>{collapsed ? null : children}</div>
      </div>
    );
  }
}
