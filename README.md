# Proxxy

[![Version](https://img.shields.io/visual-studio-marketplace/v/itslooklike.vscode-ext-proxy-toggle?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=itslooklike.vscode-ext-proxy-toggle)

Simple Proxy for VSCode

![Proxxy Extension](images/example-1.webp)

## Features

- 🔌 **One-click proxy toggle** - Click the status bar icon to enable/disable proxy
- 🎨 **Visual indicator** - Red color when proxy is active
- ⚙️ **Custom proxy URL** - Configure any proxy (socks5, http, https)
- 🔄 **Auto-cleanup** - Proxy settings are removed when extension is disabled

## Usage example with ssh

```sh
# run ssh with open port
ssh -D 1080 user@111.222.33.44

# toggle extension icon, and enter url `socks5://127.0.0.1:1080`
```

## How to use

1. Click the `🔌 Proxxy` icon in the status bar (bottom-right)
2. If it's your first time, enter your proxy URL (e.g., `socks5://127.0.0.1:1080`)
3. The icon will turn red when proxy is active
4. Click again to disable proxy

## Configuration

You can change the proxy URL in VSCode settings:

- Open Settings (`cmd + shift + p` or `ctrl + shift + p`)
- Search for `Proxxy`
- Update `Proxxy: Custom Url`

## Commands

- `Proxxy: Toggle` - Toggle proxy on/off
- `Proxxy: Set Address` - Change proxy URL
