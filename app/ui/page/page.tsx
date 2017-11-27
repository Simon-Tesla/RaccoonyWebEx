import * as React from 'react';
import * as I from '../../definitions';
import * as E from '../../enums'
import * as classnames from 'classnames';
import * as logger from '../../logger';
import PageOverlay from './pageOverlay';
import Lightbox from 'react-image-lightbox';

interface PageProps {
    sitePlugin: I.SitePlugin;
}

interface PageState {
    isFullscreen: boolean;
    lightboxUrl: string;
    settings: I.SiteSettings;
}

export default class Page extends React.Component<PageProps, PageState> {
    constructor(props: PageProps, context) {
        super(props, context);
        this.state = {
            lightboxUrl: '',
            isFullscreen: false,
            settings: null,
        }
        props.sitePlugin.getSettings().then((settings) => {
            this.setState({ settings });
        });
    }

    componentDidUpdate(prevProps: PageProps, prevState: PageState) {
        if (!prevState.settings && this.state.settings) {
            // Updating in response to settings initialization
            if (this.state.settings.autoFullscreen) {
                this.enterFullscreen();
            }
        }
    }

    private enterFullscreen() {
        this.props.sitePlugin.getMedia().then((media) => {
            if (media) {
                this.setState({
                    lightboxUrl: media.url,
                    isFullscreen: true,
                });
            }
        });
    }

    onClickFullscreen = () => {
        if (this.state.isFullscreen) {
            this.setState({ isFullscreen: false });
        }
        else {
            this.enterFullscreen();
        }
    }

    onClickClose = () => {
        this.setState({ isFullscreen: false });
    }

    onChangeSettings = (settings: I.SiteSettings) => {
        this.props.sitePlugin.saveSettings(settings).then(() => {
            this.setState({ settings });
        });
    }

    render() {
        if (!this.state.settings) {
            // Wait for settings to load before showing the UI
            return null;
        }
        return (
            <div>
                <PageOverlay
                    sitePlugin={this.props.sitePlugin}
                    onClickFullscreen={this.onClickFullscreen}
                    inFullscreen={this.state.isFullscreen}
                    siteSettings={this.state.settings}
                    onChangeSettings={this.onChangeSettings}
                />
                {this.state.isFullscreen && (
                    <Lightbox
                        mainSrc={this.state.lightboxUrl}
                        onCloseRequest={this.onClickClose}
                        reactModalStyle={{
                            overlay: { zIndex: 1000000 }
                        }}
                    />
                )}
            </div>
        );
    }
}