import * as vscode from 'vscode'
import { APP_NAME, ACCENT_COLOR, CONFIG_KEYS, EXT_ID } from './constants'

type PanelMessage =
  | { type: 'add'; url: string }
  | { type: 'select'; url: string }
  | { type: 'delete'; url: string }
  | { type: 'ready' }

export class SettingsPanel {
  public static currentPanel: SettingsPanel | undefined
  private static readonly viewType = `${EXT_ID}.settings`

  private readonly panel: vscode.WebviewPanel
  private readonly disposables: vscode.Disposable[] = []

  private constructor(panel: vscode.WebviewPanel) {
    this.panel = panel

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables)

    this.panel.webview.onDidReceiveMessage(
      async (message: PanelMessage) => {
        switch (message.type) {
          case 'ready':
            await this.postState()
            break
          case 'add':
            await this.addUrl(message.url)
            break
          case 'select':
            await this.selectUrl(message.url)
            break
          case 'delete':
            await this.deleteUrl(message.url)
            break
        }
      },
      null,
      this.disposables
    )

    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (
          e.affectsConfiguration(`${EXT_ID}.${CONFIG_KEYS.CUSTOM_URL}`) ||
          e.affectsConfiguration(`${EXT_ID}.${CONFIG_KEYS.SAVED_URLS}`)
        ) {
          void this.postState()
        }
      })
    )

    this.panel.webview.html = this.getHtml()
  }

  public static show() {
    const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One

    if (SettingsPanel.currentPanel) {
      SettingsPanel.currentPanel.panel.reveal(column)
      void SettingsPanel.currentPanel.postState()
      return
    }

    const panel = vscode.window.createWebviewPanel(SettingsPanel.viewType, `${APP_NAME} Settings`, column, {
      enableScripts: true,
      retainContextWhenHidden: true,
    })

    SettingsPanel.currentPanel = new SettingsPanel(panel)
  }

  public dispose() {
    SettingsPanel.currentPanel = undefined
    this.panel.dispose()

    while (this.disposables.length) {
      const disposable = this.disposables.pop()
      disposable?.dispose()
    }
  }

  private getConfig() {
    return vscode.workspace.getConfiguration(EXT_ID)
  }

  private async ensureMigration() {
    const config = this.getConfig()
    const customUrl = config.get<string>(CONFIG_KEYS.CUSTOM_URL, '')
    const savedUrls = config.get<string[]>(CONFIG_KEYS.SAVED_URLS, [])

    if (customUrl && !savedUrls.includes(customUrl)) {
      await config.update(CONFIG_KEYS.SAVED_URLS, [...savedUrls, customUrl], vscode.ConfigurationTarget.Global)
    }
  }

  private async postState() {
    await this.ensureMigration()

    const config = this.getConfig()
    const selectedUrl = config.get<string>(CONFIG_KEYS.CUSTOM_URL, '')
    const savedUrls = config.get<string[]>(CONFIG_KEYS.SAVED_URLS, [])

    await this.panel.webview.postMessage({
      type: 'state',
      selectedUrl,
      savedUrls,
    })
  }

  private validateUrl(url: string): string | null {
    const trimmed = url.trim()
    if (!trimmed) {
      return 'Address cannot be empty'
    }
    if (!trimmed.includes('://')) {
      return 'Address must include protocol (example: socks5://)'
    }
    return null
  }

  private async addUrl(url: string) {
    const error = this.validateUrl(url)
    if (error) {
      vscode.window.showErrorMessage(`${APP_NAME}: ${error}`)
      return
    }

    const trimmed = url.trim()
    const config = this.getConfig()
    const savedUrls = config.get<string[]>(CONFIG_KEYS.SAVED_URLS, [])

    if (savedUrls.includes(trimmed)) {
      await config.update(CONFIG_KEYS.CUSTOM_URL, trimmed, vscode.ConfigurationTarget.Global)
      vscode.window.showInformationMessage(`${APP_NAME}: address already saved, selected`)
      return
    }

    await Promise.all([
      config.update(CONFIG_KEYS.SAVED_URLS, [...savedUrls, trimmed], vscode.ConfigurationTarget.Global),
      config.update(CONFIG_KEYS.CUSTOM_URL, trimmed, vscode.ConfigurationTarget.Global),
    ])

    vscode.window.showInformationMessage(`${APP_NAME}: address saved`)
  }

  private async selectUrl(url: string) {
    const config = this.getConfig()
    const savedUrls = config.get<string[]>(CONFIG_KEYS.SAVED_URLS, [])

    if (!savedUrls.includes(url)) {
      return
    }

    await config.update(CONFIG_KEYS.CUSTOM_URL, url, vscode.ConfigurationTarget.Global)

    const httpConfig = vscode.workspace.getConfiguration()
    const currentProxy = httpConfig.get<string>(CONFIG_KEYS.HTTP_PROXY, '')
    if (currentProxy) {
      await httpConfig.update(CONFIG_KEYS.HTTP_PROXY, url, vscode.ConfigurationTarget.Global)
    }
  }

  private async deleteUrl(url: string) {
    const config = this.getConfig()
    const savedUrls = config.get<string[]>(CONFIG_KEYS.SAVED_URLS, [])
    const selectedUrl = config.get<string>(CONFIG_KEYS.CUSTOM_URL, '')
    const nextUrls = savedUrls.filter((item) => item !== url)

    await config.update(CONFIG_KEYS.SAVED_URLS, nextUrls, vscode.ConfigurationTarget.Global)

    if (selectedUrl === url) {
      const nextSelected = nextUrls[0] ?? ''
      await config.update(CONFIG_KEYS.CUSTOM_URL, nextSelected, vscode.ConfigurationTarget.Global)

      const httpConfig = vscode.workspace.getConfiguration()
      const currentProxy = httpConfig.get<string>(CONFIG_KEYS.HTTP_PROXY, '')
      if (currentProxy === url) {
        if (nextSelected) {
          await httpConfig.update(CONFIG_KEYS.HTTP_PROXY, nextSelected, vscode.ConfigurationTarget.Global)
        } else {
          await Promise.all([
            httpConfig.update(CONFIG_KEYS.HTTP_PROXY, undefined, vscode.ConfigurationTarget.Global),
            httpConfig.update(CONFIG_KEYS.HTTP_PROXY_SUPPORT, undefined, vscode.ConfigurationTarget.Global),
            httpConfig.update(CONFIG_KEYS.HTTP_SYSTEM_CERTIFICATES, undefined, vscode.ConfigurationTarget.Global),
          ])
        }
      }
    }
  }

  private getHtml(): string {
    const nonce = getNonce()

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP_NAME} Settings</title>
  <style nonce="${nonce}">
    :root {
      --accent: ${ACCENT_COLOR};
    }

    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      margin: 0;
      padding: 24px;
      max-width: 640px;
    }

    h1 {
      margin: 0 0 4px;
      font-size: 1.4rem;
      font-weight: 600;
    }

    .subtitle {
      margin: 0 0 24px;
      opacity: 0.75;
    }

    .add-row {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
    }

    input[type="text"] {
      flex: 1;
      min-width: 0;
      padding: 8px 10px;
      border: 1px solid var(--vscode-input-border, transparent);
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border-radius: 4px;
      outline: none;
    }

    input[type="text"]:focus {
      border-color: var(--accent);
    }

    button {
      border: none;
      border-radius: 4px;
      padding: 8px 14px;
      cursor: pointer;
      font: inherit;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    button:hover {
      background: var(--vscode-button-hoverBackground);
    }

    button.secondary {
      background: transparent;
      color: var(--vscode-foreground);
      border: 1px solid var(--vscode-button-secondaryBackground, rgba(128,128,128,0.35));
      padding: 4px 10px;
      font-size: 0.85em;
    }

    button.secondary:hover {
      background: var(--vscode-toolbar-hoverBackground, rgba(128,128,128,0.15));
    }

    button.danger {
      color: var(--vscode-errorForeground, #f14c4c);
    }

    .section-title {
      margin: 0 0 10px;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      opacity: 0.7;
    }

    .list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border: 1px solid var(--vscode-widget-border, rgba(128,128,128,0.25));
      border-radius: 6px;
      background: var(--vscode-sideBar-background, transparent);
    }

    .item.selected {
      border-color: var(--accent);
      box-shadow: inset 3px 0 0 var(--accent);
    }

    .item label {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      min-width: 0;
      cursor: pointer;
    }

    .item input[type="radio"] {
      accent-color: var(--accent);
      flex-shrink: 0;
    }

    .url {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .empty {
      opacity: 0.65;
      padding: 16px 0;
    }

    .error {
      color: var(--vscode-errorForeground, #f14c4c);
      margin: -12px 0 16px;
      min-height: 1.2em;
    }
  </style>
</head>
<body>
  <h1>${APP_NAME}</h1>
  <p class="subtitle">Save proxy addresses and choose which one to use</p>

  <div class="add-row">
    <input id="urlInput" type="text" placeholder="socks5://127.0.0.1:1080" spellcheck="false" />
    <button id="addBtn" type="button">Add</button>
  </div>
  <div id="error" class="error"></div>

  <h2 class="section-title">Saved addresses</h2>
  <ul id="list" class="list"></ul>
  <div id="empty" class="empty" hidden>No saved addresses yet</div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi()
    const listEl = document.getElementById('list')
    const emptyEl = document.getElementById('empty')
    const urlInput = document.getElementById('urlInput')
    const addBtn = document.getElementById('addBtn')
    const errorEl = document.getElementById('error')

    function setError(message) {
      errorEl.textContent = message || ''
    }

    function validate(url) {
      const trimmed = url.trim()
      if (!trimmed) return 'Address cannot be empty'
      if (!trimmed.includes('://')) return 'Address must include protocol (example: socks5://)'
      return null
    }

    function render(state) {
      const { savedUrls = [], selectedUrl = '' } = state
      listEl.innerHTML = ''

      if (!savedUrls.length) {
        emptyEl.hidden = false
        return
      }

      emptyEl.hidden = true

      for (const url of savedUrls) {
        const li = document.createElement('li')
        li.className = 'item' + (url === selectedUrl ? ' selected' : '')

        const label = document.createElement('label')
        const radio = document.createElement('input')
        radio.type = 'radio'
        radio.name = 'proxy'
        radio.value = url
        radio.checked = url === selectedUrl
        radio.addEventListener('change', () => {
          vscode.postMessage({ type: 'select', url })
        })

        const span = document.createElement('span')
        span.className = 'url'
        span.textContent = url
        span.title = url

        label.appendChild(radio)
        label.appendChild(span)

        const del = document.createElement('button')
        del.type = 'button'
        del.className = 'secondary danger'
        del.textContent = 'Delete'
        del.addEventListener('click', () => {
          vscode.postMessage({ type: 'delete', url })
        })

        li.appendChild(label)
        li.appendChild(del)
        listEl.appendChild(li)
      }
    }

    function submit() {
      const url = urlInput.value
      const error = validate(url)
      if (error) {
        setError(error)
        return
      }
      setError('')
      vscode.postMessage({ type: 'add', url })
      urlInput.value = ''
    }

    addBtn.addEventListener('click', submit)
    urlInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') submit()
    })

    window.addEventListener('message', (event) => {
      const message = event.data
      if (message?.type === 'state') {
        render(message)
      }
    })

    vscode.postMessage({ type: 'ready' })
  </script>
</body>
</html>`
  }
}

function getNonce() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let nonce = ''
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return nonce
}
