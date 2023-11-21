
import axios from 'axios';
const querystring = require('querystring');

import { workspace } from 'vscode';
import { ITranslate, ITranslateOptions } from 'comment-translate-manager';
import { URL } from 'url';

const PREFIXCONFIG = 'deeplxTranslate';

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

interface deeplxTranslateOption {
    apiPath: string;
    accessToken?: string;
}

interface Response {
    id: number;
    code: number;
    data: string;
    alternatives: string[];
}

export class deeplxTranslate implements ITranslate {
    get maxLen(): number {
        return 3000;
    }

    private _defaultOption: deeplxTranslateOption;
    constructor() {
        this._defaultOption = this.createOption();
        workspace.onDidChangeConfiguration(async eventNames => {
            if (eventNames.affectsConfiguration(PREFIXCONFIG)) {
                this._defaultOption = this.createOption();
            }
        });
    }

    createOption() {
        const defaultOption: deeplxTranslateOption = {
            apiPath: getConfig<string>('apiPath'),
            accessToken: getConfig<string>('accessToken')
        };

        return defaultOption;
    }

    async translate(content: string, { to = 'auto' }: ITranslateOptions) {
        content = !content ? '' : content.trim();
        if (!content) {
            return '';
        }

        const apiPath = this._defaultOption.apiPath;
        if (!apiPath) {
            throw new Error('apiPath is not configured!');
        }

        let valid = true;
        try {
            const url = new URL(apiPath);
            valid = url ? url.protocol === 'http:' || url.protocol === 'https:' : false
        } catch {
            valid = false;
        }
        if (!valid) {
            throw new Error('apiPath is not a valid URL!');
        }

        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        if (this._defaultOption.accessToken) {
            headers['Authorization'] = `Bearer ${this._defaultOption.accessToken.trim()}`;
        }

        const data = {
            'text': content,
            'source_lang': 'auto',
            'target_lang': convertLang(to),
        };

        let res = await axios.post<Response>(apiPath, data, { headers });
        return res.data.data;
    }

    link(content: string, { to = 'auto' }: ITranslateOptions) {
        let str = `https://www.deepl.com/translator#auto/${convertLang(to)}/${encodeURIComponent(content)}`;
        return `[DeepLX](${str})`;
    }

    isSupported(src: string) {
        return true;
    }
}





