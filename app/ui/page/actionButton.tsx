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
        let className = classnames(n('action'), this.props.className);
        return (
            <button
                {...this.props}
                className={className}
            >
                {this.props.icon && (
                    <span>{this.props.icon}</span>
                )}
                {this.props.children}
            </button >
        );
    }
}