# Typography

## Summary

The project uses a single typeface, **Vazirmatn**, loaded **locally** only.

Hierarchy is built with **scale + weight**, not separate font families:

| Variant | Size | Default weight |
|---------|------|----------------|
| display, headingLg | 68 / 48px | 700 |
| heading, headingMd | 36 / 24px | 600 |
| body, ui, ... | 13-18px | 400 |

## Font paths

```
apps/mobile/assets/fonts/
├── Vazirmatn-Regular.ttf
├── Vazirmatn-Medium.ttf
├── Vazirmatn-SemiBold.ttf
└── Vazirmatn-Bold.ttf
```

## Usage

```tsx
<Text variant="headingLg">Decision notebook</Text>
<Text variant="body" color="secondary">Supporting text</Text>
```

- Loading: `hooks/useAppFonts.ts` + `expo-font`
- Component: `@/components/ui/Text` with `variant` prop
- **Not allowed**: CDN, Google Fonts at runtime, handwriting/serif fonts

## Tier

All tiers

## Tests

- `apps/mobile/theme/fonts.spec.ts`
- `apps/mobile/theme/typography.spec.ts`
