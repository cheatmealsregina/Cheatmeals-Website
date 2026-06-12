/* @ds-bundle: {"format":3,"namespace":"CheatMealsDesignSystem_e4e564","components":[{"name":"Badge","sourcePath":"components/badges/Badge.jsx"},{"name":"Pennant","sourcePath":"components/badges/Pennant.jsx"},{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"HoursTable","sourcePath":"components/content/HoursTable.jsx"},{"name":"SocialButtons","sourcePath":"components/content/SocialButtons.jsx"},{"name":"TeamCard","sourcePath":"components/content/TeamCard.jsx"},{"name":"EditorRow","sourcePath":"components/feedback/EditorRow.jsx"},{"name":"Modal","sourcePath":"components/feedback/Modal.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Dropzone","sourcePath":"components/forms/Dropzone.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"PriceInput","sourcePath":"components/forms/PriceInput.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"Toggle","sourcePath":"components/forms/Toggle.jsx"},{"name":"Icon","sourcePath":"components/icons/Icon.jsx"},{"name":"ICON_NAMES","sourcePath":"components/icons/Icon.jsx"},{"name":"MenuItemCard","sourcePath":"components/menu/MenuItemCard.jsx"},{"name":"SectionHeader","sourcePath":"components/menu/SectionHeader.jsx"},{"name":"Tabs","sourcePath":"components/menu/Tabs.jsx"},{"name":"AnnouncementBar","sourcePath":"components/navigation/AnnouncementBar.jsx"},{"name":"CallBar","sourcePath":"components/navigation/CallBar.jsx"},{"name":"Footer","sourcePath":"components/navigation/Footer.jsx"},{"name":"NavBar","sourcePath":"components/navigation/NavBar.jsx"}],"sourceHashes":{"components/badges/Badge.jsx":"100e89bed3f8","components/badges/Pennant.jsx":"df9cea572c2c","components/buttons/Button.jsx":"c3b7576597dd","components/content/HoursTable.jsx":"1e6e3f7e50a3","components/content/SocialButtons.jsx":"52ca35c59f1c","components/content/TeamCard.jsx":"7f03b6d114a1","components/feedback/EditorRow.jsx":"6217985a56f7","components/feedback/Modal.jsx":"0d48977559f6","components/feedback/Toast.jsx":"220003c6d43d","components/forms/Dropzone.jsx":"39b017733aae","components/forms/Input.jsx":"544e9de7be95","components/forms/PriceInput.jsx":"19843c813bd7","components/forms/Select.jsx":"ee34ed4b80d0","components/forms/Textarea.jsx":"ff401d972c7e","components/forms/Toggle.jsx":"f676f5cfb2dc","components/icons/Icon.jsx":"4dda4affc56a","components/menu/MenuItemCard.jsx":"46956fab843b","components/menu/SectionHeader.jsx":"1ae778428214","components/menu/Tabs.jsx":"da1e314263a5","components/navigation/AnnouncementBar.jsx":"467368c12c38","components/navigation/CallBar.jsx":"aee3ce8d7844","components/navigation/Footer.jsx":"962c41714f2b","components/navigation/NavBar.jsx":"4d37c74e3fc0","styleguide-assets/styleguide.js":"4e2130eb3af8"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.CheatMealsDesignSystem_e4e564 = window.CheatMealsDesignSystem_e4e564 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/badges/Pennant.jsx
try { (() => {
function Pennant({
  tone = "red",
  children,
  className
}) {
  const cls = ["cm-pennant", tone === "ink" ? "cm-pennant--ink" : null, className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("span", {
    className: cls
  }, children);
}
Object.assign(__ds_scope, { Pennant });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/badges/Pennant.jsx", error: String((e && e.message) || e) }); }

// components/content/HoursTable.jsx
try { (() => {
const DEFAULT_HOURS = [{
  day: "Monday",
  time: "Closed"
}, {
  day: "Tuesday – Thursday",
  time: "11:00 AM – 9:00 PM"
}, {
  day: "Friday – Saturday",
  time: "11:00 AM – 11:00 PM"
}, {
  day: "Sunday",
  time: "12:00 PM – 8:00 PM"
}];
function HoursTable({
  hours = DEFAULT_HOURS,
  today,
  className
}) {
  return /*#__PURE__*/React.createElement("table", {
    className: ["cm-hours", className].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement("tbody", null, hours.map(h => /*#__PURE__*/React.createElement("tr", {
    key: h.day,
    className: h.day === today ? "cm-hours--today" : undefined
  }, /*#__PURE__*/React.createElement("td", null, h.day), /*#__PURE__*/React.createElement("td", null, h.time)))));
}
Object.assign(__ds_scope, { HoursTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/HoursTable.jsx", error: String((e && e.message) || e) }); }

// components/forms/PriceInput.jsx
try { (() => {
let priceAutoId = 0;

/* CAD price input — $ prefix, formats to $X.XX on blur. */
function PriceInput({
  label = "Price",
  value,
  onChange,
  id,
  error,
  className
}) {
  const inputId = React.useMemo(() => id || "cm-price-" + ++priceAutoId, [id]);
  const [text, setText] = React.useState(value != null ? Number(value).toFixed(2) : "");
  React.useEffect(() => {
    if (value != null) setText(Number(value).toFixed(2));
  }, [value]);
  const commit = () => {
    const n = parseFloat(text.replace(/[^0-9.]/g, ""));
    if (!isNaN(n)) {
      setText(n.toFixed(2));
      if (onChange) onChange(Math.round(n * 100) / 100);
    } else {
      setText("");
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: ["cm-field", className].filter(Boolean).join(" ")
  }, label ? /*#__PURE__*/React.createElement("label", {
    className: "cm-field__label",
    htmlFor: inputId
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    className: "cm-price"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cm-price__prefix",
    "aria-hidden": "true"
  }, "$"), /*#__PURE__*/React.createElement("input", {
    id: inputId,
    className: "cm-input" + (error ? " cm-input--error" : ""),
    inputMode: "decimal",
    placeholder: "0.00",
    value: text,
    onChange: e => setText(e.target.value),
    onBlur: commit,
    "aria-invalid": error ? "true" : undefined
  })), error ? /*#__PURE__*/React.createElement("span", {
    className: "cm-field__msg cm-field__msg--error"
  }, error) : null);
}
Object.assign(__ds_scope, { PriceInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/PriceInput.jsx", error: String((e && e.message) || e) }); }

// components/forms/Toggle.jsx
try { (() => {
function Toggle({
  label = "Available",
  checked,
  defaultChecked,
  onChange,
  className
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: ["cm-toggle", className].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: checked,
    defaultChecked: defaultChecked,
    onChange: e => onChange && onChange(e.target.checked)
  }), /*#__PURE__*/React.createElement("span", {
    className: "cm-toggle__track",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Toggle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Toggle.jsx", error: String((e && e.message) || e) }); }

// components/icons/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Custom CheatMeals icon set — line-art strokes matching the logo's
   stroke language. All stroke-based, currentColor, 24px grid. */

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};
const ICONS = {
  phone: /*#__PURE__*/React.createElement("path", {
    d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
  }),
  check: /*#__PURE__*/React.createElement("path", {
    d: "M20 6 9 17l-5-5"
  }),
  close: /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  }),
  plus: /*#__PURE__*/React.createElement("path", {
    d: "M12 5v14M5 12h14"
  }),
  star: /*#__PURE__*/React.createElement("path", {
    d: "m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.26L7 14.14 2 9.27l6.91-1.01L12 2z"
  }),
  arrowRight: /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14M12 5l7 7-7 7"
  }),
  alert: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 8v4M12 16h.01"
  })),
  instagram: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "2",
    width: "20",
    height: "20",
    rx: "5"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M17.5 6.5h.01"
  })),
  whatsapp: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
    d: "M21 11.5a8.5 8.5 0 0 1-12.57 7.45L3 21l2.05-5.43A8.5 8.5 0 1 1 21 11.5Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 9.5c.6 2.4 2.6 4.4 5 5l1.3-1.3 2.2 1.1"
  })),
  drag: /*#__PURE__*/React.createElement("g", {
    fill: "currentColor",
    stroke: "none"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "5",
    r: "1.4"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "12",
    r: "1.4"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "19",
    r: "1.4"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "15",
    cy: "5",
    r: "1.4"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "15",
    cy: "12",
    r: "1.4"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "15",
    cy: "19",
    r: "1.4"
  })),
  camera: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
    d: "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "13",
    r: "3.5"
  })),
  clock: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 6v6l4 2"
  })),
  mapPin: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
    d: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "10",
    r: "3"
  })),
  chefHat: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
    d: "M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 17h12"
  })),
  chili: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
    d: "M17.5 6.5C19.5 6.5 21 8 21 10c0 5.5-6.5 10.5-13 10.5-2.5 0-5-1-5-2 8.5-1.5 11.5-6 12-10.5.15-1.3 1-1.5 2.5-1.5Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M17.5 6.5C17.5 4.5 18.5 3 20.5 3"
  })),
  flame: /*#__PURE__*/React.createElement("path", {
    d: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
  }),
  burger: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
    d: "M4 10a8 8 0 0 1 16 0Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 13.5h7.5l1.5 1.5 1.5-1.5H21"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 17h16v.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5Z"
  }), /*#__PURE__*/React.createElement("g", {
    fill: "currentColor",
    stroke: "none"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "7",
    r: "0.9"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12.5",
    cy: "6",
    r: "0.9"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "15.5",
    cy: "7.5",
    r: "0.9"
  })))
};
function Icon({
  name,
  size = 24,
  strokeWidth = 2,
  label,
  className,
  style
}) {
  const glyph = ICONS[name];
  if (!glyph) return null;
  return /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: size,
    height: size
  }, S, {
    strokeWidth: strokeWidth,
    "aria-hidden": label ? undefined : true,
    role: label ? "img" : undefined,
    "aria-label": label,
    className: className,
    style: style
  }), glyph);
}
const ICON_NAMES = Object.keys(ICONS);
Object.assign(__ds_scope, { Icon, ICON_NAMES });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/Icon.jsx", error: String((e && e.message) || e) }); }

