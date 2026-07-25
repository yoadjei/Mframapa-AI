import { useStackChrome, stackTitlePad } from "../../hooks/useStackChrome.js";

/** Left-aligned page title that clears the fixed stack back button. */
export function StackTitle({ children, className = "", style = {}, as: Tag = "p" }) {
  const inStack = useStackChrome();
  return (
    <Tag
      className={className}
      style={{ ...style, paddingLeft: Math.max(style.paddingLeft ?? 0, stackTitlePad(inStack)) }}
    >
      {children}
    </Tag>
  );
}
