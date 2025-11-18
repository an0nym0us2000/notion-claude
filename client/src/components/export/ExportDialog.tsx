import React, { useState } from 'react';
import { api } from '@/lib/api';

interface ExportDialogProps {
  pageId: string;
  pageTitle: string;
  onClose: () => void;
}

type ExportFormat = 'markdown' | 'html' | 'pdf';

export const ExportDialog: React.FC<ExportDialogProps> = ({
  pageId,
  pageTitle,
  onClose,
}) => {
  const [format, setFormat] = useState<ExportFormat>('markdown');
  const [includeSubpages, setIncludeSubpages] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);

      const response = await api.get(`/api/pages/${pageId}/export`, {
        params: {
          format,
          includeSubpages,
        },
        responseType: 'blob', // Important for file downloads
      });

      // Create download link
      const blob = new Blob([response.data], {
        type: getContentType(format),
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${pageTitle || 'Untitled'}.${getFileExtension(format)}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Close dialog after successful export
      onClose();
    } catch (error) {
      console.error('Error exporting page:', error);
      alert('Failed to export page. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const getContentType = (format: ExportFormat): string => {
    switch (format) {
      case 'markdown':
        return 'text/markdown';
      case 'html':
        return 'text/html';
      case 'pdf':
        return 'application/pdf';
      default:
        return 'text/plain';
    }
  };

  const getFileExtension = (format: ExportFormat): string => {
    switch (format) {
      case 'markdown':
        return 'md';
      case 'html':
        return 'html';
      case 'pdf':
        return 'pdf';
      default:
        return 'txt';
    }
  };

  const getFormatDescription = (format: ExportFormat): string => {
    switch (format) {
      case 'markdown':
        return 'Export as Markdown (.md) - Plain text with formatting syntax, compatible with most text editors';
      case 'html':
        return 'Export as HTML (.html) - Web page format, can be opened in any browser';
      case 'pdf':
        return 'Export as PDF (.pdf) - Portable Document Format, great for sharing and printing';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="p-4 border-b border-notion-border flex items-center justify-between">
          <h3 className="text-lg font-semibold">Export Page</h3>
          <button
            onClick={onClose}
            className="text-notion-text-secondary hover:text-notion-text-primary"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Page Info */}
          <div className="p-3 bg-notion-bg rounded-lg">
            <div className="text-sm text-notion-text-secondary mb-1">
              Exporting:
            </div>
            <div className="font-semibold text-notion-text">
              {pageTitle || 'Untitled'}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-notion-text-secondary mb-2">
              Export Format
            </label>
            <div className="space-y-2">
              {(['markdown', 'html', 'pdf'] as ExportFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`w-full p-3 border rounded-lg text-left transition-colors ${
                    format === fmt
                      ? 'border-notion-blue bg-blue-50'
                      : 'border-notion-border hover:bg-notion-hover'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        format === fmt
                          ? 'border-notion-blue'
                          : 'border-notion-border'
                      }`}
                    >
                      {format === fmt && (
                        <div className="w-2 h-2 rounded-full bg-notion-blue" />
                      )}
                    </div>
                    <span className="font-medium text-notion-text capitalize">
                      {fmt}
                    </span>
                    <span className="text-sm text-notion-text-secondary">
                      .{getFileExtension(fmt)}
                    </span>
                  </div>
                  <p className="text-xs text-notion-text-secondary ml-6">
                    {getFormatDescription(fmt)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-notion-text-secondary mb-2">
              Export Options
            </label>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="includeSubpages"
                checked={includeSubpages}
                onChange={(e) => setIncludeSubpages(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-notion-border text-notion-blue focus:ring-notion-blue"
              />
              <label htmlFor="includeSubpages" className="text-sm cursor-pointer">
                <div className="font-medium">Include subpages</div>
                <div className="text-xs text-notion-text-secondary">
                  Export all child pages in a single file (nested format)
                </div>
              </label>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-blue-600">ℹ️</span>
              <div className="text-sm text-blue-800">
                {format === 'markdown' && (
                  <>
                    Markdown files preserve formatting like <strong>bold</strong>,{' '}
                    <em>italic</em>, and links. They can be edited in any text editor.
                  </>
                )}
                {format === 'html' && (
                  <>
                    HTML files include all formatting and styles. Open them in any
                    web browser to view the page exactly as it appears.
                  </>
                )}
                {format === 'pdf' && (
                  <>
                    PDF files are great for sharing and printing. They preserve
                    formatting and can be viewed on any device.
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-notion-border flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={exporting}
            className="px-4 py-2 border border-notion-border rounded-lg hover:bg-notion-hover disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 bg-notion-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
          >
            {exporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <span>📥</span>
                Export as {format.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