// components/badges/Badge.jsx
try { (() => {
function Badge({
  kind = "diet",
  level = 1,
  children,
  className
}) {
  const cls = ["cm-badge", `cm-badge--${kind}`, className].filter(Boolean).join(" ");
  let icons = null;
  if (kind === "pick") icons = /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chefHat",
    size: 13
  });
  if (kind === "spicy") icons = Array.from({
    length: Math.min(level, 2)
  }).map((_, i) => /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    key: i,
    name: "chili",
    size: 13
  }));
  return /*#__PURE__*/React.createElement("span", {
    className: cls
  }, icons, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/badges/Badge.jsx", error: String((e && e.message) || e) }); }

// components/buttons/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Button({
  variant = "primary",
  size = "md",
  icon,
  href,
  disabled = false,
  children,
  className,
  ...rest
}) {
  const cls = ["cm-btn", `cm-btn--${variant}`, size !== "md" ? `cm-btn--${size}` : null, className].filter(Boolean).join(" ");
  const iconName = icon || (variant === "call" ? "phone" : null);
  const inner = /*#__PURE__*/React.createElement(React.Fragment, null, iconName ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconName,
    size: size === "sm" ? 14 : 18
  }) : null, children);
  if (href) {
    return /*#__PURE__*/React.createElement("a", _extends({
      className: cls,
      href: disabled ? undefined : href,
      "aria-disabled": disabled || undefined
    }, rest), inner);
  }
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: cls,
    disabled: disabled
  }, rest), inner);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/Button.jsx", error: String((e && e.message) || e) }); }

