import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import type { Block } from '@/lib/types';
import { blockAPI } from '@/lib/api';

interface TodoBlockProps {
  block: Block;
  onUpdate?: (block: Block) => void;
  onEnter?: () => void;
  onBackspace?: () => void;
}

export const TodoBlock: React.FC<TodoBlockProps> = ({
  block,
  onUpdate,
  onEnter,
  onBackspace,
}) => {
  const [checked, setChecked] = React.useState(block.properties?.checked || false);

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
      TaskList,
      TaskItem.configure({
        nested: false,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Underline,
      Placeholder.configure({
        placeholder: 'To-do',
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
      handleUpdate(content, checked);
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

  const handleUpdate = async (content: any, isChecked: boolean) => {
    try {
      const updatedBlock = await blockAPI.update(block.id, {
        content,
        properties: { checked: isChecked },
      });
      onUpdate?.(updatedBlock);
    } catch (error) {
      console.error('Failed to update block:', error);
    }
  };

  const handleCheckboxChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setChecked(isChecked);
    const content = editor?.getJSON();
    if (content) {
      await handleUpdate(content, isChecked);
    }
  };

  return (
    <div className="group relative">
      <div className="min-h-[24px] flex items-start gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleCheckboxChange}
          className="mt-1 w-4 h-4 rounded border-notion-border text-notion-blue focus:ring-notion-blue cursor-pointer"
        />
        <div className={`flex-1 ${checked ? 'line-through text-notion-text-secondary' : ''}`}>
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};
