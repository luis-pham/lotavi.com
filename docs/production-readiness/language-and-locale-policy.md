# Language and locale policy

Implemented in `packages/domain/src/locale.ts` (`resolveGuestLocale`).

## Priority (initial UI locale)

1. Explicit guest selection on current session/device (`PATCH /api/v1/guest/locale` → `locale_selected`)
2. Explicit locale in guest access context (QR session open body)
3. Supported browser locale
4. Property default
5. `en-US`

## Rules

- Manual selection wins; do not flip UI language from a single foreign utterance.
- Transcripts keep original text; translation fields are separate (`source_locale`, `translated_content`, `translation_provider`, `translation_status`).
- Staff working locale may differ from guest.
- Knowledge source locale tracked at document level (title/content language as authored).
- Server session is source of truth during the visit; localStorage may remember preference on the same device (UI responsibility).
