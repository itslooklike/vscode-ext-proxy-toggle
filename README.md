# Proxxy

[![Version](https://img.shields.io/visual-studio-marketplace/v/itslooklike.vscode-ext-proxy-toggle?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=itslooklike.vscode-ext-proxy-toggle)

Simple Proxy for VSCode

![Proxxy Extension](images/example-1.webp)

## Features

- 🔌 **One-click proxy toggle** - Click the status bar icon to enable/disable proxy
- 🎨 **Visual indicator** - Red color when proxy is active
- ⚙️ **Proxy settings tab** - Save multiple addresses, select the active one, delete unused
- 🔄 **Auto-cleanup** - Proxy settings are removed when extension is disabled

## Usage example with ssh

```sh
# run ssh with open port
ssh -D 1080 user@111.222.33.44

# open Proxxy settings and add url `socks5://127.0.0.1:1080`
```

## How to use

1. Click the `🔌 Proxxy` icon in the status bar (bottom-right)
2. If it's your first time, the settings tab opens — add a proxy URL (e.g., `socks5://127.0.0.1:1080`)
3. Click the icon again to enable proxy (turns red when active)
4. Click again to disable proxy

## Configuration

Manage addresses via the settings tab (`Proxxy: Settings`), or in VSCode settings:

- `Proxxy: Custom Url` — currently selected proxy URL
- `Proxxy: Saved Urls` — list of saved proxy URLs

## Commands

- `Proxxy: Toggle` - Toggle proxy on/off
- `Proxxy: Settings` - Open settings tab to manage proxy addresses
