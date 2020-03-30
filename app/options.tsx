import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as I from './definitions';
import SiteSettingsUi from './ui/siteSettingsUi';
import { CachedSettings, DefaultSiteSettings, saveDefaultSettings, clearDefaultSettings, clearAllSettings, saveAllSettings, saveExtensionSettings } from './settings';
import ActionButton from './ui/page/actionButton';
import { n } from './ui/page/common';
import { MouseEvent } from 'react';

document.addEventListener("DOMContentLoaded", () => {
    let rootElt = document.getElementById('app');
    ReactDOM.render(<OptionsPage />, rootElt);
    console.log("finished options render")
});


interface OptionsPageState {
    ready: boolean;
    extensionSettings: I.ExtensionSettings;
    defaultSettings: I.SiteSettings;
    showReset: boolean;
}

class OptionsPage extends React.Component<{}, OptionsPageState> {
    private settings: CachedSettings;
    private fileInput: HTMLInputElement;

    constructor(props, context) {
        super(props, context);
        this.state = {
            ready: false,
            extensionSettings: null,
            defaultSettings: null,
            showReset: false
        };

        this.settings = new CachedSettings();
        this.settings.ready.then(this.onSettingsStoreUpdate);
        this.settings.addListener(this.onSettingsStoreUpdate);
    }

    onSettingsStoreUpdate = () => {
        const defaultSettings = this.settings.getDefaultSettings();
        const extensionSettings = this.settings.getExtensionSettings();
        this.setState({
            ready: true,
            extensionSettings,
            defaultSettings,
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

    onClickShowContextMenu = (event: React.MouseEvent<HTMLInputElement>) => {
        const value = event.currentTarget.checked;
        this.setState(state => {
            state.extensionSettings.showContextMenu = value;
            saveExtensionSettings(state.extensionSettings)
                .catch(this.onSettingsStoreUpdate);
            return state;
        });
    }

    onClickExport = () => {
        // Create a JSON file of the settings and download it
        const settingsJson = JSON.stringify(this.settings.settings, null, 2);
        const file = new Blob([settingsJson], { type: 'text/plain', endings: 'native' });
        const url = URL.createObjectURL(file);
        browser.downloads.download({
            url,
            filename: 'raccoony-settings.json',
            saveAs: true,
        })
    }

    onClickImport = () => {
        this.fileInput.click();
    }

    onImportFile = (event: React.FormEvent<HTMLInputElement>) => {
        if (event && event.currentTarget && event.currentTarget.files) {
            let reader = new FileReader();
            reader.readAsText(event.currentTarget.files[0]);
            reader.onload = () => {
                const importedSettings: I.AllSettings = JSON.parse(reader.result as string);
                console.log("Importing settings:", importedSettings);
                clearAllSettings()
                    .then(() => saveAllSettings(importedSettings));
                this.fileInput.value = null;
            }
        }
    }

    onClickReset = () => {
        this.setState({ showReset: true })
    }

    onClickResetDefault = () => {
        clearDefaultSettings();
        this.setState({ showReset: false })
    }

    onClickResetAll = () => {
        clearAllSettings();
        this.setState({ showReset: false })
    }

    onClickResetCancel = () => {
        this.setState({ showReset: false })
    }

    render() {
        if (!this.state.ready) {
            return (<div>Please wait...</div>);
        }

        return (
            <div id={n('ui')}>
                <fieldset>
                    <legend>Global settings</legend>
                    <div>These settings apply to all sites unless you have specified any custom site-specific settings.</div>
                    <SiteSettingsUi
                        defaultSettings={DefaultSiteSettings}
                        settings={this.state.defaultSettings || {}}
                        onUpdateSettings={this.onUpdateSettings}
                        showDefaultChecks={false}
                    />
                </fieldset>
                <fieldset>
                    <legend>Advanced</legend>
                    <div>
                        <div>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={this.state.extensionSettings.showContextMenu}
                                    onClick={this.onClickShowContextMenu}
                                />
                                {" Show Raccoony in right-click menu"}
                            </label>
                        </div>

                        <ActionButton onClick={this.onClickImport}>
                            Import settings
                        </ActionButton>
                        <ActionButton onClick={this.onClickExport}>
                            Export settings
                        </ActionButton>
                        <ActionButton onClick={this.onClickReset} disabled={this.state.showReset}>
                            Reset settings...
                        </ActionButton>
                    </div>
                    <div>
                        {this.state.showReset && (
                            <div>
                                <p>Are you sure you want to reset your settings? This cannot be undone!</p>
                                <ActionButton onClick={this.onClickResetDefault}>
                                    Reset global settings
                                </ActionButton>
                                <ActionButton onClick={this.onClickResetAll}>
                                    Reset all settings
                                </ActionButton>
                                <ActionButton className={n('cancel')} onClick={this.onClickResetCancel}>
                                    Cancel
                                </ActionButton>
                            </div>
                        )}
                    </div>
                    <pre style={{ height: '200px', overflowY: 'scroll', display: 'none' }}>
                        {JSON.stringify(this.settings.settings, null, 2)}
                    </pre>
                </fieldset>
                <input type="file"
                    style={{ display: 'none' }}
                    accept="*.json"
                    multiple={false}
                    ref={r => this.fileInput = r}
                    onChange={this.onImportFile}
                />
            </div>
        );
    }
}