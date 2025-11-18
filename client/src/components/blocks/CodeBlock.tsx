import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import { common, createLowlight } from 'lowlight';
import type { Block } from '@/lib/types';
import { blockAPI } from '@/lib/api';

const lowlight = createLowlight(common);

interface CodeBlockProps {
  block: Block;
  onUpdate?: (block: Block) => void;
  onEnter?: () => void;
  onBackspace?: () => void;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  block,
  onUpdate,
  onEnter,
  onBackspace,
}) => {
  const [language, setLanguage] = React.useState(block.properties?.language || 'javascript');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        horizontalRule: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: language,
      }),
      Placeholder.configure({
        placeholder: 'Enter code...',
      }),
    ],
    content: block.content || '',
    editorProps: {
      attributes: {
        class: 'outline-none bg-notion-bg-secondary rounded-md p-4 font-mono text-sm',
      },
      handleKeyDown: (view, event) => {
        // Allow normal Enter in code blocks (don't create new block)
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
      handleUpdate(content, language);
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

  const handleUpdate = async (content: any, lang: string) => {
    try {
      const updatedBlock = await blockAPI.update(block.id, {
        content,
        properties: { language: lang },
      });
      onUpdate?.(updatedBlock);
    } catch (error) {
      console.error('Failed to update block:', error);
    }
  };

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    const content = editor?.getJSON();
    if (content) {
      await handleUpdate(content, newLang);
    }
  };

  return (
    <div className="group relative">
      <div className="mb-2">
        <select
          value={language}
          onChange={handleLanguageChange}
          className="text-xs px-2 py-1 bg-notion-bg-secondary border border-notion-border rounded"
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="css">CSS</option>
          <option value="html">HTML</option>
          <option value="json">JSON</option>
          <option value="markdown">Markdown</option>
          <option value="bash">Bash</option>
        </select>
      </div>
      <div className="min-h-[100px] bg-notion-bg-secondary rounded-md overflow-hidden">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
