import * as I from '../../definitions';

export function initializeHotkeys(handler: I.UserActions) {
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
                    return handler.openPageLinksInTabs(ev.shiftKey);
                case 'T':
                    return handler.openPageLinksInTabs(true);
                case 'd':
                    return handler.downloadMedia(ev.shiftKey);
                case 'D':
                    return handler.downloadMedia(true);
                case 'f':
                    return handler.showDownloadMedia();
                case 'o':
                    return handler.toggleFullscreen();
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
