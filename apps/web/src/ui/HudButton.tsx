"use client";

// Shared dark pill used by every floating button in the corners of the
// town view (identity Hud, GitHub/Discord, Population, Items,
// Suggestions, Exit). One component so every corner reads at the same
// height, weight, and padding — and a single place to tune them.
//
// Render as a button by default, or as an <a> when `href` is provided.

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "default" | "primary";

interface BaseProps {
  icon?: ReactNode;
  children: ReactNode;
  variant?: Variant;
  active?: boolean;
  className?: string;
}

type ButtonProps = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
    href?: undefined;
  };

type LinkProps = BaseProps & {
  href: string;
  target?: string;
  rel?: string;
  title?: string;
  "aria-label"?: string;
  onClick?: () => void;
};

export type HudButtonProps = ButtonProps | LinkProps;

const SHARED =
  "inline-flex h-7 items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase tracking-wider leading-none whitespace-nowrap";

function styleFor(variant: Variant, active: boolean): string {
  const press = "nb-card-dark is-clickable";
  if (variant === "primary") return `${press} text-ink`;
  return active
    ? `${press} text-paper bg-white/10`
    : `${press} text-paper`;
}

function inlineFor(variant: Variant): React.CSSProperties | undefined {
  // The primary variant overrides the card's dark fill with the
  // CORE-yellow callout colour. Keeping it in style rather than as a
  // CSS class avoids burning a one-off utility for the only place we
  // use the swap.
  if (variant === "primary") return { background: "#ffd75c" };
  return undefined;
}

export function HudButton(props: HudButtonProps) {
  const { icon, children, variant = "default", active = false, className = "" } = props;
  const classes = `${SHARED} ${styleFor(variant, active)} ${className}`.trim();
  const style = inlineFor(variant);

  if ("href" in props && props.href) {
    const { href, target, rel, title, onClick } = props;
    const ariaLabel = props["aria-label"];
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        title={title}
        aria-label={ariaLabel}
        onClick={onClick}
        className={classes}
        style={style}
      >
        {icon ? <span className="inline-flex shrink-0 items-center">{icon}</span> : null}
        <span className="truncate">{children}</span>
      </a>
    );
  }

  const {
    icon: _icon,
    children: _children,
    variant: _variant,
    active: _active,
    className: _className,
    ...rest
  } = props as ButtonProps;
  void _icon;
  void _children;
  void _variant;
  void _active;
  void _className;
  return (
    <button type="button" {...rest} className={classes} style={style}>
      {icon ? <span className="inline-flex shrink-0 items-center">{icon}</span> : null}
      <span className="truncate">{children}</span>
    </button>
  );
}
