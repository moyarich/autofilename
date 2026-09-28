# AutoFilename

File and folder path completion for VS Code.

## Features

- Completes relative file and folder paths from the current document.
- Defaults to all file types and all VS Code language IDs.
- Lets users include or exclude languages and file-name patterns.
- Works inside quoted strings in JavaScript, TypeScript, JSON, JSONC, and other file-backed VS Code documents.
- Reads `compilerOptions.baseUrl` and `compilerOptions.paths` from the nearest `tsconfig.json` or `jsconfig.json`.
- Supports common aliases such as `@/* -> src/*`.
- Supports exact aliases such as `utils -> src/utils/index.js`.
- Can resolve leading `/` paths from a configurable web root instead of the computer filesystem root.
- Uses VS Code's workspace filesystem API, so completion does not scan the user's home directory or enumerate every language at activation time.

## Customization

AutoFilename is enabled for all file types and all languages by default:

```json
{
  "autofilename.languages.include": ["*"],
  "autofilename.files.include": ["*"]
}
```

Users can narrow or customize behavior:

```json
{
  "autofilename.enabled": true,
  "autofilename.languages.include": ["*"],
  "autofilename.languages.exclude": ["plaintext"],
  "autofilename.files.include": ["*"],
  "autofilename.files.exclude": ["*.lock", "*.min.js"],
  "autofilename.showHiddenFiles": false,
  "autofilename.foldersFirst": true,
  "autofilename.insertTrailingSlash": true,
  "autofilename.continueAfterFolder": true
}
```

Exclusions override inclusions. An empty `autofilename.languages.include` array disables AutoFilename for every language. Unknown language IDs are safe: they only match when VS Code reports that exact ID (or when `"*"` is included).

### VS Code language IDs

The language settings use VS Code language identifiers, not file extensions. You can see the active editor's ID by running **Developer: Inspect Editor Tokens and Scopes** from the Command Palette and checking the reported language, or consult VS Code's language identifiers reference.

Settings are read for the active document URI on every completion request, so changes take effect without reloading the extension and folder-specific settings work in multi-root workspaces.


## Alias example

```json
{
  "include": ["./src/**/*"],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "utils": ["src/utils/index.js"]
    }
  }
}
```

Typing:

```ts
import logo from '@/assets/'
```

completes from `src/assets`.

## JSON and settings files

Path completion is not restricted to JavaScript or TypeScript. Quoted path values in JSON/JSONC files can use the same relative, alias, and web-root completion.

```json
{
  "schema": "./config/",
  "icon": "/img/"
}
```

This also covers VS Code configuration files that store file or folder paths as strings.

## Web root

Set `autofilename.webRoot` to a workspace-relative directory:

```json
{
  "autofilename.webRoot": "public"
}
```

Given:

```text
config/
public/
  img/
    logo.png
  index.html
  test.html
```

typing `"/"` suggests:

```text
img/
index.html
test.html
```

If `autofilename.webRoot` is not configured, a leading `/` does not fall back to the operating-system root.

## Extension trimming

`autofilename.extensions.trim` controls which file extensions are omitted from inserted completions.

Default:

```json
["js", "jsx", "ts", "tsx"]
```

## Performance

The provider only reads the single directory needed for the current completion request. It does not enumerate all VS Code languages on activation and does not recursively crawl the filesystem.

Automatic completion after typing a quote is disabled by default because quotes occur in many ordinary strings. Path separators still trigger completion automatically, and manual completion still works. To restore quote-triggered suggestions:

```json
{
  "autofilename.suggestOnQuote": true
}
```

## VS Code Desktop and Web

AutoFilename supports both VS Code Desktop and VS Code Web.

The extension keeps path resolution URI-first and uses `vscode.workspace.fs` so the same source can run in desktop, browser, remote, and virtual workspace environments when the backing filesystem provider supports directory reads.

Desktop builds use the `main` entry point. Web builds use the `browser` entry point.

Platform-specific features must fail gracefully when an equivalent capability is unavailable in a web or virtual extension host; they must not disable the rest of AutoFilename.

### Monaco and other web editors

The completion candidate engine is editor- and filesystem-agnostic. It accepts a small asynchronous directory-reader interface rather than using Node's `fs` API. The VS Code adapter delegates that interface to `vscode.workspace.fs`.

A Monaco integration can reuse the same core with its own URI type and directory reader backed by an in-memory filesystem, browser storage, a remote workspace API, or another virtual filesystem. Tests exercise the core with an in-memory virtual filesystem and do not touch the host filesystem.
