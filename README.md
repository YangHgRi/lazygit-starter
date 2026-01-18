# Lazygit Starter

Open [lazygit](https://github.com/jesseduffield/lazygit) in a new VSCode Webview tab directly from your folder context menu.

## Features

- **Folder Context Menu Integration**: Right-click any folder in the Explorer and select "Open with lazygit" to jump straight into action.
- **Embedded Webview Experience**: Runs `lazygit` inside a VSCode tab using `xterm.js` and `node-pty`, eliminating the need to switch to an external terminal.
- **State Persistence**: Your open lazygit tabs are restored even after VSCode restarts.
- **Full Terminal Support**: Supports mouse interactions and standard terminal keyboard shortcuts.
- **Theme Awareness**: Automatically adapts to your VSCode editor's font family, font size, and color theme for a seamless visual experience.
- **Visual Feedback**: The terminal dims slightly when the window loses focus, providing clear visual indication of active state.
- **Background Execution**: Keeps the lazygit process running in the background even when you switch to other tabs, ensuring you never lose your place.
- **Smart Tab Titles**: Automatically names the tab after the folder you opened, making it easy to distinguish between multiple active repositories.

## Requirements

You must have [`lazygit`](https://github.com/jesseduffield/lazygit) installed and available in your system's PATH.

## Usage

1. Open the **Explorer** view in VSCode.
2. **Right-click** on any folder (or the root project folder).
3. Select **Open with lazygit** from the context menu.
4. A new tab will open with the `lazygit` interface.

## Extension Settings

This extension currently does not contribute any specific settings.

## Known Issues

- Ensure `lazygit` is installed on your machine. If the extension cannot find the `lazygit` executable, it may fall back to your default shell.

## Release Notes

### 0.0.1

- Initial release of Lazygit Starter.
- Basic folder context menu integration.
- Webview-based terminal implementation.

---

**Enjoy a faster Git workflow!**
