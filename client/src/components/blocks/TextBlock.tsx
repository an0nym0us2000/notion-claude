import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { Block } from '@/lib/types';
import { blockAPI } from '@/lib/api';

interface TextBlockProps {
  block: Block;
  onUpdate?: (block: Block) => void;
}

export const TextBlock: React.FC<TextBlockProps> = ({ block, onUpdate }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: block.content || '',
    editorProps: {
      attributes: {
        class: 'outline-none',
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