// components/content/SocialButtons.jsx
try { (() => {
function SocialButtons({
  instagram = "https://instagram.com/cheatmeals",
  whatsapp,
  phone,
  className
}) {
  const items = [instagram ? {
    name: "instagram",
    href: instagram,
    label: "Instagram"
  } : null, whatsapp ? {
    name: "whatsapp",
    href: whatsapp,
    label: "WhatsApp"
  } : null, phone ? {
    name: "phone",
    href: "tel:" + phone.replace(/[^+\d]/g, ""),
    label: "Call us"
  } : null].filter(Boolean);
  return /*#__PURE__*/React.createElement("div", {
    className: ["cm-social", className].filter(Boolean).join(" ")
  }, items.map(it => /*#__PURE__*/React.createElement("a", {
    key: it.name,
    className: "cm-social__btn",
    href: it.href,
    "aria-label": it.label
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: it.name,
    size: 20
  }))));
}
Object.assign(__ds_scope, { SocialButtons });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/SocialButtons.jsx", error: String((e && e.message) || e) }); }

// components/content/TeamCard.jsx
try { (() => {
function TeamCard({
  name,
  role,
  bio,
  photo,
  className
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: ["cm-team-card", className].filter(Boolean).join(" ")
  }, photo ? /*#__PURE__*/React.createElement("img", {
    className: "cm-team-card__photo",
    src: photo,
    alt: name
  }) : /*#__PURE__*/React.createElement("div", {
    className: "cm-team-card__photo cm-halftone",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chefHat",
    size: 40,
    strokeWidth: 1.5
  })), /*#__PURE__*/React.createElement("p", {
    className: "cm-team-card__name"
  }, name), role ? /*#__PURE__*/React.createElement("span", {
    className: "cm-team-card__role"
  }, role) : null, bio ? /*#__PURE__*/React.createElement("p", {
    className: "cm-team-card__bio"
  }, bio) : null);
}
Object.assign(__ds_scope, { TeamCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/TeamCard.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EditorRow.jsx
try { (() => {
/* Admin menu-editor row — drag handle, name, price, availability toggle. */
function EditorRow({
  name,
  price,
  available = true,
  onToggle,
  onEdit,
  dragging = false,
  className
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: ["cm-editor-row", dragging ? "cm-editor-row--dragging" : null, className].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement("span", {
    className: "cm-editor-row__drag",
    "aria-label": "Drag to reorder",
    role: "button",
    tabIndex: 0
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "drag",
    size: 18
  })), /*#__PURE__*/React.createElement("span", {
    className: "cm-editor-row__name"
  }, name), /*#__PURE__*/React.createElement("span", {
    className: "cm-editor-row__price"
  }, typeof price === "number" ? "$" + price.toFixed(2) : price), /*#__PURE__*/React.createElement(__ds_scope.Toggle, {
    label: "",
    checked: available,
    onChange: onToggle
  }), onEdit ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "cm-btn cm-btn--ghost cm-btn--sm",
    onClick: onEdit
  }, "Edit") : null);
}
Object.assign(__ds_scope, { EditorRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EditorRow.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Modal.jsx
try { (() => {
function Modal({
  open = false,
  title,
  children,
  actions,
  onClose,
  className
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "cm-modal-backdrop",
    onClick: e => {
      if (e.target === e.currentTarget && onClose) onClose();
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: ["cm-modal", className].filter(Boolean).join(" "),
    role: "dialog",
    "aria-modal": "true",
    "aria-label": typeof title === "string" ? title : undefined
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "start",
      gap: "var(--space-4)"
    }
  }, title ? /*#__PURE__*/React.createElement("h2", {
    className: "cm-modal__title"
  }, title) : null, onClose ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "cm-btn cm-btn--ghost cm-btn--sm",
    "aria-label": "Close",
    onClick: onClose
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "close",
    size: 18
  })) : null), /*#__PURE__*/React.createElement("div", null, children), actions ? /*#__PURE__*/React.createElement("div", {
    className: "cm-modal__actions"
  }, actions) : null));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Modal.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function Toast({
  icon = "check",
  children,
  className
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: ["cm-toast", className].filter(Boolean).join(" "),
    role: "status"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cm-toast__icon"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18
  })), children);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/forms/Dropzone.jsx
try { (() => {
function Dropzone({
  label = "Photo",
  hint = "Drag a photo here, or click to browse",
  onFiles,
  className
}) {
  const [over, setOver] = React.useState(false);
  const fileRef = React.useRef(null);
  return /*#__PURE__*/React.createElement("div", {
    className: ["cm-field", className].filter(Boolean).join(" ")
  }, label ? /*#__PURE__*/React.createElement("span", {
    className: "cm-field__label"
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    className: "cm-dropzone" + (over ? " cm-dropzone--over" : ""),
    role: "button",
    tabIndex: 0,
    onClick: () => fileRef.current && fileRef.current.click(),
    onKeyDown: e => {
      if (e.key === "Enter" || e.key === " ") fileRef.current && fileRef.current.click();
    },
    onDragOver: e => {
      e.preventDefault();
      setOver(true);
    },
    onDragLeave: () => setOver(false),
    onDrop: e => {
      e.preventDefault();
      setOver(false);
      if (onFiles) onFiles([...e.dataTransfer.files]);
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "camera",
    size: 28,
    strokeWidth: 1.5
  }), /*#__PURE__*/React.createElement("span", null, hint)), /*#__PURE__*/React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: "image/*",
    hidden: true,
    onChange: e => onFiles && onFiles([...e.target.files])
  }));
}
Object.assign(__ds_scope, { Dropzone });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Dropzone.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
let inputAutoId = 0;
function Input({
  label,
  hint,
  error,
  id,
  type = "text",
  className,
  ...rest
}) {
  const inputId = React.useMemo(() => id || "cm-input-" + ++inputAutoId, [id]);
  return /*#__PURE__*/React.createElement("div", {
    className: ["cm-field", className].filter(Boolean).join(" ")
  }, label ? /*#__PURE__*/React.createElement("label", {
    className: "cm-field__label",
    htmlFor: inputId
  }, label) : null, /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    type: type,
    className: "cm-input" + (error ? " cm-input--error" : ""),
    "aria-invalid": error ? "true" : undefined
  }, rest)), error ? /*#__PURE__*/React.createElement("span", {
    className: "cm-field__msg cm-field__msg--error"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "alert",
    size: 14
  }), error) : hint ? /*#__PURE__*/React.createElement("span", {
    className: "cm-field__msg"
  }, hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
let selectAutoId = 0;
function Select({
  label,
  options = [],
  id,
  className,
  ...rest
}) {
  const inputId = React.useMemo(() => id || "cm-select-" + ++selectAutoId, [id]);
  return /*#__PURE__*/React.createElement("div", {
    className: ["cm-field", className].filter(Boolean).join(" ")
  }, label ? /*#__PURE__*/React.createElement("label", {
    className: "cm-field__label",
    htmlFor: inputId
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    className: "cm-select"
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: inputId,
    className: "cm-input"
  }, rest), options.map(o => typeof o === "string" ? /*#__PURE__*/React.createElement("option", {
    key: o,
    value: o
  }, o) : /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label))), /*#__PURE__*/React.createElement("span", {
    className: "cm-select__chevron"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrowRight",
    size: 16,
    style: {
      transform: "rotate(90deg)"
    }
  }))));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
