import * as React from 'react';
import * as classnames from 'classnames';
import * as I from '../../definitions';
import * as E from '../../enums'
import { n } from './common'
import ActionButton from './actionButton'
import SiteSettingsUi from '../siteSettingsUi';
import { Fragment } from 'react';


interface SettingsUiProps {
    settings: I.Settings;
    onSaveSettings: (settings: I.Settings) => void;
    onDismiss: () => void;
    onShowGlobalSettings: () => void;
}

interface SettingsUiState {
    settings: I.SiteSettings;
    defaultSettings: I.SiteSettings;
}

export default class SettingsUi extends React.Component<SettingsUiProps, SettingsUiState> {
    constructor(props: SettingsUiProps, context) {
        super(props, context);
        this.state = {
            settings: Object.assign({}, this.props.settings.currentSettings),
            defaultSettings: Object.assign({}, this.props.settings.defaultSettings),
        }
    }

    componentWillReceiveProps(nextProps: SettingsUiProps) {
        // Only update the default settings in response to settings changes
        // (since we're in the editor for site settings changes)
        const defaultSettings = Object.assign({}, nextProps.settings.defaultSettings);
        this.setState({ defaultSettings });
    }

    onSave = () => {
        this.props.onSaveSettings({
            currentSettings: this.state.settings,
            defaultSettings: this.state.defaultSettings
        });
    }

    onUpdateSettings = (settings: I.SiteSettings) => {
        this.setState({
            settings
        });
    }
        
    render() {
        const props = this.props;
        const { settings, defaultSettings } = this.state;
        if (!settings) {
            return null;
        }

        return (
            <div className={n('bubble')}>
                <SiteSettingsUi
                    defaultSettings={this.state.defaultSettings}
                    settings={this.state.settings}
                    onUpdateSettings={this.onUpdateSettings}
                    showDefaultChecks={true}
                />
                <div>
                    <ActionButton onClick={this.onSave}> Save changes</ActionButton>
                    <ActionButton className={n('cancel')} onClick={this.props.onShowGlobalSettings}>Global settings...</ActionButton>
                    <ActionButton className={n('cancel')} onClick={this.props.onDismiss}> Cancel</ActionButton>
                </div>
            </div>
        );
    }
}
