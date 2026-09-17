# Local Font Sources

All font requests use local `/fonts/` URLs. The site has no runtime dependency on Google Fonts, jsDelivr, or Fontsource.

## Existing Files

These files remain unchanged:

| Files | Weight and style | Embedded version | License |
| --- | --- | --- | --- |
| `roboto-light.woff`, `roboto-light.woff2` | 300 normal | 2.137; 2017 | `ROBOTO-LICENSE.txt`, Apache 2.0 |
| `roboto-regular.woff`, `roboto-regular.woff2` | 400 normal | 2.137; 2017 | `ROBOTO-LICENSE.txt`, Apache 2.0 |
| `poppins-light.woff`, `poppins-light.woff2` | 300 normal | 3.010 | `POPPINS-OFL.txt`, SIL OFL 1.1 |
| `poppins-bold.woff`, `poppins-bold.woff2` | 700 normal | 3.010 | `POPPINS-OFL.txt`, SIL OFL 1.1 |

The original files came from [`rancherlabs/projects-theme` commit `5e3258f90352c9558674a2cbf5148e8bc8984893`](https://github.com/rancherlabs/projects-theme/tree/5e3258f90352c9558674a2cbf5148e8bc8984893).
The earlier download and conversion tools are not recorded here.

## Roboto Additions

The following files are unchanged downloads from `@fontsource/roboto@4.5.8` through jsDelivr:

| Local file | Exact source |
| --- | --- |
| `roboto-latin-700-normal.woff2` | <https://cdn.jsdelivr.net/npm/@fontsource/roboto@4.5.8/files/roboto-latin-700-normal.woff2> |
| `roboto-latin-400-italic.woff2` | <https://cdn.jsdelivr.net/npm/@fontsource/roboto@4.5.8/files/roboto-latin-400-italic.woff2> |
| `roboto-latin-700-italic.woff2` | <https://cdn.jsdelivr.net/npm/@fontsource/roboto@4.5.8/files/roboto-latin-700-italic.woff2> |
| `roboto-latin-ext-400-normal.woff2` | <https://cdn.jsdelivr.net/npm/@fontsource/roboto@4.5.8/files/roboto-latin-ext-400-normal.woff2> |
| `roboto-latin-ext-700-normal.woff2` | <https://cdn.jsdelivr.net/npm/@fontsource/roboto@4.5.8/files/roboto-latin-ext-700-normal.woff2> |
| `roboto-latin-ext-400-italic.woff2` | <https://cdn.jsdelivr.net/npm/@fontsource/roboto@4.5.8/files/roboto-latin-ext-400-italic.woff2> |
| `roboto-latin-ext-700-italic.woff2` | <https://cdn.jsdelivr.net/npm/@fontsource/roboto@4.5.8/files/roboto-latin-ext-700-italic.woff2> |

The package's [`metadata.json`](https://cdn.jsdelivr.net/npm/@fontsource/roboto@4.5.8/metadata.json) identifies Google Fonts release `v30`, last modified `2022-05-12`.
Each file reports `Version 2.137; 2017`, which matches the existing Roboto files.
The existing `ROBOTO-LICENSE.txt` covers these Apache 2.0 fonts.

The `unicode-range` declarations use these pinned Fontsource files:

- [400 normal CSS](https://cdn.jsdelivr.net/npm/@fontsource/roboto@4.5.8/400.css)
- [700 normal CSS](https://cdn.jsdelivr.net/npm/@fontsource/roboto@4.5.8/700.css)
- [400 italic CSS](https://cdn.jsdelivr.net/npm/@fontsource/roboto@4.5.8/400-italic.css)
- [700 italic CSS](https://cdn.jsdelivr.net/npm/@fontsource/roboto@4.5.8/700-italic.css)

The existing Roboto 400 declaration uses its actual character map, which lists the characters in the font.
It follows the extended declaration so that the original face takes priority for shared characters, such as `U+0178`.
This order preserves the original regular face without hiding the extended subset.
The 700 normal, 400 italic, and 700 italic declarations each pair a Latin-ext file with a Latin file.
Each extended declaration precedes its Latin counterpart and uses the pinned Fontsource Latin-ext range.

## Poppins Additions

Both source files come from Google Fonts commit `18493b26819b9e74aa9a0057cd036625edf45e05`:

| Local file | Exact source | Subset |
| --- | --- | --- |
| `poppins-regular.woff2` | [Poppins-Regular.ttf](https://raw.githubusercontent.com/google/fonts/18493b26819b9e74aa9a0057cd036625edf45e05/ofl/poppins/Poppins-Regular.ttf) | Latin plus Latin-ext |
| `poppins-latin-ext-700-normal.woff2` | [Poppins-Bold.ttf](https://raw.githubusercontent.com/google/fonts/18493b26819b9e74aa9a0057cd036625edf45e05/ofl/poppins/Poppins-Bold.ttf) | Latin-ext without characters in the existing bold file |

The source and output files report `Version 3.010;PS 1.000;hotconv 16.6.54;makeotf.lib2.5.65590`, which matches the existing Poppins files.
The existing `POPPINS-OFL.txt` retains the copyright notice and SIL OFL 1.1 license.
The pinned source has the [same license text](https://raw.githubusercontent.com/google/fonts/18493b26819b9e74aa9a0057cd036625edf45e05/ofl/poppins/OFL.txt).

The conversion uses the Fontsource Latin and Latin-ext ranges above as explicit character filters.
The bold filter excludes `U+0152-0153` and `U+0178`, which the existing bold file contains.
Its resulting character map has no overlap with the existing bold file.
The original bold declaration uses its actual character map, including its ligatures and symbols.
CSS ranges select characters only when the font also contains them. A broad range does not imply complete coverage of that range.

The generated files are modified subsets of the pinned TrueType sources, compressed as WOFF2.
FontTools retains the source name records, including version, copyright, and license records.
The conversion retains default hinting and layout closure, which keeps glyphs needed by font layout rules.
It does not rename the font or replace any existing file.

### Reproduction

The conversion used CPython 3.14.7, FontTools 4.65.0, and Brotli 1.2.0 on Linux.
The isolated environment and source downloads stay under `/tmp/opencode`, outside the repository.

From the repository root, run:

```sh
python3 -m venv /tmp/opencode/a18-font-venv
/tmp/opencode/a18-font-venv/bin/pip install fonttools==4.65.0 brotli==1.2.0

curl --fail --location --silent --show-error https://raw.githubusercontent.com/google/fonts/18493b26819b9e74aa9a0057cd036625edf45e05/ofl/poppins/Poppins-Regular.ttf --output /tmp/opencode/a18-Poppins-Regular.ttf
curl --fail --location --silent --show-error https://raw.githubusercontent.com/google/fonts/18493b26819b9e74aa9a0057cd036625edf45e05/ofl/poppins/Poppins-Bold.ttf --output /tmp/opencode/a18-Poppins-Bold.ttf

/tmp/opencode/a18-font-venv/bin/pyftsubset /tmp/opencode/a18-Poppins-Regular.ttf \
  --output-file=static/fonts/poppins-regular.woff2 --flavor=woff2 \
  --unicodes='U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD,U+0100-024F,U+0259,U+1E00-1EFF,U+2020,U+20A0-20AB,U+20AD-20CF,U+2113,U+2C60-2C7F,U+A720-A7FF' \
  --name-IDs='*' --name-languages='*' --name-legacy

/tmp/opencode/a18-font-venv/bin/pyftsubset /tmp/opencode/a18-Poppins-Bold.ttf \
  --output-file=static/fonts/poppins-latin-ext-700-normal.woff2 --flavor=woff2 \
  --unicodes='U+0100-0151,U+0154-0177,U+0179-024F,U+0259,U+1E00-1EFF,U+2020,U+20A0-20AB,U+20AD-20CF,U+2113,U+2C60-2C7F,U+A720-A7FF' \
  --name-IDs='*' --name-languages='*' --name-legacy
```

### SHA-256 Digests

```text
2425ebbc021bfdd18fe55edbeeb1539d22a217212c14430a7d4d75266a333bbc  Poppins-Regular.ttf (source)
210933fb1bb4e846d37ef00c92cae636ac35633132cf2157c7ac879f27f82068  Poppins-Bold.ttf (source)
6675f95fa368f96bb0b11fecfc9650c5ac443c903ecf2d880270d6e8a05650e3  poppins-regular.woff2
cbefd3b8b6509089f7a935fed6bf17779e74aa4d8c67c1d1aa9d06c98bc03385  poppins-latin-ext-700-normal.woff2
f5aebdfea35d1e7656ef4acc5db1f243209755ae3300943ef8fc6280f363c860  roboto-latin-700-normal.woff2
db0424fb67fb52e7e538490240cc7fb9c05aa076333a4968f3dee30b825dabf9  roboto-latin-400-italic.woff2
6be97ca17228a69c406231d89c003194c3dfba7401eaa9fe9e9ed0ef1c18dc38  roboto-latin-700-italic.woff2
3c23eb02de6b34e30f18cfb7167abd81a2cedfd1da60dfcb71989517ab3fb431  roboto-latin-ext-400-normal.woff2
fc66f942651a9fe1a598770d3d896529dcd7a03d02f40655451513093103e61b  roboto-latin-ext-700-normal.woff2
9582ced8a675bf267cc7ac392a86413ed850e53c85919b93719134ecc22ea04b  roboto-latin-ext-400-italic.woff2
acaac043ca238f0e56e61864456777faa4a413b1f0a1dd02fe506b870bc69f26  roboto-latin-ext-700-italic.woff2
```

## Coverage And Integration

FontTools inspection confirms the family versions, weights, italic flags, and character maps.
All four Roboto Latin-ext files contain `U+010C` (Latin capital C with caron): 400 normal, 700 normal, 400 italic, and 700 italic.
Poppins 400 normal and Poppins 700 normal also contain that character.
The existing light faces do not contain that character.
Every Unicode character in each local font's character maps remains accessible through its declaration, including both existing WOFF and WOFF2 files.
No `unicode-range` declaration excludes a character present in its font.
This addition does not provide every script or every weight/style combination.

The `main.scss` entry point imports these declarations before the base and main styles:

```scss
@import "fonts";
@import "base";
@import "blog-archive";
```
