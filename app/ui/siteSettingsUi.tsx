import * as React from 'react';
import * as I from '../definitions';
import * as E from '../enums'
import { n } from './page/common'


interface SettingsUiProps {
    settings: I.SiteSettings;
    defaultSettings: I.SiteSettings;
    onUpdateSettings: (settings: I.SiteSettings) => void
    showDefaultChecks: boolean; 
}

export default class SiteSettingsUi extends React.PureComponent<SettingsUiProps> {
    setDefault = <K extends keyof I.SiteSettings>(key: K, useDefault: boolean) => {
        let newSetting: I.SiteSettings[K] = null;
        if (!useDefault) {
            // Copy the default value over to the settings object
            if (newSetting && typeof newSetting === 'object' || typeof newSetting === 'function') {
                throw new Error('reference types not supported.')
            }
            newSetting = this.props.defaultSettings[key];
        }

        this.setSetting(key, newSetting);
    }

    setSetting = <K extends keyof I.SiteSettings>(key: K, value: I.SiteSettings[K]) => {
        const settings = Object.assign({}, this.props.settings, { [key]: value });
        if (value == null) {
            // If a setting is unset, delete it.
            delete settings[key];
        }
        this.props.onUpdateSettings(settings);
    }

    getSettingOrDefault = <K extends keyof I.SiteSettings>(key: K): I.SiteSettings[K] => {
        const { settings, defaultSettings } = this.props;
        return settings[key] == null ? defaultSettings[key] : settings[key];
    }

    isDefault = <K extends keyof I.SiteSettings>(key: K): boolean => {
        return this.props.settings[key] == null;
    }

    isEnabled = <K extends keyof I.SiteSettings>(key: K): boolean => {
        return this.props.showDefaultChecks ? !this.isDefault(key) : true;
    }

    setDefaultForTabOrder = (useDefault: boolean) => {
        // Strange things happen if you try to set these individually, so we set them all at once.
        const settings = Object.assign({}, this.props.settings);
        if (useDefault) {
            settings.tabLoadSortBy = E.TabLoadOrder.Date;
            settings.tabLoadSortAsc = true;
        }
        else {
            delete settings.tabLoadSortBy;
            delete settings.tabLoadSortAsc;
        }
        this.props.onUpdateSettings(settings);
    }

    render() {
        if (!this.props.settings) {
            return null;
        }

        const getRowProps = <K extends keyof I.SiteSettings>(key: K, label: string): SettingsRowProps => {
            return {
                label: label,
                isDefault: this.isDefault(key),
                onDefaultChanged: (val) => this.setDefault(key, val),
                showDefaultCheck: this.props.showDefaultChecks,
            }
        }

        const getSwitchProps = <K extends keyof I.SiteSettings>(key: K): SwitchProps => {
            return {
                value: this.getSettingOrDefault(key) as boolean,
                onChanged: (val) => this.setSetting(key, val as any),
                enabled: this.isEnabled(key)
            }
        }

        return (
            <div className={n('settings')}>
                <table style={{ width: '100%'}}>
                    <thead>
                        <tr>
                            <th>Setting</th>
                            {this.props.showDefaultChecks && (<th>Global?</th>)}
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <SettingsRow {...getRowProps('hotkeysEnabled', "Hotkeys enabled") }>
                            <Switch {...getSwitchProps('hotkeysEnabled') } />
                        </SettingsRow>
                        <SettingsRow {...getRowProps('autoFullscreen', "Auto fullscreen enabled") }>
                            <Switch {...getSwitchProps('autoFullscreen') } />
                        </SettingsRow>
                        <SettingsRow {...getRowProps('fullscreenScrollGestureEnabled', "Fullscreen scroll gesture enabled") }>
                            <Switch  {...getSwitchProps('fullscreenScrollGestureEnabled') } />
                        </SettingsRow>
                        <SettingsRow {...getRowProps('tabLoadDelay', "Delay between tab loads") }>
                            <TabDelay
                                value={this.getSettingOrDefault('tabLoadDelay')}
                                onChanged={(val) => this.setSetting('tabLoadDelay', val)}
                                enabled={this.isEnabled('tabLoadDelay')}
                            />
                        </SettingsRow>
                        <SettingsRow
                            {...getRowProps('tabLoadSortBy', "Tab loading order") }
                            onDefaultChanged={this.setDefaultForTabOrder}
                        >
                            <LoadOrder
                                order={this.getSettingOrDefault('tabLoadSortBy')}
                                isReversed={!this.getSettingOrDefault('tabLoadSortAsc')}
                                onChangeOrder={order => this.setSetting('tabLoadSortBy', order)}
                                onChangeReversed={reversed => this.setSetting('tabLoadSortAsc', !reversed)}
                                enabled={this.isEnabled('tabLoadSortBy')}
                            />
                        </SettingsRow>
                        <SettingsRow {...getRowProps('tabLoadType', "Open one tab at a time [experimental]")}>
                            <Switch
                                value={this.getSettingOrDefault('tabLoadType') === E.TabLoadType.Timer}
                                onChanged={(val) => this.setSetting('tabLoadType', val ? E.TabLoadType.Timer : E.TabLoadType.Placeholder)}
                                enabled={this.isEnabled('tabLoadType')}
                            />
                        </SettingsRow>
                        <SettingsRow  {...getRowProps('downloadPath', "Download path") }>
                            <DownloadPath
                                value={this.getSettingOrDefault('downloadPath')}
                                onChanged={(value) => this.setSetting('downloadPath', value)}
                                enabled={this.isEnabled('downloadPath')}
                            />
                        </SettingsRow>
                        <SettingsRow  {...getRowProps('contextDownloadPath', "Right-click menu download path")}>
                            <DownloadPath
                                value={this.getSettingOrDefault('contextDownloadPath')}
                                onChanged={(value) => this.setSetting('contextDownloadPath', value)}
                                enabled={this.isEnabled('contextDownloadPath')}
                            />
                        </SettingsRow>
                        <SettingsRow  {...getRowProps('writeMetadata', "Save metadata file") }>
                            <Switch {...getSwitchProps('writeMetadata') } />
                        </SettingsRow>
                        <SettingsRow {...getRowProps('autoDownload', "Automatically download opened submissions") }>
                            <Switch {...getSwitchProps('autoDownload') } />
                        </SettingsRow>
                    </tbody>
                </table>
            </div>
        );
    }
}


