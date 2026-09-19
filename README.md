# BBCode

> Maintained by [Gabriel Andreescu](https://github.com/gabriel-andreescu), based on [chijure's BBCode extension](https://github.com/chijure/BBCode-Code).

A Visual Studio Code extension for editing BBCode files, with syntax highlighting, automatic bracket pairing, and a live preview.

## Features

- Syntax highlighting for BBCode tags, attributes, and closing tags.
- Automatic language detection for `.bbcode` files.
- Bracket matching and automatic pairing for square brackets and double quotes.
- Code folding and line and block comment support.
- A preview panel beside the editor that updates as you type.

## Requirements

- Visual Studio Code 1.75.0 or later.

## Installation

Install [BBCode by Gabriel Andreescu](https://marketplace.visualstudio.com/items?itemName=gabriel-andreescu.bbcode-support) from the Marketplace:

```sh
code --install-extension gabriel-andreescu.bbcode-support
```

## Usage

Open a `.bbcode` file and use the editor toolbar or command palette:

- **Open Preview to the Side** (`Ctrl+K V`) opens a preview beside the source.
- **Open as Preview** replaces the current tab with its preview. Use `Ctrl+Shift+V` to switch between source and preview.

On macOS, use `Cmd` instead of `Ctrl`. Previews update as you edit the source.

## Preview rendering

`[size=1]` through `[size=7]` use a font-size scale from smallest to largest. Other numeric values and `[style size=...]` use pixels. Lists support `[*]` items with or without `[/*]` closing tags, `[li]` items, and nested lists.

The preview uses your VS Code theme. Individual websites may render BBCode differently.

## Development

Run `npm test` with Node.js 18 or later to test the renderer. To test the extension in VS Code, open this project and press F5.

Package a local build with `npx @vscode/vsce package`.

Report problems in the [issue tracker](https://github.com/gabriel-andreescu/BBCode-Code/issues). See the [changelog](CHANGELOG.md) for release notes.
