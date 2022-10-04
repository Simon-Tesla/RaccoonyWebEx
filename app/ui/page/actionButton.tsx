import * as React from 'react';
import * as I from '../../definitions';
import * as classnames from 'classnames';
import { IconGlyph } from '../../enums'
import { n } from './common'

//TODO: move out of /page

export interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: IconGlyph | JSX.Element;
}

export default class ActionButton extends React.Component<ActionButtonProps, {}> {
    render() {
        const { icon, children, ...buttonProps } = this.props;
        let className = classnames(n('action'), this.props.className);
        return (
            <button
                {...buttonProps}
                className={className}
            >
                {icon && (
                    <span>{icon}</span>
                )}
                {children}
            </button >
        );
    }
}