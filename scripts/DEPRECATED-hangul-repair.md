# Deprecated Hangul repair scripts
#
# These one-off scripts patched Hangul that had been corrupted to `?` inside
# apps/web/src/main.ts. That approach is obsolete after the i18n migration:
# UI strings now live in apps/web/src/i18n/ (ui-extra.json + messages/).
#
# Do not use for new work. Use:
#   npm run check:encoding
#   npm run i18n:gen
#
# Related: .cursor/rules/hangul-encoding.mdc
