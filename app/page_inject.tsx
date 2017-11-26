import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { MessageAction } from './enums';
import * as I from './definitions';
import * as plugins from './plugins/index';
import * as logger from './logger'
import Page from './ui/page/page';

logger.log("injecting script");

function getSitePlugin(): I.SitePlugin {
    // TODO: more sophisticated plugin registration system
    // Perhaps plugin can specify a hostname to match or a static callback?
    let hostname = window.location.hostname;
    if (hostname.includes('furaffinity.net')) {
        return new plugins.FuraffinityPlugin();
    }
    else if (hostname.includes('inkbunny.net')) {
        return new plugins.InkbunnyPlugin();
    }
    else if (hostname.includes('weasyl.com')) {
        return new plugins.WeasylPlugin();
    }
    else if (hostname.includes('sofurry.com')) {
        return new plugins.SofurryPlugin();
    }
    else if (hostname.includes('deviantart.com')) {
        return new plugins.DeviantArtPlugin();
    }
    else if (hostname.includes('furrynetwork.com')) {
        return new plugins.FurryNetworkPlugin();
    }
    else if (hostname.includes('e621.net')) {
        return new plugins.E621Plugin();
    }
    else if (hostname.includes('patreon.com')) {
        return new plugins.PatreonPlugin();
    }
    else if (hostname.includes('hiccears.com')) {
        return new plugins.HiccearsPlugin();
    }
    else if (hostname.includes('aryion.com')) {
        return new plugins.EkasPlugin();
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