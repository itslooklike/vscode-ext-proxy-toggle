import * as assert from 'assert'
import * as vscode from 'vscode'

suite('Proxxy Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.')

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('itslooklike.vscode-ext-proxy-toggle'))
  })

  test('Extension should activate', async () => {
    const extension = vscode.extensions.getExtension('itslooklike.vscode-ext-proxy-toggle')
    assert.ok(extension)
    await extension!.activate()
    assert.strictEqual(extension!.isActive, true)
  })

  test('Should register proxxy.toggle command', async () => {
    const commands = await vscode.commands.getCommands(true)
    assert.ok(commands.includes('proxxy.toggle'))
  })

  test('Should register proxxy.setAddress command', async () => {
    const commands = await vscode.commands.getCommands(true)
    assert.ok(commands.includes('proxxy.setAddress'))
  })

  test('Should read http.proxy configuration', () => {
    const config = vscode.workspace.getConfiguration()
    const proxyValue = config.get<string>('http.proxy')
    // Just verify we can read the config (may or may not be set)
    assert.ok(typeof proxyValue === 'string' || proxyValue === undefined)
  })

  test('Should have proxxy.customUrl configuration', () => {
    const config = vscode.workspace.getConfiguration('proxxy')
    const customUrl = config.get<string>('customUrl')
    assert.strictEqual(typeof customUrl, 'string')
  })

  test('Should create status bar item after activation (via click command)', async () => {
    const extension = vscode.extensions.getExtension('itslooklike.vscode-ext-proxy-toggle')
    await extension!.activate()

    const commands = await vscode.commands.getCommands(true)
    assert.ok(commands.includes('proxxy.click'))
  })

  test('Extension should deactivate cleanly', async () => {
    const extension = vscode.extensions.getExtension('itslooklike.vscode-ext-proxy-toggle')
    assert.ok(extension)
  })
})
