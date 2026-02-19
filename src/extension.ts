import * as vscode from 'vscode'
import * as https from 'https'

const EXT_ID = 'proxxy'
const APP_NAME = 'Proxxy'
const ACCENT_COLOR = '#FF2D55'

const COMMANDS = {
  CLICK: `${EXT_ID}.click`,
  TOGGLE: `${EXT_ID}.toggle`,
  SET_ADDRESS: `${EXT_ID}.setAddress`,
} as const

const CONFIG_KEYS = {
  CUSTOM_URL: 'customUrl',
  HTTP_PROXY: 'http.proxy',
  HTTP_PROXY_SUPPORT: 'http.proxySupport',
  HTTP_SYSTEM_CERTIFICATES: 'http.systemCertificates',
} as const

let statusBarItem: vscode.StatusBarItem
let connectionCheckTimer: NodeJS.Timeout | undefined

function isProxyEnabled(): boolean {
  const config = vscode.workspace.getConfiguration()
  const currentProxy = config.get<string>(CONFIG_KEYS.HTTP_PROXY)
  return !!(currentProxy && currentProxy.length > 0)
}

function clearCheckConnectionTimer() {
  if (connectionCheckTimer) {
    clearTimeout(connectionCheckTimer)
    connectionCheckTimer = undefined
  }
}

function scheduleConnectionCheck(delayMs: number = 5_000) {
  clearCheckConnectionTimer()

  connectionCheckTimer = setTimeout(() => {
    if (isProxyEnabled()) {
      checkConnection()
    }
  }, delayMs)
}

export function activate(context: vscode.ExtensionContext) {
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
  statusBarItem.command = COMMANDS.CLICK
  statusBarItem.show()

  updateStatusBarItem()
  scheduleConnectionCheck()

  const clickCommand = vscode.commands.registerCommand(COMMANDS.CLICK, async () => {
    await handleClick()
  })

  const toggleCommand = vscode.commands.registerCommand(COMMANDS.TOGGLE, async () => {
    await toggleProxy()
  })

  const setAddressCommand = vscode.commands.registerCommand(COMMANDS.SET_ADDRESS, async () => {
    await setCustomAddress()
  })

  const configChangeListener = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration(CONFIG_KEYS.HTTP_PROXY)) {
      updateStatusBarItem()
    }
  })

  context.subscriptions.push(clickCommand, toggleCommand, setAddressCommand, statusBarItem, configChangeListener)
}

async function handleClick() {
  const proxyConfig = vscode.workspace.getConfiguration(EXT_ID)
  const customUrl = proxyConfig.get<string>(CONFIG_KEYS.CUSTOM_URL, '')

  if (customUrl) {
    await toggleProxy()
  } else {
    await setCustomAddress()
  }
}

async function setCustomAddress() {
  const proxyConfig = vscode.workspace.getConfiguration(EXT_ID)
  const customUrl = proxyConfig.get<string>(CONFIG_KEYS.CUSTOM_URL, '')

  const input = await vscode.window.showInputBox({
    prompt: 'Enter address',
    placeHolder: 'Example: socks5://127.0.0.1:1080',
    value: customUrl,
    validateInput: (value) => {
      if (!value) {
        return 'Address cannot be empty'
      }
      if (!value.includes('://')) {
        return 'Address must include protocol (example: socks5://)'
      }
      return null
    },
  })

  if (input) {
    await proxyConfig.update(CONFIG_KEYS.CUSTOM_URL, input, vscode.ConfigurationTarget.Global)
    vscode.window.showInformationMessage(`Address saved: ${input}`)
  }
}

async function toggleProxy() {
  try {
    const config = vscode.workspace.getConfiguration()
    const isEnabled = isProxyEnabled()

    if (isEnabled) {
      await disableProxy(config)
      vscode.window.showInformationMessage(`${APP_NAME} disabled`)
    } else {
      await enableProxy(config)
      vscode.window.showInformationMessage(`${APP_NAME} enabled`)

      scheduleConnectionCheck()
    }

    updateStatusBarItem()
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to toggle proxy: ${error}`)
  }
}

async function enableProxy(config: vscode.WorkspaceConfiguration) {
  const proxyConfig = vscode.workspace.getConfiguration(EXT_ID)
  const proxyUrl = proxyConfig.get<string>(CONFIG_KEYS.CUSTOM_URL, '')

  if (!proxyUrl) {
    vscode.window.showErrorMessage(`${APP_NAME} URL is not set`)
    return
  }

  await Promise.all([
    config.update(CONFIG_KEYS.HTTP_PROXY, proxyUrl, vscode.ConfigurationTarget.Global),
    config.update(CONFIG_KEYS.HTTP_PROXY_SUPPORT, 'on', vscode.ConfigurationTarget.Global),
    config.update(CONFIG_KEYS.HTTP_SYSTEM_CERTIFICATES, false, vscode.ConfigurationTarget.Global),
  ])
}

async function disableProxy(config: vscode.WorkspaceConfiguration) {
  await Promise.all([
    config.update(CONFIG_KEYS.HTTP_PROXY, undefined, vscode.ConfigurationTarget.Global),
    config.update(CONFIG_KEYS.HTTP_PROXY_SUPPORT, undefined, vscode.ConfigurationTarget.Global),
    config.update(CONFIG_KEYS.HTTP_SYSTEM_CERTIFICATES, undefined, vscode.ConfigurationTarget.Global),
  ])
}

function updateStatusBarItem() {
  const isEnabled = isProxyEnabled()

  statusBarItem.text = `$(plug) ${APP_NAME}`

  if (isEnabled) {
    const config = vscode.workspace.getConfiguration()
    const currentProxy = config.get<string>(CONFIG_KEYS.HTTP_PROXY)
    statusBarItem.color = ACCENT_COLOR
    statusBarItem.tooltip = `${APP_NAME} enabled (${currentProxy})`
  } else {
    statusBarItem.color = undefined
    statusBarItem.tooltip = `${APP_NAME} disabled`
  }
}

async function checkConnection() {
  return new Promise<void>((resolve) => {
    const options = {
      hostname: 'www.google.com',
      port: 443,
      path: '/',
      method: 'HEAD',
      timeout: 5_000,
    }

    const req = https.request(options, (res) => {
      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
        resolve()
      } else {
        vscode.window.showErrorMessage(`${APP_NAME}: Server is not available`)
        resolve()
      }
    })

    req.on('error', () => {
      vscode.window.showErrorMessage(`${APP_NAME}: Server is not available`)
      resolve()
    })

    req.on('timeout', () => {
      req.destroy()
      vscode.window.showErrorMessage(`${APP_NAME}: Server is not available`)
      resolve()
    })

    req.end()
  })
}

export function deactivate() {
  clearCheckConnectionTimer()

  if (isProxyEnabled()) {
    const config = vscode.workspace.getConfiguration()
    disableProxy(config).catch((error) => {
      console.error('Failed to disable proxy on deactivation:', error)
    })
  }
}
