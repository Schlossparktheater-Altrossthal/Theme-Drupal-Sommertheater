# Mercury Theme - Agent Rules

This document contains coding rules and conventions for the Mercury theme that AI agents should follow when making changes.

## CVA (Class Variant Authority) Usage

### Conditionals Must Use CVA

**Rule**: Never use inline conditionals within HTML tag attributes. Always use CVA (Class Variant Authority) to handle conditional classes.

**❌ Bad:**

```twig
<h3 class="hg:font-semibold{% if badges is empty %} hg:relative{% endif %}">
  <a href="{{ url }}"{% if badges is empty %} class="hg:after:absolute hg:after:inset-0 hg:after:content-['']"{% endif %}>
```

**✅ Good:**

```twig
{% set heading_variants =
  html_cva(
    base: 'hg:font-semibold',
    variants: {
      hasBadges: {
        yes: '',
        no: 'hg:relative'
      }
    }
  )
%}

<h3
  class="{{
  heading_variants.apply({
    hasBadges: has_badges ? 'yes' : 'no'
  })
  }}"
>
  <a
    href="{{ url }}"
    class="{{
    link_variants.apply({
      hasBadges: has_badges ? 'yes' : 'no'
    })
    }}"
  >

  </a>
</h3>
```

### CVA Variant Keys Use Yes/No Strings

**Rule**: CVA variant keys should use `yes`/`no` string values, not boolean values (`true`/`false`) or quoted strings (`'true'`/`'false'`).

**❌ Bad:**

```twig
clickable: { true: 'hg:group hg:cursor-pointer', false: '' } clickable: { 'true': 'hg:group hg:cursor-pointer', 'false': '' }
```

**✅ Good:**

```twig
clickable: { yes: 'hg:group hg:cursor-pointer', no: '' }
```

**Note**: When setting variables for CVA, convert boolean conditions to `'yes'`/`'no'` strings:

```twig
{% set is_clickable = url is not empty and url != 'No URL' ? 'yes' : 'no' %}
{% set has_badges = badges is not empty %}
{% set badge_variant = has_badges ? 'yes' : 'no' %}
```

### CVA Formatting

**Rule**: CVA definitions should use multi-line format for better readability.

**✅ Good:**

```twig
{% set card =
  html_cva(
    base: 'card hg:flex hg:flex-col',
    variants: {
      orientation: {
        stacked: '',
        landscape: 'hg:md:flex-row'
      }
    }
  )
%}
```

**Rule**: CVA `.apply()` calls should use multi-line format when they contain multiple parameters or are long.

**✅ Good:**

```twig
<div
  class="{{
  card.apply(
    {
      orientation: card_orientation,
      style: card_style,
      clickable: is_clickable
    },
    card_classes|default('')
  )
  }}"
></div>
```

## HTML Tag Attributes

### No Conditionals in Class Attributes

**Rule**: Never place Twig conditionals directly within HTML `class` attributes. Always compute class values beforehand using variables or CVA.

**❌ Bad:**

```twig
<div class="something{% if condition %} extra-class{% endif %}"></div>
```

**✅ Good:**

```twig
{% set classes = condition ? 'something extra-class' : 'something' %}
<div class="{{ classes }}"></div>
```

Or using CVA (preferred):

```twig
{% set variant_classes =
  html_cva(
    base: 'something',
    variants: {
      condition: {
        yes: 'extra-class',
        no: ''
      }
    }
  )
%}
{% set condition_value = condition ? 'yes' : 'no' %}
<div
  class="{{
  variant_classes.apply({
    condition: condition_value
  })
  }}"
></div>
```

**Note**: This rule applies specifically to `class` attributes. For other attributes (like `data-*`, `aria-*`, etc.), see the "No Inline Control Structures in Attributes" rule below.

## Variable Naming

**Rule**: When converting conditionals to variables for CVA, use descriptive boolean variable names.

**✅ Good:**

```twig
{% set has_badges = badges is not empty %}
{% set is_clickable = url is not empty and url != 'No URL' ? 'yes' : 'no' %}
```

## HTML Attributes and Drupal Attributes

### Attributes Must Have Space Before Them

**Rule**: When appending `{{ attributes }}` to HTML tags, there must be a space before the attributes variable.

**❌ Bad:**

```twig
<div{{ attributes }}></div{{>
```

**✅ Good:**

```twig
<div {{ attributes }}></div>
```

**Note**: Even though Drupal core templates sometimes use `<div{{ attributes }}>`, this pattern is not allowed in Mercury theme components.

### No Inline Control Structures in Attributes

**Rule**: Never use inline Twig control structures (`{% if %}`, `{% for %}`, etc.) directly within HTML tag attributes. Always assign values to variables first.

**❌ Bad:**

```twig
<div class="something"{% if condition %} data-attr="value"{% endif %}>
```

**✅ Good:**

```twig
{% set data_attr = condition ? 'data-attr="value"' : '' %}
<div class="something" {{ data_attr }}></div>
```

Or better yet, use CVA or compute all attributes beforehand:

```twig
{% set additional_attrs = condition ? 'data-attr="value"' : '' %}
<div class="something" {{ additional_attrs }}></div>
```

## HTML Tag Structure

### No Split Opening/Closing Tags Across Conditionals

**Rule**: Never split opening and closing HTML tags across different conditional blocks. This is not static analysis friendly and reduces readability.

**❌ Bad:**

```twig
{% if url is not empty %}
  <a href="{{ url }}">
{% endif %}
  <p>Content</p>
{% if url %}
  </a>
{% endif %}
```

**✅ Good:**

```twig
{% if url is not empty %}
  <a href="{{ url }}">
    <p>
      Content
    </p>
  </a>
{% else %}
  <p>
    Content
  </p>
{% endif %}
```

Or use a wrapper approach:

```twig
{% if url is not empty %}
  <a href="{{ url }}" class="link-wrapper">
{% endif %}
  <p>Content</p>
{% if url is not empty %}
  </a>
{% endif %}
```

**Note**: The wrapper approach is acceptable when the content is the same, but prefer the first approach when possible.

### No Dynamic Tag Names

**Rule**: Never use dynamic tag names. Always use explicit HTML tags.

**❌ Bad:**

```twig
<h{{ heading_level }}>Title</h{{ heading_level }}>
```

**✅ Good:**

```twig
{% if heading_level == 1 %}
  <h1>Title</h1>
{% elseif heading_level == 2 %}
  <h2>Title</h2>
{% elseif heading_level == 3 %}
  <h3>Title</h3>
{% else %}
  <h2>Title</h2>
{% endif %}
```

**Note**: While the variable approach works, the explicit conditional is preferred for better static analysis and readability.

## Summary

1. **Always use CVA for conditional classes** - Never use inline conditionals in HTML attributes
2. **Use yes/no strings for CVA variant keys** - `yes`/`no`, not `true`/`false` or `'true'`/`'false'`
3. **Format CVA definitions and calls** - Use multi-line format for readability
4. **Compute values before HTML** - All conditionals should be resolved before being used in HTML attributes
5. **Attributes need space** - Always use `<div {{ attributes }}>` not `<div{{ attributes }}>`
6. **No inline control structures in attributes** - Assign values to variables first
7. **No split tags across conditionals** - Keep opening and closing tags together
8. **No dynamic tag names** - Use explicit HTML tags or proper conditionals
