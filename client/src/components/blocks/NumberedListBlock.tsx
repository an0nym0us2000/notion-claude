import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import type { Block } from '@/lib/types';
import { blockAPI } from '@/lib/api';

interface NumberedListBlockProps {
  block: Block;
  onUpdate?: (block: Block) => void;
  onEnter?: () => void;
  onBackspace?: () => void;
}

export const NumberedListBlock: React.FC<NumberedListBlockProps> = ({
  block,
  onUpdate,
  onEnter,
  onBackspace,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal pl-6',
          },
        },
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Underline,
      Placeholder.configure({
        placeholder: 'List item',
      }),
    ],
    content: block.content || '',
    editorProps: {
      attributes: {
        class: 'outline-none',
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && view.state.doc.textContent === '') {
          event.preventDefault();
          onEnter?.();
          return true;
        }
        if (event.key === 'Backspace' && view.state.doc.textContent === '') {
          event.preventDefault();
          onBackspace?.();
          return true;
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
      <div className="min-h-[24px] flex items-start">
        <span className="mr-2 text-notion-text-secondary">1.</span>
        <div className="flex-1">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};
