
import axios from 'axios';

import { workspace } from 'vscode';
import { ITranslate, ITranslateOptions } from 'comment-translate-manager';
import { URL } from 'url';

const PREFIXCONFIG = 'deeplxTranslate';

// common punctuation marks indicating the end of a sentence
const PUNCTIONS: Set<string> = new Set<string>(['。', '？', '！', '：', '；', '…', '.', '?', '!', ':', ';']);

const langMaps: Map<string, string> = new Map([
    ['zh-CN', 'ZH'],
    ['zh-TW', 'ZH'],
]);

function convertLang(src: string) {
    if (langMaps.has(src)) {
        return langMaps.get(src);
    }

    return src.toLocaleUpperCase();
}

export function getConfig<T>(key: string): T | undefined {
    let configuration = workspace.getConfiguration(PREFIXCONFIG);
    return configuration.get<T>(key);
}

interface DeepLXTranslateOption {
    apiPath: string;
    accessToken?: string;
    ignorePattern?: RegExp;
}

interface Response {
    id: number;
    code: number;
    data: string;
    alternatives: string[];
}

export class DeepLXTranslate implements ITranslate {
    get maxLen(): number { return 8000; }

    private _defaultOption: DeepLXTranslateOption;
    constructor() {
        this._defaultOption = this.createOption();
        workspace.onDidChangeConfiguration(async eventNames => {
            if (eventNames.affectsConfiguration(PREFIXCONFIG)) {
                this._defaultOption = this.createOption();
            }
        });
    }

    createOption() {
        const defaultOption: DeepLXTranslateOption = {
            apiPath: getConfig<string>('apiPath'),
            accessToken: getConfig<string>('accessToken'),

            // string to RegExp
            ignorePattern: (() => {
                const ignore = getConfig<string>('ignorePattern');
                if (!ignore) {
                    return undefined;
                }

                try {
                    return new RegExp(ignore, 'gi');
                } catch {
                    return undefined;
                }
            })(),
        };

        return defaultOption;
    }

    async translate(content: string, { to = 'auto' }: ITranslateOptions) {
        const apiPath = this._defaultOption.apiPath;
        if (!apiPath) {
            throw new Error('apiPath is not configured!');
        }

        let valid = true;
        try {
            const url = new URL(apiPath);
            valid = url ? url.protocol === 'http:' || url.protocol === 'https:' : false;
        } catch { valid = false; }
        if (!valid) {
            throw new Error('apiPath is not a valid URL!');
        }

        content = !content ? '' : content.trim();
        const ignorePattern = this._defaultOption.ignorePattern;
        const charsBuf = [];
        let index = 0, n = content.length;

        while (index < n) {
            let c = content[index];
            // remove the leading characters if match ignorePattern
            if (index === 0 || c === '\n') {
                while (ignorePattern && index < n && ignorePattern.test(content[index])) {
                    c = '';
                    index++;
                }

                if (index >= n) { break; }

                c = content[index];
                if (c === '\n') {
                    // remove unnecessary \n at the beginning or end of the line
                    if (index === 0 || (index > 0 && content[index - 1] === "-")
                        || (index < n - 1 && content[index - 1] === "-")) { c = ''; }
                    else if ((ignorePattern && index < n - 1 && ignorePattern.test(content[index + 1]))
                        || !PUNCTIONS.has(content[index - 1])) { c = ' '; }
                }
            }

            if (c !== '') { charsBuf.push(c); }
            index++;
        }

        const text = charsBuf.join('').trim();
        if (!text) { return ''; }

        const headers = {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Accept': 'application/json',

            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Content-Type': 'application/json'
        };
        if (this._defaultOption.accessToken) {
            headers['Authorization'] = `Bearer ${this._defaultOption.accessToken.trim()}`;
        }

        const data = {
            text: text,

            // eslint-disable-next-line @typescript-eslint/naming-convention
            'source_lang': 'auto',

            // eslint-disable-next-line @typescript-eslint/naming-convention
            'target_lang': convertLang(to),
        };

        let res = await axios.post<Response>(apiPath, data, { headers });
        return res.data.data;
    }

    link(content: string, { to = 'auto' }: ITranslateOptions) {
        let str = `https://www.deepl.com/translator#auto/${convertLang(to)}/${encodeURIComponent(content)}`;
        return `[DeepLX](${str})`;
    }

    isSupported() { return true; }
}





