import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import type { Block } from '@/lib/types';
import { blockAPI } from '@/lib/api';

interface HeadingBlockProps {
  block: Block;
  level: 1 | 2 | 3;
  onUpdate?: (block: Block) => void;
  onEnter?: () => void;
  onBackspace?: () => void;
}

export const HeadingBlock: React.FC<HeadingBlockProps> = ({
  block,
  level,
  onUpdate,
  onEnter,
  onBackspace,
}) => {
  const placeholders: Record<number, string> = {
    1: 'Heading 1',
    2: 'Heading 2',
    3: 'Heading 3',
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        paragraph: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: placeholders[level],
      }),
    ],
    content: block.content || '',
    editorProps: {
      attributes: {
        class: 'outline-none',
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
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

  // Set the heading level
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.commands.setHeading({ level });
    }
  }, [editor, level]);

  const handleUpdate = async (content: any) => {
    try {
      const updatedBlock = await blockAPI.update(block.id, { content });
      onUpdate?.(updatedBlock);
    } catch (error) {
      console.error('Failed to update block:', error);
    }
  };

  const fontSizes: Record<number, string> = {
    1: 'text-4xl',
    2: 'text-2xl',
    3: 'text-xl',
  };

  return (
    <div className="group relative">
      <div className={`${fontSizes[level]} font-bold min-h-[40px]`}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
