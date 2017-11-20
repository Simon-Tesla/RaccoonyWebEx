import * as React from 'react';
import * as I from '../../definitions';
import * as E from '../../enums'
import * as classnames from 'classnames';
import * as logger from '../../logger';

function n(name: string) {
    return `ry-${name}`;
}

enum IconGlyph {
    Download = "\u{25BC}",
    Exists = "\u{2713}",
    OpenFolder = "\u{1f4c2}",
    Fullscreen = "\u{1F50E}",
    ExitFullscreen = "\u{2716}",
    OpenTabs = "\u{29C9}",
    Config = "\u{2699}",
    Close = "\u{2716}",
}

enum DownloadState {
    NotDownloaded,
    InProgress,
    Done,
    Exists,
    Error,
}

interface PageOverlayProps {
    sitePlugin: I.SitePlugin;
}

interface PageOverlayState {
    hasMedia: boolean;
    hasPageLinks: boolean;
    downloadState: DownloadState;
    downloadMessage?: string;
    inFullscreen: boolean;
    showBalloon: boolean;
    showUi: boolean;
}

function sendMessage<T>(action: E.MessageAction, data: T) {
    let message: I.MessageRequest<T> = {
        action,
        data,
    }
    logger.log("sending message", message);
    return browser.runtime.sendMessage(message);
}

export default class PageOverlay extends React.Component<PageOverlayProps, PageOverlayState> {
    private _mouseLeaveTimeout: number;

    constructor(props: PageOverlayProps, context) {
        super(props, context);
        this.state = {
            hasMedia: false,
            hasPageLinks: false,
            downloadState: DownloadState.NotDownloaded,
            inFullscreen: false,
            showBalloon: false,
            showUi: true,
        }

        props.sitePlugin.hasMedia().then((hasMedia) => {
            logger.log("hasMedia", hasMedia);
            this.setState({
                hasMedia,
            });
            if (hasMedia) {
                // Check to see if the file has been downloaded
                props.sitePlugin.getMedia().then((media) => {
                    sendMessage(E.MessageAction.CheckDownlod, media).then((isDownloaded: boolean) => {
                        if (isDownloaded) {
                            this.setState({ downloadState: DownloadState.Exists });
                        }
                    });
                });
            }
        })

        props.sitePlugin.hasPageLinkList().then((hasPageLinks) => {
            logger.log("hasPageLinks", hasPageLinks);
            this.setState({
                hasPageLinks,
            });
        });
    }

    onClickOpenTabs = () => {
        this.props.sitePlugin.getPageLinkList().then((list) => {
            sendMessage(E.MessageAction.OpenTabs, list);
        });
    }

    onClickDownload = () => {
        this.setState({ downloadState: DownloadState.InProgress });
        this.props.sitePlugin.getMedia().then((media) => {
            sendMessage(E.MessageAction.Download, media).then((download: I.DownloadResponse) => {
                // TODO: the download promise resolves when the download starts, not when it finishes.
                this.setState({
                    downloadState: download.isError ? DownloadState.Error : DownloadState.Done,
                    downloadMessage: download.message,
                })
                setTimeout(() => this.setState({
                    downloadState: download.isError ? DownloadState.NotDownloaded : DownloadState.Exists,
                    downloadMessage: '',
                }), 5000);
            })
        });
    }

    onClickOpenFolder = () => {
        // TODO: cache the download ID for already downloaded files?
        this.props.sitePlugin.getMedia().then((media) => {
            sendMessage(E.MessageAction.ShowFile, media);
        });
    }

    onClickShowFullscreen = () => {
        // TODO: implement
        alert('Not yet implemented');
    }

    onClickHideFullscreen = () => {
        // TODO: implement
        alert('Not yet implemented');
    }

    onClickOptions = () => {
        // TODO: implement
        alert('Not yet implemented');
    }

    onMouseOver = () => {
        if (this._mouseLeaveTimeout) {
            clearTimeout(this._mouseLeaveTimeout);
        }
        this.setState({ showBalloon: true });
    }

    onMouseOut = () => {
        this._mouseLeaveTimeout = window.setTimeout(() => {
            this.setState({ showBalloon: false });
        }, 1000)
    }

