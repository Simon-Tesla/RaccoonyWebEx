import SiteActions from "./ui/siteActions";
import { getSitePlugin } from "./plugins";
import * as logger from './logger'
import { initPageListeners } from "./ui/pageListeners";

// Only need to set up the message listeners when handling context menu actions,
// no need to show the overlay UI.
const sitePlugin = getSitePlugin(window.location.hostname);
let actions: SiteActions = null;
if (sitePlugin) {
    actions = new SiteActions(sitePlugin);
}

initPageListeners(actions);