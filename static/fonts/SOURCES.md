# Local Font Sources

All font requests use local `/fonts/` URLs. The site has no runtime dependency on Google Fonts, jsDelivr, or Fontsource.

## SUSE

The site uses SUSE for headings, body text, navigation, buttons, and diagram labels.
Code uses the browser's monospace font.
Both upright and italic faces support weights 100–900 and include the full upstream character set.
There is no subsetting or font conversion, and no `unicode-range` restriction.

Source: [SUSE v2.001 release](https://github.com/SUSE/suse-font/releases/tag/v2.001).
Archive: <https://github.com/SUSE/suse-font/releases/download/v2.001/suse-font-v2.001.zip>.
The embedded font version is `2.000` in this release.
The license is SIL Open Font License 1.1, included as `SUSE-OFL.txt`.
Trailing whitespace is removed from the local license text.

| Local file | File inside the release archive |
| --- | --- |
| `suse-v2.001-normal.woff2` | `suse-font-v2.001/fonts/webfonts/SUSE[wght].woff2` |
| `suse-v2.001-italic.woff2` | `suse-font-v2.001/fonts/webfonts/SUSE-Italic[wght].woff2` |
| `SUSE-OFL.txt` | `suse-font-v2.001/OFL.txt` |

SHA-256 digests:

```text
5cfa32328cc408a31459fdeacee623684d82ff2b3d84ca80cf5b4ff7b8ff8221  suse-font-v2.001.zip
c56ab202ecd05e4e744ec48cc51324abe2cb3d1088821184bc3b5d7e906d1039  suse-v2.001-normal.woff2
076e9a5eb8a1f902e160d1cb8493170ebb3a2c6814b23349add00a9b50702600  suse-v2.001-italic.woff2
fca0a43eb875d03336371bed12a14ba3076b38de5e7af29fb63a7ae670920f1b  SUSE-OFL.txt
```

The shared `--font-sans` variable selects SUSE with system sans-serif fallbacks.
Body text uses weight 400, navigation and subheadings use 600, and main headings use 700.
The two WOFF2 files total 172,756 bytes. Browsers load the italic face only when needed.
