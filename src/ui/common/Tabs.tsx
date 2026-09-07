import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface TabDef {
  id: string;
  title: ReactNode;
  content: ReactNode;
  closeable?: boolean;
}

/**
 * Minimal tab set replacing the react-tabs dependency, keeping the ported tab
 * styling. The first tab is the overview; per-track editor tabs are opened and
 * closed dynamically.
 */
export function Tabs({
  tabs,
  onClose,
}: {
  tabs: TabDef[];
  onClose?: (id: string) => void;
}) {
  const [selected, setSelected] = useState(tabs[0]?.id);
  const knownIds = useRef(new Set(tabs.map((t) => t.id)));

  useEffect(() => {
    // Focus a newly opened tab; otherwise fall back to the first tab if the
    // selected one was closed.
    const opened = tabs.find((t) => !knownIds.current.has(t.id));
    knownIds.current = new Set(tabs.map((t) => t.id));
    if (opened) setSelected(opened.id);
    else if (!tabs.some((t) => t.id === selected)) setSelected(tabs[0]?.id);
  }, [tabs, selected]);

  const active = tabs.find((t) => t.id === selected) ?? tabs[0];

  return (
    <div>
      <div className="tabs__list" role="tablist">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            role="tab"
            aria-selected={tab.id === active?.id}
            className={
              'tabs__tab' +
              (tab.id === active?.id ? ' tabs__tab--selected' : '')
            }
            onClick={() => setSelected(tab.id)}
          >
            {tab.title}
            {tab.closeable && (
              <button
                className="track-button"
                aria-label="Close tab"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose?.(tab.id);
                }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>
        ))}
      </div>
      <div role="tabpanel">{active?.content}</div>
    </div>
  );
}
