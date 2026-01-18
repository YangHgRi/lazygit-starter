# Changelog

All notable changes to the "lazygit-starter" extension will be documented in this file.

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