let textareaAutoId = 0;
function Textarea({
  label,
  hint,
  error,
  id,
  className,
  ...rest
}) {
  const inputId = React.useMemo(() => id || "cm-textarea-" + ++textareaAutoId, [id]);
  return /*#__PURE__*/React.createElement("div", {
    className: ["cm-field", className].filter(Boolean).join(" ")
  }, label ? /*#__PURE__*/React.createElement("label", {
    className: "cm-field__label",
    htmlFor: inputId
  }, label) : null, /*#__PURE__*/React.createElement("textarea", _extends({
    id: inputId,
    className: "cm-input" + (error ? " cm-input--error" : ""),
    "aria-invalid": error ? "true" : undefined
  }, rest)), error ? /*#__PURE__*/React.createElement("span", {
    className: "cm-field__msg cm-field__msg--error"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "alert",
    size: 14
  }), error) : hint ? /*#__PURE__*/React.createElement("span", {
    className: "cm-field__msg"
  }, hint) : null);
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/menu/MenuItemCard.jsx
try { (() => {
function formatPrice(price) {
  if (typeof price === "number") return "$" + price.toFixed(2);
  return price;
}
function MenuItemCard({
  name,
  price,
  description,
  image,
  showMedia = true,
  badges = [],
  unavailable = false,
  className
}) {
  const cls = ["cm-menu-card", unavailable ? "cm-menu-card--unavailable" : null, className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("article", {
    className: cls
  }, showMedia ? /*#__PURE__*/React.createElement("div", {
    className: "cm-menu-card__media" + (image ? "" : " cm-halftone")
  }, image ? /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: name
  }) : /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "burger",
    size: 48,
    strokeWidth: 1.5
  })) : null, /*#__PURE__*/React.createElement("div", {
    className: "cm-menu-card__body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cm-menu-card__row"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "cm-menu-card__name"
  }, name), /*#__PURE__*/React.createElement("span", {
    className: "cm-menu-card__price"
  }, formatPrice(price))), description ? /*#__PURE__*/React.createElement("p", {
    className: "cm-menu-card__desc"
  }, description) : null, badges.length > 0 ? /*#__PURE__*/React.createElement("div", {
    className: "cm-menu-card__badges"
  }, badges.map((b, i) => /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    key: i,
    kind: b.kind,
    level: b.level
  }, b.label))) : null, unavailable ? /*#__PURE__*/React.createElement("span", {
    className: "cm-label"
  }, "Unavailable") : null));
}
Object.assign(__ds_scope, { MenuItemCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/menu/MenuItemCard.jsx", error: String((e && e.message) || e) }); }

// components/menu/SectionHeader.jsx
try { (() => {
/* "the ★ ALOO ★ BURGER" — display + script combo with dotted rules and stars,
   exactly the printed-menu language. */

function renderTitle(title, accent) {
  if (!accent) return title;
  const i = title.toUpperCase().indexOf(accent.toUpperCase());
  if (i === -1) return title;
  return /*#__PURE__*/React.createElement(React.Fragment, null, title.slice(0, i), /*#__PURE__*/React.createElement("span", {
    className: "cm-section-header__key"
  }, title.slice(i, i + accent.length)), title.slice(i + accent.length));
}
function SectionHeader({
  title,
  accent,
  script,
  scriptPosition = "before",
  kicker,
  stars = true,
  rules = true,
  as = "h2",
  className
}) {
  const H = as;
  const scriptEl = script ? /*#__PURE__*/React.createElement("span", {
    className: "cm-script"
  }, script) : null;
  return /*#__PURE__*/React.createElement("header", {
    className: ["cm-section-header", className].filter(Boolean).join(" ")
  }, rules ? /*#__PURE__*/React.createElement("hr", {
    className: "cm-section-header__rule"
  }) : null, kicker ? /*#__PURE__*/React.createElement("span", {
    className: "cm-label cm-section-header__kicker"
  }, kicker) : null, /*#__PURE__*/React.createElement(H, {
    className: "cm-section-header__title"
  }, stars ? /*#__PURE__*/React.createElement("span", {
    className: "cm-section-header__star",
    "aria-hidden": "true"
  }, "★") : null, scriptPosition === "before" ? scriptEl : null, /*#__PURE__*/React.createElement("span", null, renderTitle(title, accent)), scriptPosition === "after" ? scriptEl : null, stars ? /*#__PURE__*/React.createElement("span", {
    className: "cm-section-header__star",
    "aria-hidden": "true"
  }, "★") : null), rules ? /*#__PURE__*/React.createElement("hr", {
    className: "cm-section-header__rule"
  }) : null);
}
Object.assign(__ds_scope, { SectionHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/menu/SectionHeader.jsx", error: String((e && e.message) || e) }); }

// components/menu/Tabs.jsx
try { (() => {
function Tabs({
  items,
  active = 0,
  onChange,
  sticky = false,
  className
}) {
  return /*#__PURE__*/React.createElement("nav", {
    className: ["cm-tabs", sticky ? "cm-tabs--sticky" : null, className].filter(Boolean).join(" "),
    "aria-label": "Menu categories"
  }, items.map((item, i) => /*#__PURE__*/React.createElement("button", {
    key: item,
    type: "button",
    className: "cm-tab" + (i === active ? " cm-tab--active" : ""),
    "aria-current": i === active ? "true" : undefined,
    onClick: () => onChange && onChange(i, item)
  }, item)));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/menu/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/navigation/AnnouncementBar.jsx
try { (() => {
function AnnouncementBar({
  children,
  dismissible = true,
  onDismiss,
  className
}) {
  const [hidden, setHidden] = React.useState(false);
  if (hidden) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: ["cm-announce", className].filter(Boolean).join(" "),
    role: "status"
  }, /*#__PURE__*/React.createElement("span", null, children), dismissible ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "cm-announce__close",
    "aria-label": "Dismiss announcement",
    onClick: () => {
      setHidden(true);
      if (onDismiss) onDismiss();
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "close",
    size: 16
  })) : null);
}
Object.assign(__ds_scope, { AnnouncementBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/AnnouncementBar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/CallBar.jsx
try { (() => {
/* Mobile sticky call bar — pin to the bottom of the viewport/scroll container. */
function CallBar({
  phone = "(306) 555-0123",
  label = "Call to Order",
  className
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: ["cm-callbar", className].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "call",
    size: "lg",
    href: "tel:" + phone.replace(/[^+\d]/g, "")
  }, label, " \xB7 ", phone));
}
Object.assign(__ds_scope, { CallBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/CallBar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Footer.jsx
try { (() => {
function Footer({
  logoSrc = "assets/logos/cheatmeals-primary-inverse.svg",
  address = "123 Albert St, Regina, SK",
  phone = "(306) 555-0123",
  note,
  socials = true,
  className
}) {
  return /*#__PURE__*/React.createElement("footer", {
    "data-theme": "dark",
    className: ["cm-footer", className].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement("img", {
    src: logoSrc,
    alt: "CheatMeals — Home of Indian Burgers"
  }), /*#__PURE__*/React.createElement("div", {
    className: "cm-footer__meta"
  }, /*#__PURE__*/React.createElement("span", null, address), /*#__PURE__*/React.createElement("a", {
    href: "tel:" + phone.replace(/[^+\d]/g, ""),
    style: {
      color: "inherit"
    }
  }, phone), note ? /*#__PURE__*/React.createElement("span", null, note) : null), socials ? /*#__PURE__*/React.createElement(__ds_scope.SocialButtons, null) : null);
}
Object.assign(__ds_scope, { Footer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Footer.jsx", error: String((e && e.message) || e) }); }

// components/navigation/NavBar.jsx
try { (() => {
function NavBar({
  logoSrc = "assets/logos/cheatmeals-horizontal.svg",
  links = [],
  phone,
  className
}) {
  return /*#__PURE__*/React.createElement("header", {
    className: ["cm-nav", className].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement("a", {
    className: "cm-nav__logo",
    href: "#",
    "aria-label": "CheatMeals home"
  }, /*#__PURE__*/React.createElement("img", {
    src: logoSrc,
    alt: "CheatMeals — Home of Indian Burgers"
  })), /*#__PURE__*/React.createElement("nav", {
    className: "cm-nav__links",
    "aria-label": "Primary"
  }, links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l.label,
    className: "cm-nav__link" + (l.active ? " cm-nav__link--active" : ""),
    href: l.href || "#",
    "aria-current": l.active ? "page" : undefined
  }, l.label)), phone ? /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "call",
    size: "sm",
    href: "tel:" + phone.replace(/[^+\d]/g, "")
  }, phone) : null));
}
Object.assign(__ds_scope, { NavBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/NavBar.jsx", error: String((e && e.message) || e) }); }

// styleguide-assets/styleguide.js
try { (() => {
/* Style-guide interactivity: copy buttons, demo tabs, toggle, modal, toast, burger draw replay. */
(function () {
  // Copy buttons — injected into every snippet
  document.querySelectorAll(".sg-code pre").forEach(function (pre) {
    var btn = document.createElement("button");
    btn.className = "sg-copy";
    btn.type = "button";
    btn.textContent = "Copy";
    btn.addEventListener("click", function () {
      var code = pre.querySelector("code");
      navigator.clipboard.writeText(code ? code.textContent : pre.textContent).then(function () {
        btn.textContent = "Copied";
        setTimeout(function () {
          btn.textContent = "Copy";
        }, 1400);
      });
    });
    pre.appendChild(btn);
  });

  // Demo category tabs
  var tabs = document.querySelectorAll("#demo-tabs .cm-tab");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) {
        t.classList.remove("cm-tab--active");
        t.removeAttribute("aria-current");
      });
      tab.classList.add("cm-tab--active");
      tab.setAttribute("aria-current", "true");
    });
  });

  // Modal demo
  var modal = document.getElementById("demo-modal");
  var openBtn = document.getElementById("open-modal");
  if (modal && openBtn) {
    openBtn.addEventListener("click", function () {
      modal.hidden = false;
    });
    modal.addEventListener("click", function (e) {
      if (e.target === modal || e.target.closest("[data-close]")) modal.hidden = true;
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") modal.hidden = true;
    });
  }

  // Toast demo
  var toastBtn = document.getElementById("show-toast");
  var toast = document.getElementById("demo-toast");
  if (toastBtn && toast) {
    toastBtn.addEventListener("click", function () {
      toast.hidden = false;
      clearTimeout(toast._t);
      toast._t = setTimeout(function () {
        toast.hidden = true;
      }, 2200);
    });
  }

  // Announcement bar dismiss + restore
  var announce = document.getElementById("demo-announce");
  if (announce) {
    announce.querySelector(".cm-announce__close").addEventListener("click", function () {
      announce.style.display = "none";
      setTimeout(function () {
        announce.style.display = "";
      }, 2000);
    });
  }

  // Burger draw-in replay
  var demo = document.getElementById("burger-demo");
  var replay = document.getElementById("burger-replay");
  if (demo && replay) {
    replay.addEventListener("click", function () {
      demo.classList.remove("play");
      void demo.offsetWidth; // restart animation
      demo.classList.add("play");
    });
  }

  // Toggle demo label
  document.querySelectorAll("[data-toggle-label]").forEach(function (lbl) {
    var input = lbl.querySelector("input");
    var text = lbl.querySelector("[data-state]");
    if (input && text) {
      input.addEventListener("change", function () {
        text.textContent = input.checked ? "Available" : "Sold out today";
      });
    }
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "styleguide-assets/styleguide.js", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Pennant = __ds_scope.Pennant;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.HoursTable = __ds_scope.HoursTable;

__ds_ns.SocialButtons = __ds_scope.SocialButtons;

__ds_ns.TeamCard = __ds_scope.TeamCard;

__ds_ns.EditorRow = __ds_scope.EditorRow;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Dropzone = __ds_scope.Dropzone;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.PriceInput = __ds_scope.PriceInput;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.Toggle = __ds_scope.Toggle;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.ICON_NAMES = __ds_scope.ICON_NAMES;

__ds_ns.MenuItemCard = __ds_scope.MenuItemCard;

__ds_ns.SectionHeader = __ds_scope.SectionHeader;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.AnnouncementBar = __ds_scope.AnnouncementBar;

__ds_ns.CallBar = __ds_scope.CallBar;

__ds_ns.Footer = __ds_scope.Footer;

__ds_ns.NavBar = __ds_scope.NavBar;

})();
