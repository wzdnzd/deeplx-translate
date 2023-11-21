# deeplx-translate README

The plugin provides a translation source for the ‘comment-translate’ plugin. Itself does not activate, it starts when enabled is selected.

## Features

1. Provide translation capabilities
2. Provides online document link text

## Requirements

Please install '[comment-translate](https://github.com/intellism/vscode-comment-translate)' to use

## Use
1. After installation, call the "Change translation source" command of "Comment Translate"
    ![change](./image/change.png)
2. Check "deeplx translate" to configure the plugin API (and token if required)
    ![select](./image/select.png)
3. Directly use the "Comment Translate" interactive mode to translate the corresponding text

## Extension Settings

This extension contributes the following settings:

* `deeplxTranslate.apiPath`: DeepLX translation service API
* `deeplxTranslate.accessToken`: The token used during translation (if required by the translation service)

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 0.0.1

Initialize the project, the basic capabilities are implemented


### Build
+ Install vsce: `npm install -g vsce`
+ Package: `vsce package`