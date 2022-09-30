import * as React from 'react';
import * as I from '../../definitions';
import * as E from '../../enums'
import * as classnames from 'classnames';
import * as logger from '../../logger';
import ActionButton, { ActionButtonProps } from './actionButton';
import SettingsUi from './settingsUi';
import { n } from './common'
import SiteActions from '../siteActions'
import { IconDownload, IconFolder, IconZoomIn, IconZoomOut, IconTab, IconSettings, IconClose, IconCheck, IconError, IconSpinner, SvgIconProps } from './icons';

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


const DownloadStatusUi: { [state: number]: JSX.Element } = {};
DownloadStatusUi[E.DownloadState.Done] = DownloadStatusUi[E.DownloadState.Exists] =
    <IconCheck title="Downloaded" />
DownloadStatusUi[E.DownloadState.Error] = <IconError title="Download error" />
DownloadStatusUi[E.DownloadState.InProgress] = <IconSpinner title="Downloading" />

export default class PageOverlay extends React.Component<PageOverlayProps, PageOverlayState> {
    private _mouseLeaveTimeout: number;

    constructor(props: PageOverlayProps) {
        super(props);
        this.state = {
            showUi: true,
            showBalloon: false,
        }
    }

    private onClickOpenTabs = (ev: React.MouseEvent) => {
        const override = ev.button === 2; // override on right click
        this.props.userActions.openPageLinksInTabs(override);
        ev.preventDefault();
    }

    private onClickDownload = () => {
        let force = false;
        if (this.props.downloadState === E.DownloadState.Exists)  {
            const force = confirm("Raccoony has already downloaded this. Download again?");
        } else if (this.props.downloadState === E.DownloadState.Error) {
            const force = confirm("Raccoony encountered an error when downloading this previously. Try downloading again?");
        }
        this.props.userActions.downloadMedia(force); 
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
        let logoUrl = browser.extension.getURL('raccoon.svg');
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
                    onShowGlobalSettings={this.props.userActions.showGlobalOptions}
                />
            );
        }

        const downloadStatusUi = DownloadStatusUi[props.downloadState];

        //TODO: fix mini-download button if the downloaded file exists
        return (
            <div
                id={n('ui')}
                className={mainClassNames}
                onMouseEnter={this.onMouseOver}
                onMouseLeave={this.onMouseOut}
                onContextMenu={(ev) => ev.preventDefault()}
            >
                <div id={n('badges')}>
                    <a id={n("close")} className={n("circlebtn")} title="Hide Raccoony"
                        onClick={this.onClickClose}
                    >{IconClose}</a>
                    <a id={n('tabs')} className={n("circlebtn")} title="Open all in Tabs (Hotkey: T)"
                        onMouseUp={this.onClickOpenTabs}
                        style={{ visibility: props.hasPageLinks ? 'visible' : 'hidden' }}
                    >{IconTab}</a>
                    <a id={n('dl')} className={n("circlebtn")} title="Download (Hotkey: D)"
                        style={{ visibility: props.hasMedia && canDownload ? 'visible' : 'hidden' }}
                    >{IconDownload}</a>
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
                                        title={'Hotkey: D'}
                                        icon={downloadStatusUi || IconDownload}
                                        disabled={props.downloadState === E.DownloadState.InProgress}
                                    >
                                        Download
                                    </ActionButton>
                                )}
                                {props.hasMedia && (props.downloadState === E.DownloadState.Exists || props.downloadState === E.DownloadState.Done) && (
                                    <ActionButton onClick={this.onClickOpenFolder} title="Hotkey: F" icon={IconFolder}>
                                        Open folder
                                    </ActionButton >
                                )}
                                {props.canFullscreen && !props.isFullscreen && (
                                    <ActionButton onClick={this.onClickFullscreen} title="Hotkey: O" icon={IconZoomIn}>
                                        Fullscreen
                                    </ActionButton>
                                )}
                                {props.isFullscreen && (
                                    <ActionButton onClick={this.onClickFullscreen} title="Hotkey: O" icon={IconZoomOut}>
                                        Exit fullscreen
                                    </ActionButton>
                                )}
                                {props.hasPageLinks && (
                                    <ActionButton onMouseUp={this.onClickOpenTabs} title="Hotkey: T" icon={IconTab}>
                                        Open all in tabs
                                    </ActionButton>
                                )}
                                <ActionButton
                                    onClick={this.onClickOptions}
                                    className={n('nolabel')}
                                    title="Configure Raccoony"
                                    icon={IconSettings}
                                ></ActionButton>
                            </div >
                        )}
                </div>
            </div>
        );
    }
}
