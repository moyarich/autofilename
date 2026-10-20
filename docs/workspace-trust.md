# Workspace trust audit

AutoFilename operates in restricted/untrusted workspaces. Its completion path reads editor text, declarative settings, project JSON configuration, and directory entries via `vscode.workspace.fs`; it does not run workspace tasks, shells, scripts, or project code.

`tsconfig.json`, `jsconfig.json`, mappings, and web roots are treated as *data*, not executable configuration. Completion results are suggestions only. VS Code remains responsible for enforcing available filesystem providers and user permissions.

The extension declares `untrustedWorkspaces.supported: true` in `package.json`. This policy applies equally to desktop and browser extension hosts. Reassess this audit before introducing any command execution, external process spawning, or project module imports.