interface SettingsRowProps {
    label: string;
    isDefault: boolean;
    onDefaultChanged: (value: boolean) => void;
    showDefaultCheck: boolean;
}

class SettingsRow extends React.PureComponent<SettingsRowProps> {
    onDefaultChanged = () => {
        this.props.onDefaultChanged(!this.props.isDefault);
    }

    onClearDefault = () => {
        if (this.props.isDefault) {
            this.props.onDefaultChanged(false);
        }
    }

    render() {
        const props = this.props;
        return (
            <tr>
                <td>{props.label}</td>
                {this.props.showDefaultCheck && (
                    <td className={n('defaultCheck')} onClick={this.onDefaultChanged}>
                        <input type="checkbox"
                            checked={props.isDefault}
                        />
                    </td>
                )}
                <td style={{position: 'relative'}}>
                    {props.children}
                    {this.props.showDefaultCheck && this.props.isDefault && (
                        <div
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                            className={n('defaultButtonOverlay')}
                            onClick={this.onClearDefault}></div>
                    )}
                </td>
            </tr>
        );
    }
};


interface DownloadPathProps {
    value: string;
    onChanged: (value: string) => void;
    enabled: boolean;
}

interface DownloadPathState {
    helpVisible: boolean;
}

const placeholderList: [string, string][] = [
    ["siteName", "the name of the website the submission is from"],
    ["submissionId", "the ID of the submission; site-dependent"],
    ["author", "the author/creator/artist of the submission"],
    ["filename", "the filename (without extension) of the submission; may be generated"],
    ["filenameExt", "the filename (including extension) of the submission; may be generated"],
    ["siteFilename", "the original filename if available (may or may not include extension), or {filenameExt} if not"],
    ["siteFilenameExt", "the original filename, always including extension, if available, or {filenameExt} if not"],
    ["extension", "the file extension (e.g. jpg, png)"],
    ["type", "the type of file; can be one of 'image', 'text', 'flash', 'video', 'audio' or 'unknown'"],
    ["title", "the title of the submission, if available"],
    ["domain", "the domain name, e.g. 'example.com'"],
    ["isoDate", "the current date in YYYY-MM-DD format"],
    ["isoTime", "the current time in HH_MM_SS format"],
    ["currentDate", "the current date as a JS object, formattable using the MessageFormat date and time types"]
];

class DownloadPath extends React.Component<DownloadPathProps, DownloadPathState> {
    constructor(props, context) {
        super(props, context);
        this.state = { helpVisible: false };
    }

