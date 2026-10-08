# Typography

## خلاصه

فونت واحد پروژه **Vazirmatn** است، فقط به‌صورت **لوکال** بارگذاری می‌شود.

Hierarchy با **scale + weight** ساخته می‌شود، نه با فونت جدا:

| Variant | Size | Weight پیش‌فرض |
|---------|------|----------------|
| display, headingLg | 68 / 48px | 700 |
| heading, headingMd | 36 / 24px | 600 |
| body, ui, ... | 13-18px | 400 |

## مسیر فونت‌ها

```
apps/mobile/assets/fonts/
├── Vazirmatn-Regular.ttf
├── Vazirmatn-Medium.ttf
├── Vazirmatn-SemiBold.ttf
└── Vazirmatn-Bold.ttf
```

## استفاده

```tsx
<Text variant="headingLg">دفترچه تصمیم</Text>
<Text variant="body" color="secondary">متن توضیحی</Text>
```

- بارگذاری: `hooks/useAppFonts.ts` + `expo-font`
- کامپوننت: `@/components/ui/Text` با prop `variant`
- **ممنوع**: CDN، Google Fonts runtime، فونت دستنویس/serif

## Tier

همه tierها

## تست‌ها

- `apps/mobile/theme/fonts.spec.ts`
- `apps/mobile/theme/typography.spec.ts`
