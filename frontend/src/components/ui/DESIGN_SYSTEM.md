# Design System Documentation

A centralized design system built with Radix UI primitives for consistent, accessible UI components.

## Components

### Select (Dropdown)

A customizable select/dropdown component built on `@radix-ui/react-select`.

#### Features

- ✅ **Radix UI** - Built on accessible Radix UI primitives
- ✅ **Loading State** - Shows spinner during data fetching
- ✅ **Error State** - Red border and error message support
- ✅ **Disabled State** - Supports disabled/loading states
- ✅ **Empty State** - Custom empty message when no options
- ✅ **RTL Support** - Right-to-left text alignment for Persian
- ✅ **Variants** - Multiple size and style variants
- ✅ **Keyboard Navigation** - Full keyboard support
- ✅ **Type-safe** - Full TypeScript support

#### Import

```tsx
import { Select } from "@/components/ui";
// or
import { Select } from "@/components/ui/Select";
```

#### Basic Usage

```tsx
import { Select, type Option } from "@/components/ui";
import { useState } from "react";

function MyComponent() {
  const [selectedCity, setSelectedCity] = useState<Option | null>(null);

  const cities: Option[] = [
    { id: 1, name: "تهران" },
    { id: 2, name: "مشهد" },
    { id: 3, name: "اصفهان" },
  ];

  return (
    <Select
      label="شهر"
      value={selectedCity}
      onChange={setSelectedCity}
      options={cities}
      placeholder="یک شهر انتخاب کنید"
    />
  );
}
```

#### With Loading State

```tsx
<Select
  label="استان"
  value={province}
  onChange={setProvince}
  options={provinces}
  isLoading={isLoadingProvinces}
  placeholder="در حال بارگیری..."
/>
```

#### With Error State

```tsx
<Select
  label="دسته‌بندی"
  value={category}
  onChange={setCategory}
  options={categories}
  error="انتخاب دسته‌بندی الزامی است"
/>
```

#### Size Variants

```tsx
// Small
<Select size="sm" options={options} onChange={handleChange} />

// Default
<Select size="default" options={options} onChange={handleChange} />

// Large
<Select size="lg" options={options} onChange={handleChange} />
```

#### API Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Optional label displayed above select |
| `value` | `Option \| null` | `null` | Currently selected option |
| `onChange` | `(value: Option) => void` | **required** | Callback when selection changes |
| `options` | `Option[]` | **required** | Array of options to display |
| `placeholder` | `string` | `"انتخاب کنید"` | Placeholder text when no selection |
| `className` | `string` | `""` | Additional CSS classes for container |
| `selectButtonClassName` | `string` | - | Additional CSS classes for trigger button |
| `isLoading` | `boolean` | `false` | Shows loading spinner |
| `error` | `string` | - | Error message to display |
| `emptyMessage` | `string` | `"موردی یافت نشد"` | Message when options array is empty |
| `disabled` | `boolean` | `false` | Disables the select |
| `variant` | `"default" \| "error"` | `"default"` | Visual variant |
| `size` | `"default" \| "sm" \| "lg"` | `"default"` | Size variant |

#### Option Type

```tsx
interface Option {
  id: number | string;
  name: string;
}
```

---

### Checkbox

A customizable checkbox component built on `@radix-ui/react-checkbox`.

#### Features

- ✅ **Radix UI** - Built on accessible Radix UI primitives
- ✅ **Variants** - Multiple color and size variants
- ✅ **Label Support** - Optional label with proper accessibility
- ✅ **Disabled State** - Visual and functional disabled state
- ✅ **Smooth Animations** - Transition effects on state changes
- ✅ **Keyboard Navigation** - Full keyboard support
- ✅ **Type-safe** - Full TypeScript support

#### Import

```tsx
import { Checkbox } from "@/components/ui";
// or
import { Checkbox } from "@/components/ui/Checkbox";
```

#### Basic Usage

```tsx
import { Checkbox } from "@/components/ui";
import { useState } from "react";

function MyComponent() {
  const [accepted, setAccepted] = useState(false);

  return (
    <Checkbox
      checked={accepted}
      onChange={setAccepted}
      label="قوانین و مقررات را می‌پذیرم"
    />
  );
}
```

#### Without Label

```tsx
<Checkbox checked={isChecked} onChange={setIsChecked} />
```

#### Disabled State

```tsx
<Checkbox
  checked={true}
  onChange={() => {}}
  label="غیرفعال"
  disabled
/>
```

#### Size Variants

```tsx
// Small
<Checkbox size="sm" checked={checked} onChange={setChecked} label="کوچک" />

// Default
<Checkbox size="default" checked={checked} onChange={setChecked} label="پیش‌فرض" />

// Large
<Checkbox size="lg" checked={checked} onChange={setChecked} label="بزرگ" />
```

#### Color Variants

```tsx
// Default (Pink - Primary)
<Checkbox variant="default" checked={checked} onChange={setChecked} />

// Sky Blue
<Checkbox variant="sky" checked={checked} onChange={setChecked} />
```

#### API Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | `boolean` | `false` | Whether checkbox is checked |
| `onChange` | `(checked: boolean) => void` | - | Callback when state changes |
| `label` | `React.ReactNode` | - | Optional label text or element |
| `className` | `string` | - | Additional CSS classes |
| `disabled` | `boolean` | `false` | Disables the checkbox |
| `variant` | `"default" \| "sky"` | `"default"` | Color variant |
| `size` | `"default" \| "sm" \| "lg"` | `"default"` | Size variant |

