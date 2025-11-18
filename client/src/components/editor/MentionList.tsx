import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface MentionListProps {
  items: Array<{ id: string; label: string; icon?: string }>;
  command: (item: { id: string; label: string }) => void;
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
  (props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
      const item = props.items[index];

      if (item) {
        props.command(item);
      }
    };

    const upHandler = () => {
      setSelectedIndex(
        (selectedIndex + props.items.length - 1) % props.items.length
      );
    };

    const downHandler = () => {
      setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
      selectItem(selectedIndex);
    };

    useEffect(() => {
      setSelectedIndex(0);
    }, [props.items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') {
          upHandler();
          return true;
        }

        if (event.key === 'ArrowDown') {
          downHandler();
          return true;
        }

        if (event.key === 'Enter') {
          enterHandler();
          return true;
        }

        return false;
      },
    }));

    if (props.items.length === 0) {
      return (
        <div className="bg-white border border-notion-border rounded-lg shadow-lg p-2 max-w-xs">
          <div className="px-3 py-2 text-sm text-notion-text-secondary">
            No pages found
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-notion-border rounded-lg shadow-lg p-1 max-w-xs max-h-64 overflow-y-auto">
        {props.items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => selectItem(index)}
            onMouseEnter={() => setSelectedIndex(index)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left text-sm ${
              index === selectedIndex
                ? 'bg-blue-50 text-notion-blue'
                : 'hover:bg-notion-hover'
            }`}
          >
            <span className="text-lg">{item.icon || '📄'}</span>
            <span className="flex-1 truncate">{item.label}</span>
          </button>
        ))}
      </div>
    );
  }
);

MentionList.displayName = 'MentionList';
