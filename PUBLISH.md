# Публикация расширения в VSCode Marketplace

```bash
npm install -g @vscode/vsce
```

## Первая публикация

```bash
# Войдите в систему
vsce login itslooklike

# Опубликуйте
vsce publish
```

## Обновление версии

```bash
# Обновить patch версию (0.0.1 → 0.0.2)
vsce publish patch

# Обновить minor версию (0.0.1 → 0.1.0)
vsce publish minor

# Обновить major версию (0.0.1 → 1.0.0)
vsce publish major

# Или указать конкретную версию
vsce publish 1.2.3
```

## Полезные команды

```bash
# Просмотреть информацию о расширении
vsce show itslooklike.vscode-ext-proxy-toggle
```

## Ссылки

- Marketplace: https://marketplace.visualstudio.com/items?itemName=itslooklike.vscode-ext-proxy-toggle
- Управление: https://marketplace.visualstudio.com/manage/publishers/itslooklike
- Документация: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- Встроенные иконки: https://code.visualstudio.com/api/references/icons-in-labels#icon-listing
