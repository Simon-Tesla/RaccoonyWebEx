import * as I from '../../definitions';

export function initializeHotkeys(handler: I.PageActions) {
    let handlerFn = (ev: KeyboardEvent) => {
        if (!(ev.altKey || ev.ctrlKey || ev.metaKey)) {
            let el = document.activeElement;
            // if in textfield, do nothing
            if (el && (
                el.tagName.toLowerCase() == 'input' ||
                el.tagName.toLowerCase() == 'textarea' ||
                el.closest('[contenteditable=true]'))) {
                return;
            }

            switch (ev.key) {
                case 't':
                    handler.openPageLinksInTabs();
                    break;
                case 'd':
                    handler.downloadMedia();
                    break;
                case 'f':
                    handler.showDownloadMedia();
                    break;
                case 'o':
                    handler.toggleFullscreen();
                    break;
            }
        }
    }

    // Add listener
    document.addEventListener('keyup', handlerFn);

    // Return disposer
    return () => {
        document.removeEventListener('keyup', handlerFn);
    }
}
