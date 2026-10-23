# Periodic Table App

The Periodic Table project aims de develop a lightweight interactive Periodic Table of Elements, with a simple interface that displays the table of elements. When you click or select an element from the table more detailed information about the element will be displayed.

It is targeted primarily at mobile phones and tablets (Android, iPhone, iPad). Desktop (Windows, Mac, Linux) and web access are a secondary target.

From a technical point of view, the application will be built using [Tauri](https://v2.tauri.app/) cross-platform framework with a React frontend. The UI should use the [Mantine](https://mantine.dev/) components.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Build and run

Make sure you have installed the prerequisites for your OS: https://tauri.app/start/prerequisites/, then run:
```bash
cd periodic-table-app
pnpm install
pnpm tauri android init
```

For Desktop development, run:
```bash
pnpm tauri dev
```

For Android development, run:
```bash
pnpm tauri android dev
```
