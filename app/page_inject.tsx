import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { MessageAction } from './enums';
import * as I from './definitions';
import * as plugins from './plugins/index';
import * as logger from './logger'
import Page from './ui/page/page';

logger.log("injecting script");

function getSitePlugin(): I.SitePlugin {
    let hostname = window.location.hostname;
    if (hostname.includes('furaffinity.net')) {
        return new plugins.FuraffinityPlugin();
    }
    else if (hostname.includes('inkbunny.net')) {
        return new plugins.InkbunnyPlugin();
    }
}


document.addEventListener("DOMContentLoaded", () => {
    let plugin = getSitePlugin();
    if (!plugin) {
        logger.log("no plugin found for this site");
        return;
    }
    logger.log("loading plugin", plugin.siteName);

    let rootElt = document.createElement('div');
    rootElt.id = "raccoonyExtensionRoot";
    document.body.appendChild(rootElt);

    ReactDOM.render(<Page sitePlugin={plugin} />, rootElt);
})