    onClickClose = () => {
        this.setState({ showUi: false })
    }

    render() {
        let logoUrl = browser.extension.getURL('icon-64.png');
        let showUi = this.state.showUi && (this.state.hasMedia || this.state.hasPageLinks);
        let canDownload = this.state.downloadState === DownloadState.NotDownloaded;
        let showDownloadStatus = this.state.downloadState === DownloadState.InProgress ||
            this.state.downloadState === DownloadState.Done ||
            this.state.downloadState === DownloadState.Error;

        let mainClassNames = classnames(!showUi ? n('hide') : null, showDownloadStatus ? n('active') : null)

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
                        style={{ visibility: this.state.hasPageLinks ? 'visible' : 'hidden' }}
                    >{IconGlyph.OpenTabs}</a>
                    <a id={n('dl')} className={n("circlebtn")} title="Download (Hotkey: D)"
                        style={{ visibility: this.state.hasMedia && canDownload ? 'visible' : 'hidden' }}
                    >{IconGlyph.Download}</a>
                </div>
                <a id={n("imglink")} title="Raccoony - click for page options">
                    <img src={logoUrl} id={n("img")} width={64} height={64} />
                </a>
                <div id={n("ctr")} className={this.state.showBalloon ? null : n('inactive')}>
                    {showDownloadStatus ?
                        (
                            <DownloadProgress
                                downloadState={this.state.downloadState}
                                message={this.state.downloadMessage}
                                onClickOpenTabs={this.onClickOpenTabs}
                            />
                        ) : (
                            <div className={n("bubble")}>
                                {this.state.hasMedia && canDownload && (
                                    <ActionButton onClick={this.onClickDownload} title="Hotkey: D" icon={IconGlyph.Download}>
                                        Download
                                    </ActionButton>
                                )}
                                {this.state.hasMedia && this.state.downloadState === DownloadState.Exists && (
                                    <ActionButton icon={IconGlyph.Exists} disabled>
                                        File exists
                                    </ActionButton>
                                )}
                                {this.state.hasMedia && this.state.downloadState === DownloadState.Exists && (
                                    <ActionButton onClick={this.onClickOpenFolder} title="Hotkey: R" icon={IconGlyph.OpenFolder}>
                                        Open folder
                                    </ActionButton >
                                )}
                                {this.state.hasMedia && !this.state.inFullscreen && (
                                    <ActionButton onClick={this.onClickShowFullscreen} title="Hotkey: O" icon={IconGlyph.Fullscreen}>
                                        Fullscreen
                                    </ActionButton>
                                )}
                                {this.state.hasMedia && this.state.inFullscreen && (
                                    <ActionButton onClick={this.onClickHideFullscreen} title="Hotkey: O" icon={IconGlyph.ExitFullscreen}>
                                        Exit fullscreen
                                    </ActionButton>
                                )}
                                {this.state.hasPageLinks && (
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

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: IconGlyph;
}

class ActionButton extends React.Component<ActionButtonProps, {}> {
    render() {
        let className = classnames(n('action'), this.props.className);
        return (
            <button
                {...this.props}
                className={className}
            >
                <span>{this.props.icon}</span>
                {this.props.children}
            </button >
        );
    }
}

interface DownloadProgressProps {
    downloadState: DownloadState;
    message?: string;
    onClickOpenTabs: () => void;
}

class DownloadProgress extends React.Component<DownloadProgressProps, {}> {
    get message() {
        switch (this.props.downloadState) {
            case DownloadState.InProgress:
                return "Downloading...";
            case DownloadState.Done:
                return "Download complete.";
            case DownloadState.Error:
                return "Error downloading: "
        }
    }
    
    render() {
        return (
            <div className={n("bubble")}>
                <div>{this.message + ' ' + this.props.message || ''}</div>
                {this.props.downloadState === DownloadState.InProgress && <progress />}
                {this.props.downloadState === DownloadState.Done && (
                    < ActionButton title="Hotkey: R" icon={IconGlyph.OpenFolder} onClick={this.props.onClickOpenTabs}>
                        Open folder
                    </ActionButton>
                )}
            </div>
        );
    }
}
