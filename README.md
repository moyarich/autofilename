# AutoFilename

File and folder path completion for VS Code.

## Features

- Completes relative file and folder paths from the current document.
- Works inside quoted strings in JavaScript, TypeScript, JSON, JSONC, and other file-backed VS Code documents.
- Reads `compilerOptions.baseUrl` and `compilerOptions.paths` from the nearest `tsconfig.json` or `jsconfig.json`.
- Supports common aliases such as `@/* -> src/*`.
- Supports exact aliases such as `utils -> src/utils/index.js`.
- Can resolve leading `/` paths from a configurable web root instead of the computer filesystem root.
- Uses VS Code's workspace filesystem API, so completion does not scan the user's home directory or enumerate every language at activation time.

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
import logo from '@/assets/
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
