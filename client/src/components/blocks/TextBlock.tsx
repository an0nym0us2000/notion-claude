import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import type { Block } from '@/lib/types';
import { blockAPI } from '@/lib/api';

interface TextBlockProps {
  block: Block;
  onUpdate?: (block: Block) => void;
  onEnter?: () => void;
  onBackspace?: () => void;
  onSlash?: () => void;
}

export const TextBlock: React.FC<TextBlockProps> = ({
  block,
  onUpdate,
  onEnter,
  onBackspace,
  onSlash,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Underline,
      Placeholder.configure({
        placeholder: "Type '/' for commands...",
      }),
    ],
    content: block.content || '',
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
    onUpdate: ({ editor }) => {
      const content = editor.getJSON();
      handleUpdate(content);
    },
  });

  useEffect(() => {
    if (editor && block.content) {
      const currentContent = editor.getJSON();
      if (JSON.stringify(currentContent) !== JSON.stringify(block.content)) {
        editor.commands.setContent(block.content);
      }
    }
  }, [block.content, editor]);

  const handleUpdate = async (content: any) => {
    try {
      const updatedBlock = await blockAPI.update(block.id, { content });
      onUpdate?.(updatedBlock);
    } catch (error) {
      console.error('Failed to update block:', error);
    }
  };

  return (
    <div className="group relative">
      <div className="min-h-[24px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
