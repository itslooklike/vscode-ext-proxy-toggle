import * as vscode from 'vscode'

const EXT_ID = 'proxxy'

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

function isProxyEnabled(): boolean {
  const config = vscode.workspace.getConfiguration()
  const currentProxy = config.get<string>(CONFIG_KEYS.HTTP_PROXY)
  return !!(currentProxy && currentProxy.length > 0)
}

export function activate(context: vscode.ExtensionContext) {
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
  statusBarItem.command = COMMANDS.CLICK
  statusBarItem.show()

  updateStatusBarItem()

  const clickCommand = vscode.commands.registerCommand(COMMANDS.CLICK, async () => {
    await handleClick()
  })

  const toggleCommand = vscode.commands.registerCommand(COMMANDS.TOGGLE, async () => {
    await toggleProxy()
  })

  const setAddressCommand = vscode.commands.registerCommand(COMMANDS.SET_ADDRESS, async () => {
    await setCustomAddress()
  })

  context.subscriptions.push(clickCommand, toggleCommand, setAddressCommand, statusBarItem)
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
    prompt: 'Введите адрес прокси',
    placeHolder: 'Например: socks5://127.0.0.1:1080',
    value: customUrl,
    validateInput: (value) => {
      if (!value) {
        return 'Адрес не может быть пустым'
      }
      if (!value.includes('://')) {
        return 'Адрес должен включать протокол (например: socks5://)'
      }
      return null
    },
  })

  if (input) {
    await proxyConfig.update(CONFIG_KEYS.CUSTOM_URL, input, vscode.ConfigurationTarget.Global)
    vscode.window.showInformationMessage(`Адрес прокси сохранен: ${input}`)
  }
}

async function toggleProxy() {
  try {
    const config = vscode.workspace.getConfiguration()
    const isEnabled = isProxyEnabled()

    if (isEnabled) {
      await disableProxy(config)
      vscode.window.showInformationMessage('Proxxy disabled')
    } else {
      await enableProxy(config)
      vscode.window.showInformationMessage('Proxxy enabled')
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
    vscode.window.showErrorMessage('Proxxy URL is not set')
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

  statusBarItem.text = '$(plug) Proxxy'

  if (isEnabled) {
    const config = vscode.workspace.getConfiguration()
    const currentProxy = config.get<string>(CONFIG_KEYS.HTTP_PROXY)
    statusBarItem.color = '#FF2D55'
    statusBarItem.tooltip = `Proxxy enabled (${currentProxy})`
  } else {
    statusBarItem.color = undefined
    statusBarItem.tooltip = 'Proxxy disabled'
  }
}

export function deactivate() {
  if (isProxyEnabled()) {
    const config = vscode.workspace.getConfiguration()
    disableProxy(config).catch((error) => {
      console.error('Failed to disable proxy on deactivation:', error)
    })
  }
}
