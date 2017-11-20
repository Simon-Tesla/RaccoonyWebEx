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
}

export default class Page extends React.Component<PageProps, PageState> {
    constructor(props: PageProps, context) {
        super(props, context);
        this.state = {
            lightboxUrl: '',
            isFullscreen: false,
        }
    }

    onClickFullscreen = () => {
        if (this.state.isFullscreen) {
            this.setState({ isFullscreen: false });
        }
        else {
            this.props.sitePlugin.getMedia().then((media) => {
                this.setState({
                    lightboxUrl: media.url,
                    isFullscreen: true,
                });
            });
        }
    }

    onClickClose = () => {
        this.setState({ isFullscreen: false });
    }

    render() {
        return (
            <div>
                <PageOverlay
                    sitePlugin={this.props.sitePlugin}
                    onClickFullscreen={this.onClickFullscreen}
                    inFullscreen={this.state.isFullscreen}
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