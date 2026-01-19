# Changelog

All notable changes to the "lazygit-starter" extension will be documented in this file.

## [0.0.9] - 2026-01-19

- **Clipboard Support**: Added support for `Ctrl+V` (Windows/Linux) and `Cmd+V` (macOS) as well as right-click menu to paste text into the simulated terminal.
- **Improved Stability**: Fixed a duplication issue during paste by ensuring a single data source through the native clipboard event.

## [0.0.8] - 2026-01-18

- **Internationalization**: Added comprehensive Chinese (Simplified) translation for context menu items and error messages.
- **i18n Support**: Integrated `vscode-nls` and added `package.nls.json` for better localization management.
- **Manual Refresh**: Added a refresh button in the editor title bar to manually clear screen artifacts by triggering a TUI redraw.
- **Code Refinement**: Cleaned up experimental rendering hacks and optimized terminal initialization sequence.

## [0.0.7] - 2026-01-18

- **Visual Fix**: Increased `lineHeight` to `1.2` in xterm.js to provide better character vertical spacing and reduce overlap.

## [0.0.6] - 2026-01-18

- **Performance & Stability**: Replaced DOM renderer with `xterm-addon-webgl` for GPU-accelerated rendering, reducing visual artifacts.
- **Process Optimization**: Improved PTY lifecycle management and environment variable handling (UTF-8, ConPTY).

## [0.0.5] - 2026-01-18

- **TUI Rendering Fix**: Fixed character ghosting/artifacts when switching views in lazygit by explicitly setting `TERM` and `COLORTERM` environment variables.

## [0.0.4] - 2026-01-18

- **Terminal Fix**: Disabled xterm.js scrollback to fix UI artifacts and character ghosting in the TUI.
- **UI Cleanup**: Removed redundant scrollbar styles to simplify the interface.

## [0.0.3] - 2026-01-18

- **Changelog Configuration**: Migrated release notes from README.md to a dedicated CHANGELOG.md file.
- **Workflow Optimization**: Added automated release scripts in package.json to sync versioning and changelog updates.

## [0.0.2] - 2026-01-18

- **Added Extension Icon**: Included a new icon for better visibility in the VSCode Marketplace and Extension view.
- **Improved Metadata**: Updated package.json with the new icon path.

## [0.0.1] - 2026-01-18

- Initial release of **Lazygit Starter**.
- Core folder context menu integration.
- Smooth and responsive integrated terminal experience.
- Theming and state persistence support.
