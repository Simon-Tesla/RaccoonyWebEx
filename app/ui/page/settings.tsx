import * as React from 'react';
import * as I from '../../definitions';
import * as E from '../../enums'
import { n } from './common'
import ActionButton from './actionButton'

interface SettingsUiProps {
    settingsProvider: () => Promise<{ defaultSettings: I.SiteSettings; currentSettings: I.SiteSettings; }>;
    onSaveSettings: (settings: { defaultSettings?: I.SiteSettings; currentSettings?: I.SiteSettings; }) => void
    onDismiss: () => void;
}

interface SettingsUiState {
    settings: I.SiteSettings;
    defaultSettings: I.SiteSettings;
}

export default class SettingsUi extends React.Component<SettingsUiProps, SettingsUiState> {
    constructor(props: SettingsUiProps, context) {
        super(props, context);
        this.state = {
            settings: null,
            defaultSettings: null,
        }
        this.props.settingsProvider().then((settings) => {
            this.setState({
                settings: settings.currentSettings,
                defaultSettings: settings.defaultSettings
            });
        })
    }

    updateSettings(settings: I.SiteSettings) {
        settings = Object.assign({}, this.state.settings, settings);
        this.setState({
            settings
        });
    }

    onHotkeysChange = (value: boolean) => {
        this.updateSettings({ hotkeysEnabled: value });
    }

    onAutoFullscreenChange = (value: boolean) => {
        this.updateSettings({ autoFullscreen: value });
    }

    onFullscreenGestureChange = (value: boolean) => {
        this.updateSettings({ fullscreenScrollGestureEnabled: value });
    }

    onSave = () => {
        this.props.onSaveSettings({
            currentSettings: this.state.settings,
            defaultSettings: this.state.defaultSettings
        });
    }

    render() {
        if (!this.state.settings) {
            return null;
        }
        return (
            <div className={n("bubble")}>
                <div>
                    <label>
                        Hotkeys enabled
                        (default: {this.state.defaultSettings.hotkeysEnabled.toString()}):
                        {getTristate(this.state.settings.hotkeysEnabled, this.onHotkeysChange)}
                    </label>
                </div>
                <div>
                    <label>
                        AutoFullscreen enabled
                        (default: {this.state.defaultSettings.autoFullscreen.toString()}):
                        {getTristate(this.state.settings.autoFullscreen, this.onAutoFullscreenChange)}
                    </label>
                </div>
                <div>
                    <label>
                        Fullscreen scroll gesture enabled
                        (default: {this.state.defaultSettings.fullscreenScrollGestureEnabled.toString()}):
                        {getTristate(this.state.settings.fullscreenScrollGestureEnabled, this.onFullscreenGestureChange)}
                    </label>
                </div>
                <div>
                    <ActionButton onClick={this.onSave}> Save changes</ActionButton>
                    <ActionButton onClick={this.props.onDismiss}> Cancel</ActionButton>
                </div>
            </div>
        );
    }
}

function getTristate(value: boolean, onChange: (value: boolean) => void) {
    let onSelectChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        let newVal = ev.currentTarget.value;
        let myVal = newVal === 'true'
            ? true
            : (newVal === 'false' ? false : null);
        onChange(myVal);
    }
    return (
        <select onChange={onSelectChange} >
            <option value="null" selected={value == null}>Default</option>
            <option value="true" selected={value === true}>Yes</option>
            <option value="false" selected={value === false}>No</option>
        </select>
    );
}
