[![Stable](https://img.shields.io/badge/status-stable-brightgreen?style=for-the-badge)](https://github.com/kubewarden/community/blob/main/REPOSITORIES.md#stable)

# Kubewarden.io website source

This is the source repository for the https://www.kubewarden.io website.

The site uses [Hugo](https://gohugo.io) with local layouts, styles, and fonts.
It does not require a theme or Git submodules.

Some base styles and templates derive from the Rancher Labs
[project theme](https://github.com/rancherlabs/projects-theme).
The original [MIT license](static/licenses/projects-theme.txt) applies to that code.

## Local development

Install Hugo Extended to compile the Sass styles, then start the local server:

``` console
$ hugo server -D
```

## Fonts and readability

The site serves its fonts locally. Font sources, licenses, and conversion commands
are recorded in [the font source notes](static/fonts/SOURCES.md).
The base font size follows browser preferences while preserving the default design.
Code uses the browser's monospace font.

Before publishing style changes, test the home page, component pages, blog lists,
and articles with larger browser fonts and at narrow widths. Check keyboard
navigation and long code examples as well.
