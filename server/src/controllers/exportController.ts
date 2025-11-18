import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Convert blocks to Markdown
 */
const blocksToMarkdown = (blocks: any[], level: number = 0): string => {
  return blocks
    .map((block) => {
      const indent = '  '.repeat(level);
      let content = '';

      // Extract text from Tiptap JSON
      const text = block.content?.content?.[0]?.text || block.content?.text || '';

      switch (block.type) {
        case 'heading1':
          content = `# ${text}`;
          break;
        case 'heading2':
          content = `## ${text}`;
          break;
        case 'heading3':
          content = `### ${text}`;
          break;
        case 'bullet':
          content = `${indent}- ${text}`;
          break;
        case 'number':
          content = `${indent}1. ${text}`;
          break;
        case 'todo':
          const checked = block.properties?.checked ? 'x' : ' ';
          content = `${indent}- [${checked}] ${text}`;
          break;
        case 'quote':
          content = `> ${text}`;
          break;
        case 'code':
          const language = block.properties?.language || '';
          content = `\`\`\`${language}\n${text}\n\`\`\``;
          break;
        case 'divider':
          content = '---';
          break;
        case 'text':
        default:
          content = text || '';
          break;
      }

      return content;
    })
    .filter((line) => line)
    .join('\n\n');
};

/**
 * Convert blocks to HTML
 */
const blocksToHTML = (blocks: any[], level: number = 0): string => {
  return blocks
    .map((block) => {
      const text = block.content?.content?.[0]?.text || block.content?.text || '';

      switch (block.type) {
        case 'heading1':
          return `<h1>${text}</h1>`;
        case 'heading2':
          return `<h2>${text}</h2>`;
        case 'heading3':
          return `<h3>${text}</h3>`;
        case 'bullet':
          return `<li>${text}</li>`;
        case 'number':
          return `<li>${text}</li>`;
        case 'todo':
          const checked = block.properties?.checked ? 'checked' : '';
          return `<li><input type="checkbox" ${checked} disabled> ${text}</li>`;
        case 'quote':
          return `<blockquote>${text}</blockquote>`;
        case 'code':
          const language = block.properties?.language || '';
          return `<pre><code class="language-${language}">${text}</code></pre>`;
        case 'divider':
          return '<hr>';
        case 'text':
        default:
          return `<p>${text || '<br>'}</p>`;
      }
    })
    .join('\n');
};

/**
 * Export page to specified format
 */
export const exportPage = async (req: Request, res: Response) => {
  try {
    const { pageId } = req.params;
    const { format = 'markdown', includeSubpages = 'false' } = req.query;
    const userId = (req as any).user.id;

    // Get page with blocks
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: {
        blocks: {
          orderBy: {
            order: 'asc',
          },
        },
        workspace: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      });
    }

    if (page.workspace.members.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No access to this page',
      });
    }

    let content = '';
    let contentType = 'text/plain';

    if (format === 'markdown') {
      // Convert to Markdown
      content = `# ${page.title}\n\n`;
      content += blocksToMarkdown(page.blocks);
      contentType = 'text/markdown';
    } else if (format === 'html') {
      // Convert to HTML
      content = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.6;
      color: #333;
    }
    h1, h2, h3 {
      margin-top: 24px;
      margin-bottom: 12px;
    }
    p {
      margin-bottom: 12px;
    }
    blockquote {
      border-left: 4px solid #ccc;
      margin: 0;
      padding-left: 16px;
      color: #666;
    }
    pre {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      overflow-x: auto;
    }
    code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
    }
    hr {
      border: none;
      border-top: 1px solid #ccc;
      margin: 24px 0;
    }
  </style>
</head>
<body>
  <h1>${page.title}</h1>
  ${blocksToHTML(page.blocks)}
</body>
</html>
      `.trim();
      contentType = 'text/html';
    } else if (format === 'pdf') {
      // PDF export would require a library like puppeteer or pdfkit
      // For now, return error message
      return res.status(501).json({
        success: false,
        message: 'PDF export is not yet implemented. Please use Markdown or HTML.',
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid format. Supported formats: markdown, html, pdf',
      });
    }

    // Set headers for file download
    const filename = `${page.title || 'Untitled'}.${
      format === 'markdown' ? 'md' : format === 'html' ? 'html' : 'pdf'
    }`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  } catch (error) {
    console.error('Error exporting page:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export page',
    });
  }
};
