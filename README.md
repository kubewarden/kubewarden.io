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