    toggleHelp = () => {
        this.setState({ helpVisible: !this.state.helpVisible })
    }

    render() {
        const props = this.props;
        const { helpVisible } = this.state;
        return (
            <React.Fragment>
                <textarea
                    value={props.value}
                    onChange={(ev) => props.onChanged(ev.currentTarget.value)}
                    disabled={!props.enabled}
                    spellCheck={false}
                />
                <button onClick={this.toggleHelp}>{helpVisible ? "Hide help" : "Show help"}</button>
                {helpVisible && (
                    <div>
                        Allowed placeholders:
                        <ul>
                            {placeholderList.map(([placeholder, description]) => (<li key={placeholder}><b>{`{${placeholder}}`}</b>{" - " + description}</li>))}
                        </ul>
                        Format string can use any valid <a href="https://formatjs.io/guides/message-syntax/" target="_blank">ICU MessageFormat</a> syntax.
                    </div>
                )}
            </React.Fragment>
        );
    }
}


interface SwitchProps {
    value: boolean;
    onChanged: (value: boolean) => void;
    enabled?: boolean;
}

class Switch extends React.PureComponent<SwitchProps> {
    onOnClicked = () => {
        this.props.onChanged(true);
    }

    onOffClicked = () => {
        this.props.onChanged(false);
    }

    render() {
        const props = this.props;
        return (
            <React.Fragment>
                <label>
                    <input type="radio"
                        checked={props.value}
                        onClick={this.onOnClicked}
                        disabled={!props.enabled}
                    /> {" On"}
                </label>&nbsp;
                <label>
                    <input type="radio"
                        checked={!props.value}
                        onClick={this.onOffClicked}
                        disabled={!props.enabled}
                    /> {" Off"}
                </label>
            </React.Fragment>
        );
    }
}


interface LoadOrderProps {
    order: E.TabLoadOrder;
    isReversed: boolean;
    onChangeOrder: (order: E.TabLoadOrder) => void;
    onChangeReversed: (isReversed: boolean) => void;
    enabled: boolean;
}

class LoadOrder extends React.PureComponent<LoadOrderProps> {
    onChangeOrder = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        let order = ev.currentTarget.value as E.TabLoadOrder;
        this.props.onChangeOrder(order);
    }

    onChangeReversed = () => {
        this.props.onChangeReversed(!this.props.isReversed);
    }

    render() {
        const props = this.props;
        const order = props.order;
        return (
            <React.Fragment>
                <select onChange={this.onChangeOrder} disabled={!props.enabled} value={order}>
                    <option value={E.TabLoadOrder.Date}> Date or submission ID order</option>
                    <option value={E.TabLoadOrder.Page}> Order on page</option>
                </select>
                <label><input type="checkbox"
                    checked={props.isReversed}
                    onClick={this.onChangeReversed}
                    disabled={!props.enabled}
                /> Reversed</label>
            </React.Fragment>
        );
    }
}


interface TabDelayProps {
    value: number,
    onChanged: (value: number) => void;
    onError?: (error: string) => void;
    enabled: boolean;
}

interface TabDelayState {
    value: string;
    error: string;
}

class TabDelay extends React.Component<TabDelayProps, TabDelayState> {
    constructor(props, context) {
        super(props, context)
        this.state = {
            value: `${props.value}`,
            error: ""
        }
    }

    UNSAFE_componentWillReceiveProps(nextProps: TabDelayProps) {
        if (parseInt(this.state.value, 10) !== nextProps.value) {
            this.setState({ value: `${nextProps.value}` });
        }
    }

    onChange = (ev: React.FormEvent<HTMLInputElement>) => {
        const value = ev.currentTarget.value;
        const numVal = parseInt(value, 10);
        let error = '';
        if (isNaN(numVal)) {
            error = "Invalid number";
        }
        else if (numVal < 0) {
            error = "Cannot be less than 0";
        }
        this.setState({ value, error });
        if (error) {
            this.props.onError && this.props.onError(error);
        }
        else {
            this.props.onChanged(numVal);
        }
    }

    render() {
        const props = this.props;
        const state = this.state;
        return (
            <React.Fragment>
                <input type="number"
                    min="0"
                    value={state.value}
                    onChange={this.onChange}
                    disabled={!props.enabled}
                /> {" seconds"}
                {state.error && <div>{state.error}</div>}
            </React.Fragment>
        )
    }
}
