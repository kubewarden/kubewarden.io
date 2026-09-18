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

## Light and dark themes

The site follows the device theme until a reader uses the moon or sun button.
The browser stores that choice under `kubewarden-theme` in local storage.
Other tabs and pages restored through browser history use the same choice.
Without JavaScript, the site follows the device theme through CSS.
If storage is blocked, the switch still works for the current page.

`assets/sass/_theme.scss` defines the color roles for both themes.
Component styles use these variables directly, without separate dark-theme selectors.
Use `--link-color` for links, `--focus-color` for focus outlines, and the
`--button-*` variables for primary buttons.
Use the surface, text, and status variables for panels, labels, and diagrams.
Keep foreground and background pairs together when you change a palette.

The logo crimson stays `#bc2a46` in both themes.
Dark-theme links and icons use the lighter crimson `#ed6a82` for contrast.
The build generates the dark wordmark from the original SVG without changing the brand mark.
Partner logos use their official white or white-text variants in dark mode.
The Linux mascot keeps its original colors in both themes.
Asset sources are listed in [the image source notes](static/images/SOURCES.md).
The external Teamup calendar retains a light background.
Code blocks use a dark palette in both themes.

The theme script runs before the styles load to prevent a flash of the wrong theme.
CSS and the theme script use content hashes in their URLs so browsers fetch changed assets.
The shared stylesheet loads on every page. Articles also load a small stylesheet for article content and code highlighting.

Run the preference tests with Node.js 18 or later:

```console
node --test tests/theme.test.mjs
```

Before publication, build the production site:

```console
hugo --environment production --minify
```

Review both themes on the home page, all component pages, blog archives, and articles.
Include an article with tables and code, keyboard focus, mobile navigation, and enlarged text.
