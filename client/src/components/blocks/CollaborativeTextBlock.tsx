import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import * as Y from 'yjs';
import type { Block } from '@/lib/types';
import { YjsProvider } from '@/lib/yjsProvider';
import { useAuthStore } from '@/stores/authStore';

interface CollaborativeTextBlockProps {
  block: Block;
  ydoc: Y.Doc;
  provider: YjsProvider;
  onEnter?: () => void;
  onBackspace?: () => void;
  onSlash?: () => void;
}

// Generate a random color for the user cursor
const getUserColor = (userId: string) => {
  const colors = [
    '#958DF1',
    '#F98181',
    '#FBBC88',
    '#FAF594',
    '#70CFF8',
    '#94FADB',
    '#B9F18D',
  ];
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export const CollaborativeTextBlock: React.FC<CollaborativeTextBlockProps> = ({
  block,
  ydoc,
  provider,
  onEnter,
  onBackspace,
  onSlash,
}) => {
  const { user } = useAuthStore();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        history: false, // Disable history when using collaboration
      }),
      Collaboration.configure({
        document: ydoc,
        field: `block-${block.id}`, // Each block has its own field in the Y.Doc
      }),
      CollaborationCursor.configure({
        provider: provider as any,
        user: {
          name: user?.name || user?.email || 'Anonymous',
          color: getUserColor(user?.id || 'anonymous'),
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands...",
      }),
    ],
    editorProps: {
      attributes: {
        class: 'outline-none',
      },
      handleKeyDown: (view, event) => {
        // Handle Enter key
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          onEnter?.();
          return true;
        }

        // Handle Backspace on empty block
        if (event.key === 'Backspace' && view.state.doc.textContent === '') {
          event.preventDefault();
          onBackspace?.();
          return true;
        }

        // Handle slash for command menu
        if (event.key === '/' && view.state.doc.textContent === '') {
          onSlash?.();
        }

        return false;
      },
    },
  });

  // Update awareness when cursor moves
  useEffect(() => {
    if (!editor) return;

    const updateCursor = () => {
      const { from, to } = editor.state.selection;
      provider.setAwarenessField('cursor', { from, to });
    };

    editor.on('selectionUpdate', updateCursor);

    return () => {
      editor.off('selectionUpdate', updateCursor);
    };
  }, [editor, provider]);

  return (
    <div className="group relative">
      <div className="min-h-[24px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