---

## Design Tokens

### Colors

The design system uses the following primary colors:

- **Primary Action**: `#EC4899` (Pink 500) - Used for primary actions, checked states
- **Sky Blue**: `#0EA5E9` - Alternative checkbox variant
- **Error**: Red 500 - For error states and validation
- **Neutral**: Slate/Gray scale - For borders and secondary text

### Typography

- **Right-to-Left (RTL)**: All text is right-aligned for Persian language
- **Font Families**: Peyda, Rokh, Kaghaz (custom Persian fonts)

### Spacing

- Uses Tailwind's default spacing scale
- Consistent padding: `px-3 py-3` for form elements
- Gap spacing: `gap-1`, `gap-2` for vertical stacking

---

## Migration Guide

### From HeadlessUI Select to Radix UI Select

**Before:**
```tsx
import Select from "@/components/Kits/Form/Select";

<Select
  label="دسته‌بندی"
  value={category}
  onChange={setCategory}
  options={categories}
/>
```

**After:**
```tsx
import { Select } from "@/components/ui";

<Select
  label="دسته‌بندی"
  value={category}
  onChange={setCategory}
  options={categories}
/>
```

The API is **100% compatible** - no changes needed!

### From Custom Checkbox to Radix UI Checkbox

**Before:**
```tsx
import Checkbox from "@/components/Kits/Auth/Checkbox";

<Checkbox
  checked={accepted}
  onChange={setAccepted}
  label="قبول دارم"
/>
```

**After:**
```tsx
import { Checkbox } from "@/components/ui";

<Checkbox
  checked={accepted}
  onChange={setAccepted}
  label="قبول دارم"
/>
```

The API is **100% compatible** - no changes needed!

---

## Best Practices

### 1. Always Provide Labels

For accessibility, always provide labels for form elements:

```tsx
// ✅ Good
<Select label="شهر" options={cities} onChange={handleChange} />

// ❌ Bad (no label)
<Select options={cities} onChange={handleChange} />
```

### 2. Handle Loading States

Show loading states when fetching data:

```tsx
<Select
  label="استان"
  options={provinces}
  onChange={handleChange}
  isLoading={isLoadingProvinces}
/>
```

### 3. Provide Meaningful Error Messages

Use specific, actionable error messages:

```tsx
// ✅ Good
<Select error="لطفاً یک دسته‌بندی انتخاب کنید" />

// ❌ Bad
<Select error="خطا" />
```

### 4. Use Empty Messages

Customize empty state messages for better UX:

```tsx
<Select
  options={[]}
  emptyMessage="هیچ دسته‌بندی‌ای یافت نشد"
  onChange={handleChange}
/>
```

### 5. Type Safety

Always type your state properly:

```tsx
import { type Option } from "@/components/ui";

const [selected, setSelected] = useState<Option | null>(null);
```

---

## Accessibility

Both components follow WAI-ARIA best practices:

- **Keyboard Navigation**: Full keyboard support (Arrow keys, Enter, Escape)
- **Screen Reader Support**: Proper ARIA labels and roles
- **Focus Management**: Visible focus indicators
- **State Announcements**: State changes are announced to screen readers

---

## Performance

### Select

- **Virtualization**: Consider react-window for 500+ options
- **Memoization**: Options should be memoized to prevent re-renders
- **Debouncing**: Use with search/filter for better performance

### Checkbox

- **Lightweight**: No external dependencies beyond Radix UI
- **Optimized Re-renders**: Only re-renders on state change

---

## Testing

### Example Test for Select

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Select } from "@/components/ui";

test("renders select with options", () => {
  const options = [
    { id: 1, name: "تهران" },
    { id: 2, name: "مشهد" },
  ];

  render(
    <Select
      label="شهر"
      options={options}
      onChange={() => {}}
    />
  );

  expect(screen.getByText("شهر")).toBeInTheDocument();
});
```

### Example Test for Checkbox

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Checkbox } from "@/components/ui";

test("toggles checkbox on click", () => {
  const handleChange = jest.fn();

  render(
    <Checkbox
      checked={false}
      onChange={handleChange}
      label="قبول دارم"
    />
  );

  const checkbox = screen.getByRole("checkbox");
  fireEvent.click(checkbox);

  expect(handleChange).toHaveBeenCalledWith(true);
});
```

---

## Troubleshooting

### Select dropdown doesn't appear

**Issue**: The dropdown is not visible when clicking the select.

**Solution**: Ensure your app has a portal root:

```tsx
// In your _app.tsx or layout.tsx
<div id="radix-portal" />
```

### Styles not applying

**Issue**: Custom styles are not being applied.

**Solution**: Make sure Tailwind is scanning the ui directory:

```js
// tailwind.config.ts
content: [
  "./src/components/**/*.{js,ts,jsx,tsx}",
]
```

### TypeScript errors with Option type

**Issue**: TypeScript errors when using options.

**Solution**: Import the Option type:

```tsx
import { Select, type Option } from "@/components/ui";
```

---

## Future Enhancements

- [ ] Radio Button component
- [ ] Switch/Toggle component
- [ ] Multi-select dropdown
- [ ] Combobox (searchable select)
- [ ] Date picker
- [ ] Time picker

---

## Resources

- [Radix UI Documentation](https://www.radix-ui.com/)
- [Radix UI Select](https://www.radix-ui.com/primitives/docs/components/select)
- [Radix UI Checkbox](https://www.radix-ui.com/primitives/docs/components/checkbox)
- [WAI-ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
