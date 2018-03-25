import * as React from 'react';
import * as I from '../../definitions';
import * as E from '../../enums'
import * as classnames from 'classnames';
import * as logger from '../../logger';
import ActionButton, { ActionButtonProps } from './actionButton';
import SettingsUi from './settingsUi';
import { n } from './common'
import SiteActions from '../siteActions'

const IconGlyph = E.IconGlyph;

interface PageOverlayProps extends I.AppState  {
    siteActions: SiteActions;
    userActions: I.UserActions;
    siteSettings: I.SiteSettings;
    settings: I.Settings;
    onClickFullscreen: () => void;
    onChangeSettings: (settings: I.Settings) => void;
}

interface PageOverlayState {
    showUi: boolean;
    showBalloon: boolean;
}

interface DownloadButtonProps extends ActionButtonProps {
    label: string,
}

const downloadButtonDefaultProps: { [state: number]: DownloadButtonProps } = {};
downloadButtonDefaultProps[E.DownloadState.Done] = downloadButtonDefaultProps[E.DownloadState.Exists] = {
    icon: IconGlyph.Exists,
    label: "Downloaded",
    disabled: true,
}
downloadButtonDefaultProps[E.DownloadState.Error] = {
    icon: IconGlyph.Download,
    label: "Download error",
}
downloadButtonDefaultProps[E.DownloadState.InProgress] = {
    icon: IconGlyph.Download,
    label: "Downloading",
    disabled: true,
}
downloadButtonDefaultProps[E.DownloadState.NotDownloaded] = {
    icon: IconGlyph.Download,
    label: "Download",
}

export default class PageOverlay extends React.Component<PageOverlayProps, PageOverlayState> {
    private _mouseLeaveTimeout: number;

    constructor(props: PageOverlayProps, context) {
        super(props, context);
        this.state = {
            showUi: true,
            showBalloon: false,
        }
    }

    private onClickOpenTabs = () => {
        this.props.userActions.openPageLinksInTabs();
    }

    private onClickDownload = () => {
        this.props.userActions.downloadMedia();
    }

    private onClickOpenFolder = () => {
        this.props.userActions.showDownloadMedia();
    }

    private onClickFullscreen = () => {
        this.props.userActions.toggleFullscreen();
    }

    private onClickOptions = () => {
        this.props.userActions.openOptions();
    }

    private onDismissOptions = () => {
        this.props.userActions.dismissOptions();
    }

    private onSaveOptions = (settings: I.Settings) => {
        this.onDismissOptions();
        this.props.onChangeSettings(settings);
    }

    private onMouseOver = () => {
        if (this._mouseLeaveTimeout) {
            clearTimeout(this._mouseLeaveTimeout);
        }
        this.setState({ showBalloon: true });
    }

    private onMouseOut = () => {
        this._mouseLeaveTimeout = window.setTimeout(() => {
            this.setState({ showBalloon: false });
        }, 1000)
    }

    private onClickClose = () => {
        this.setState({ showUi: false });
    }

    render() {
        let props = this.props;
        let state = this.state;
        let logoUrl = browser.extension.getURL('icon-64.png');
        let showUi = state.showUi && (props.hasMedia || props.hasPageLinks);
        let canDownload = props.downloadState === E.DownloadState.NotDownloaded;
        let showDownloadStatus = props.downloadState === E.DownloadState.InProgress ||
            props.downloadState === E.DownloadState.Done ||
            props.downloadState === E.DownloadState.Error;
        let showBalloon = this.state.showBalloon || showDownloadStatus;

        let mainClassNames = classnames(n('overlay'), !showUi ? n('hide') : null, showDownloadStatus ? n('active') : null)

        let alternateBalloonUi: JSX.Element = null;

        // TODO: move the options into a modal dialog
        if (props.showOptions) {
            showBalloon = true;
            mainClassNames = classnames(mainClassNames, n('active'));
            alternateBalloonUi = (
                <SettingsUi
                    settings={this.props.settings}
                    onDismiss={this.onDismissOptions}
                    onSaveSettings={this.onSaveOptions}
                />
            );
        }

        const downloadButtonProps = downloadButtonDefaultProps[props.downloadState];

        //TODO: fix mini-download button if the downloaded file exists
        return (
            <div
                id={n('ui')}
                className={mainClassNames}
                onMouseEnter={this.onMouseOver}
                onMouseLeave={this.onMouseOut}
            >
                <div id={n('badges')}>
                    <a id={n("close")} className={n("circlebtn")} title="Hide Raccoony"
                        onClick={this.onClickClose}
                    >{IconGlyph.Close}</a>
                    <a id={n('tabs')} className={n("circlebtn")} title="Open all in Tabs (Hotkey: T)"
                        onClick={this.onClickOpenTabs}
                        style={{ visibility: props.hasPageLinks ? 'visible' : 'hidden' }}
                    >{IconGlyph.OpenTabs}</a>
                    <a id={n('dl')} className={n("circlebtn")} title="Download (Hotkey: D)"
                        style={{ visibility: props.hasMedia && canDownload ? 'visible' : 'hidden' }}
                    >{IconGlyph.Download}</a>
                </div>
                <a id={n("imglink")} title="Raccoony - click for page options">
                    <img src={logoUrl} id={n("img")} width={64} height={64} />
                </a>
                <div id={n("ctr")} className={showBalloon ? null : n('inactive')}>
                    {alternateBalloonUi ?
                        (
                            alternateBalloonUi
                        ) : (
                            <div className={n("bubble")}>
                                {props.hasMedia && (
                                    <ActionButton
                                        onClick={this.onClickDownload}
                                        title={downloadButtonProps.disabled ? null : 'Hotkey: D'}
                                        icon={downloadButtonProps.icon}
                                        disabled={downloadButtonProps.disabled}
                                    >
                                        {downloadButtonProps.label}
                                    </ActionButton>
                                )}
                                {props.hasMedia && (props.downloadState === E.DownloadState.Exists || props.downloadState === E.DownloadState.Done) && (
                                    <ActionButton onClick={this.onClickOpenFolder} title="Hotkey: F" icon={IconGlyph.OpenFolder}>
                                        Open folder
                                    </ActionButton >
                                )}
                                {props.canFullscreen && !props.isFullscreen && (
                                    <ActionButton onClick={this.onClickFullscreen} title="Hotkey: O" icon={IconGlyph.Fullscreen}>
                                        Fullscreen
                                    </ActionButton>
                                )}
                                {props.isFullscreen && (
                                    <ActionButton onClick={this.onClickFullscreen} title="Hotkey: O" icon={IconGlyph.ExitFullscreen}>
                                        Exit fullscreen
                                    </ActionButton>
                                )}
                                {props.hasPageLinks && (
                                    <ActionButton onClick={this.onClickOpenTabs} title="Hotkey: T" icon={IconGlyph.OpenTabs}>
                                        Open all in tabs
                                    </ActionButton>
                                )}
                                <ActionButton
                                    onClick={this.onClickOptions}
                                    className={n('nolabel')}
                                    title="Configure Raccoony"
                                    icon={IconGlyph.Config}
                                ></ActionButton>
                            </div >
                        )}
                </div>
            </div>
        );
    }
}
