import { MediaType } from "../enums";

export function getFilenameParts(filename: string) {
    const extIndex = filename.lastIndexOf(".");
    let ext = '';
    if (extIndex !== -1) {
        ext = filename.substring(extIndex + 1);
        filename = filename.substring(0, extIndex);
    }
    return {
        ext,
        filename,
    }
}

let fileTypes: [MediaType, string[]][] = [
    [MediaType.Image, ['jpg', 'jpeg', 'png', 'gif']],
    [MediaType.Text, ['txt', 'rtf', 'doc', 'docx', 'odf', 'pdf']],
    [MediaType.Flash, ['swf']],
    [MediaType.Video, ['mpeg', 'mpg', 'mp4', 'avi', 'divx', 'mkv', 'flv', 'mov', 'wmv']],
    [MediaType.Audio, ['wav', 'mp3', 'm4a', 'flac', 'ogg', 'wma']]
];

// Create extension to type mapping
let extensionToTypeMap = (() => {
    let extMap: { [ext: string]: MediaType } = {};
    fileTypes.forEach(typeTuple => {
        const [type, extensions] = typeTuple;
        extensions.forEach(ext => {
            extMap[ext] = type;
        })
    })
    return extMap;
})();

export function getFileTypeByExt(ext: string): MediaType {
    return extensionToTypeMap[ext] || MediaType.Unknown;
}

const ValidExtensions: { [type: string]: string[] } = {
    [MediaType.Image]: [
        // JPEG
        'jpg', 'jpeg', 'jpe', 'jif', 'jfif', '.jfi',
        // WebP
        'webp',
        // GIF
        'gif',
        // PNG
        'png', 'apng',
    ],
    [MediaType.Video]: [
        // Theora
        'ogv', 'ogg',
        // MP4
        // (yes, some of these are technically audio extensions. MP4 doesn't care.)
        'mp4', 'm4a', 'm4p', 'm4b', 'm4r', 'm4v',
        // WebM
        'webm',
    ],
    [MediaType.Audio]: [
        // PCM/WAV
        'wav', 'aiff', 'au', 'pcm',
        // MP3
        'mp3',
        // MP4
        // (yes, some of these are technically video extensions. MP4 doesn't care.)
        'mp4', 'm4a', 'm4p', 'm4b', 'm4r', 'm4v', '3gp',
        // Ogg
        'ogg', 'ogv', 'oga', 'ogx', 'ogm', 'spx', 'opus',
        // FLAC
        'flac',
    ]
}

export function isValidExtension(extension: string, mediaType: MediaType) {
    extension = extension.toLowerCase();
    const validExts = ValidExtensions[mediaType] || [];
    return validExts.some(e => e === extension);
}

const MimeTypeExtensionMap = {
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/png': 'png',

    'video/ogg': 'ogv',
    'video/mp4': 'm4v',
    'video/webm': 'webm',

    'audio/wav': 'wav',
    'audio/wave': 'wav',
    'audio/vnd.wave': 'wav',
    'audio/x-wav': 'wav',
    'audio/mpeg': 'mp3',
    'audio/mpa': 'mp3',
    'audio/mpa-robust': 'mp3',
    'audio/mp4': 'm4a',
    'audio/aac': 'm4a',
    'audio/aacp': 'm4a',
    'audio/3gpp': 'm4a',
    'audio/3gpp2': 'm4a',
    'audio/mp4a-latm': 'm4a',
    'audio/mpeg4-generic': 'm4a',
    'audio/ogg': 'oga',
    'audio/webm': 'webm',
    'audio/flac': 'flac'
}

export function getExtensionFromMimeType(mimeType: string) {
    return MimeTypeExtensionMap[mimeType];
}