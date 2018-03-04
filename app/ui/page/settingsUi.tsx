import * as React from 'react';
import * as I from '../../definitions';
import * as E from '../../enums'
import { n } from './common'
import ActionButton from './actionButton'

interface SettingsUiProps {
    settingsProvider: () => Promise<I.Settings>;
    onSaveSettings: (settings: I.Settings) => void
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

    onSave = () => {
        this.props.onSaveSettings({
            currentSettings: this.state.settings,
            defaultSettings: this.state.defaultSettings
        });
    }

    setDefault = <K extends keyof I.SiteSettings>(key: K, useDefault: boolean) => {
        let newSetting: I.SiteSettings[K] = null;
        if (!useDefault) {
            // Copy the default value over to the settings object
            if (newSetting && typeof newSetting === 'object' || typeof newSetting === 'function') {
                throw new Error('reference types not supported.')
            }
            newSetting = this.state.defaultSettings[key];
        }

        this.setSetting(key, newSetting);
    }

    setSetting = <K extends keyof I.SiteSettings>(key: K, value: I.SiteSettings[K]) => {
        this.setState((state) => {
            state.settings[key] = value;
            return state;
        }) 
    }

    getSettingOrDefault = <K extends keyof I.SiteSettings>(key: K): I.SiteSettings[K] => {
        const { settings, defaultSettings } = this.state;
        return settings[key] == null ? defaultSettings[key] : settings[key];
    }

    isDefault = <K extends keyof I.SiteSettings>(key: K): boolean => {
        return this.state.settings[key] == null;
    }
        
    render() {
        const props = this.props;
        const { settings, defaultSettings } = this.state;
        if (!settings) {
            return null;
        }

        return (
            <div className={n("bubble")}>
                <table>
                    <thead>
                        <tr>
                            <th>Setting</th>
                            <th>Default?</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <SettingsRow
                            label={"Hotkeys enabled"}
                            isDefault={this.isDefault('hotkeysEnabled')}
                            onDefaultChanged={(val) => this.setDefault('hotkeysEnabled', val)}
                        >
                            <Switch
                                value={this.getSettingOrDefault('hotkeysEnabled')}
                                onChanged={(val) => this.setSetting('hotkeysEnabled', val)}
                                enabled={!this.isDefault('hotkeysEnabled')}
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={"Auto fullscreen enabled"}
                            isDefault={this.isDefault('autoFullscreen')}
                            onDefaultChanged={(val) => this.setDefault('autoFullscreen', val)}
                        >
                            <Switch
                                value={this.getSettingOrDefault('autoFullscreen')}
                                onChanged={(val) => this.setSetting('autoFullscreen', val)}
                                enabled={!this.isDefault('autoFullscreen')}
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={"Fullscreen scroll gesture enabled"}
                            isDefault={this.isDefault('fullscreenScrollGestureEnabled')}
                            onDefaultChanged={(val) => this.setDefault('fullscreenScrollGestureEnabled', val)}
                        >
                            <Switch
                                value={this.getSettingOrDefault('fullscreenScrollGestureEnabled')}
                                onChanged={(val) => this.setSetting('fullscreenScrollGestureEnabled', val)}
                                enabled={!this.isDefault('fullscreenScrollGestureEnabled')}
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={"Delay between tab loads"}
                            isDefault={this.isDefault('tabLoadDelay')}
                            onDefaultChanged={(val) => this.setDefault('tabLoadDelay', val)}
                        >
                            <TabDelay
                                value={this.getSettingOrDefault('tabLoadDelay')}
                                onChanged={(val) => this.setSetting('tabLoadDelay', val)}
                                enabled={!this.isDefault('tabLoadDelay')}
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={"Tab loading order"}
                            isDefault={this.isDefault('tabLoadSortBy')}
                            onDefaultChanged={(val) => {
                                this.setDefault('tabLoadSortBy', val);
                                this.setDefault('tabLoadSortAsc', val);
                            }}
                        >
                            <LoadOrder
                                order={this.getSettingOrDefault('tabLoadSortBy')}
                                isReversed={!this.getSettingOrDefault('tabLoadSortAsc')}
                                onChangeOrder={order => this.setSetting('tabLoadSortBy', order)}
                                onChangeReversed={reversed => this.setSetting('tabLoadSortAsc', !reversed)}
                                enabled={!this.isDefault('tabLoadSortBy')}
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={"Download path"}
                            isDefault={this.isDefault('downloadPath')}
                            onDefaultChanged={(val) => this.setDefault('downloadPath', val)}
                        >
                            <input type="text"
                                value={this.getSettingOrDefault('downloadPath')}
                                onChange={(ev) => this.setSetting('downloadPath', ev.currentTarget.value)}
                                disabled={this.isDefault('downloadPath')}
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={"Save metadata file"}
                            isDefault={this.isDefault('writeMetadata')}
                            onDefaultChanged={(val) => this.setDefault('writeMetadata', val)}
                        >
                            <Switch
                                value={this.getSettingOrDefault('writeMetadata')}
                                onChanged={(val) => this.setSetting('writeMetadata', val)}
                                enabled={!this.isDefault('writeMetadata')}
                            />
                        </SettingsRow>
                    </tbody>
                </table>
                <div>
                    <ActionButton onClick={this.onSave}> Save changes</ActionButton>
                    <ActionButton onClick={this.props.onDismiss}> Cancel</ActionButton>
                </div>
            </div>
        );
    }
}


interface SettingsRowProps {
    label: string;
    isDefault: boolean;
    onDefaultChanged: (value: boolean) => void;
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
                <td onClick={this.onDefaultChanged}>
                    <input type="checkbox"
                        checked={props.isDefault}
                    />
                </td>
                <td onClick={this.onClearDefault} >
                    {props.children}
                </td>
            </tr>
        );
    }
};


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
                <select onChange={this.onChangeOrder} disabled={!props.enabled} >
                    <option value={E.TabLoadOrder.Date} selected={order === E.TabLoadOrder.Date}> Date or submission ID order</option>
                    <option value={E.TabLoadOrder.Page} selected={order === E.TabLoadOrder.Page}> Order on page</option>
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

    componentWillReceiveProps(nextProps: TabDelayProps) {
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
