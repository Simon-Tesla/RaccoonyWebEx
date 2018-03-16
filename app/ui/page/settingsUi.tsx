import * as React from 'react';
import * as classnames from 'classnames';
import * as I from '../../definitions';
import * as E from '../../enums'
import { n } from './common'
import ActionButton from './actionButton'
import SiteSettingsUi from '../siteSettingsUi';
import { Fragment } from 'react';


interface SettingsUiProps {
    settingsProvider: () => Promise<I.Settings>;
    onSaveSettings: (settings: I.Settings) => void
    onDismiss: () => void;
}

interface SettingsUiState {
    ready: boolean;
    settings: I.SiteSettings;
    defaultSettings: I.SiteSettings;
}

export default class SettingsUi extends React.Component<SettingsUiProps, SettingsUiState> {
    constructor(props: SettingsUiProps, context) {
        super(props, context);
        this.state = {
            ready: false,
            settings: null,
            defaultSettings: null,
        }
        this.props.settingsProvider().then((settings) => {
            this.setState({
                ready: true,
                settings: settings.currentSettings,
                defaultSettings: settings.defaultSettings
            });
        })
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
                {this.state.ready && (
                    <Fragment>
                        <SiteSettingsUi
                            defaultSettings={this.state.defaultSettings}
                            settings={this.state.settings}
                            onUpdateSettings={this.onUpdateSettings}
                        />
                        <div>
                            <ActionButton onClick={this.onSave}> Save changes</ActionButton>
                            <ActionButton className={n('cancel')} onClick={this.props.onDismiss}> Cancel</ActionButton>
                        </div>
                    </Fragment>
                )}
            </div>
        );
    }
}
