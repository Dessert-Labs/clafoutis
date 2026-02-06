interface AccordionItemProps {
  title: string;
  content: string;
  open: boolean;
  onToggle: () => void;
  isLast?: boolean;
}

function AccordionItem({
  title,
  content,
  open,
  onToggle,
  isLast = false,
}: Readonly<AccordionItemProps>) {
  return (
    <div
      className={isLast ? "" : "border-b"}
      style={{ borderColor: "rgb(var(--colors-accordion-border))" }}
    >
      <button
        className="flex w-full items-center justify-between py-4 text-left text-sm font-medium transition-colors"
        style={{
          color: "rgb(var(--colors-accordion-trigger-text))",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor =
            "rgb(var(--colors-accordion-trigger-hover))";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor =
            "rgb(var(--colors-accordion-trigger-bg))";
        }}
        onClick={onToggle}
      >
        <span>{title}</span>
        <span
          className="transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
        >
          &#x25BE;
        </span>
      </button>
      {open && (
        <div
          className="pb-4 text-sm"
          style={{ color: "rgb(var(--colors-accordion-content-text))" }}
        >
          {content}
        </div>
      )}
    </div>
  );
}

interface AccordionPreviewProps {
  openItems: Set<number>;
  onToggleItem: (index: number) => void;
}

const accordionData = [
  {
    title: "What is a design token?",
    content:
      "A design token is a named value that represents a design decision. Tokens store visual attributes like colors, spacing, typography, and shadows in a format that can be consumed across platforms.",
  },
  {
    title: "How do semantic tokens work?",
    content:
      "Semantic tokens reference primitive values but carry meaning. For example, 'text.primary' references a specific shade from the color palette, abstracting the actual color from its purpose.",
  },
  {
    title: "Can I customize the defaults?",
    content:
      "Yes. The default token set provides a complete starting point, but you own the design system. Override any token value to match your brand, and the changes propagate through all components.",
  },
];

export function AccordionPreview({
  openItems,
  onToggleItem,
}: Readonly<AccordionPreviewProps>) {
  return (
    <div
      className="rounded-lg border"
      style={{ borderColor: "rgb(var(--colors-accordion-border))" }}
    >
      <div className="px-4">
        {accordionData.map((item, i) => (
          <AccordionItem
            key={item.title}
            title={item.title}
            content={item.content}
            open={openItems.has(i)}
            onToggle={() => onToggleItem(i)}
            isLast={i === accordionData.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
