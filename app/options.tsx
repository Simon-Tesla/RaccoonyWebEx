import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as I from './definitions';
import SiteSettingsUi from './ui/siteSettingsUi';
import { CachedSettings, DefaultSiteSettings, saveDefaultSettings, clearDefaultSettings, clearAllSettings } from './settings';
import ActionButton from './ui/page/actionButton';
import { n } from './ui/page/common';

document.addEventListener("DOMContentLoaded", () => {
    let rootElt = document.getElementById('app');
    ReactDOM.render(<OptionsPage />, rootElt);
    console.log("finished options render")
});


interface OptionsPageState {
    ready: boolean;
    defaultSettings: I.SiteSettings;
}

class OptionsPage extends React.Component<{}, OptionsPageState> {
    private settings: CachedSettings;

    constructor(props, context) {
        super(props, context);
        this.state = {
            ready: false,
            defaultSettings: null,
        };

        this.settings = new CachedSettings();
        this.settings.ready.then(this.onSettingsStoreUpdate);
        this.settings.addListener(this.onSettingsStoreUpdate);
    }

    onSettingsStoreUpdate = () => {
        const settings = this.settings.getDefaultSettings();
        this.setState({
            ready: true,
            defaultSettings: settings,
        })
    }

    onUpdateSettings = (settings: I.SiteSettings) => {
        // Optimistically update internal state then fire a call to update the store
        // If it fails, we'll refresh back to the current state.
        this.setState({
            defaultSettings: settings,
        });
        saveDefaultSettings(settings)
            .catch(this.onSettingsStoreUpdate);
    }

    onClickExport = () => {
        //TODO implement
    }

    onClickImport = () => {
        //TODO implement
    }

    onClickResetDefault = () => {
        const result = true //window.confirm("Are you sure you want to reset your default settings? This cannot be undone!");
        if (result) {
            clearDefaultSettings();
        }
    }

    onClickResetAll = () => {
        const result = 'yes'// window.prompt("Are you sure you want to reset all settings? This cannot be undone!\nType 'yes' below to reset your settings");
        if (result === 'yes') {
            clearAllSettings();
        }
    }

    render() {
        if (!this.state.ready) {
            return (<div>Please wait...</div>);
        }

        return (
            <div id={n('ui')}>
                <SiteSettingsUi
                    defaultSettings={DefaultSiteSettings}
                    settings={this.state.defaultSettings || {}}
                    onUpdateSettings={this.onUpdateSettings}
                />
                <ActionButton onClick={this.onClickExport}>
                    Export settings
                </ActionButton>
                <ActionButton onClick={this.onClickImport}>
                    Import settings
                </ActionButton>
                <ActionButton onClick={this.onClickResetDefault}>
                    Reset default settings
                </ActionButton>
                <ActionButton onClick={this.onClickResetAll}>
                    Reset all settings
                </ActionButton>
                <pre style={{ height: '200px', overflowY: 'scroll' }}>
                    {JSON.stringify(this.state.defaultSettings, null, 2)}
                    {JSON.stringify(this.settings.settings, null, 2)}
                </pre>
            </div>
        );
    }
}