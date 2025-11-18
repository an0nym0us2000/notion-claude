import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { MentionList, MentionListRef } from '@/components/editor/MentionList';
import { api } from '@/lib/api';

interface SuggestionProps {
  query: string;
  workspaceId: string;
}

export const mentionSuggestion = (workspaceId: string) => ({
  items: async ({ query }: SuggestionProps) => {
    try {
      // Search for pages in the workspace
      const response = await api.get('/api/search/pages', {
        params: {
          workspaceId,
          query: query || '',
          limit: 10,
        },
      });

      const pages = response.data.data.pages || [];

      return pages.map((page: any) => ({
        id: page.id,
        label: page.title || 'Untitled',
        icon: page.icon,
      }));
    } catch (error) {
      console.error('Error searching pages for mention:', error);
      return [];
    }
  },

  render: () => {
    let component: ReactRenderer<MentionListRef> | null = null;
    let popup: TippyInstance[] | null = null;

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });
      },

      onUpdate(props: any) {
        component?.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup?.[0]?.setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          popup?.[0]?.hide();
          return true;
        }

        return component?.ref?.onKeyDown(props) || false;
      },

      onExit() {
        popup?.[0]?.destroy();
        component?.destroy();
      },
    };
  },
});
