'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Paperclip,
  Upload,
  Trash2,
  FileText,
  Image as ImageIcon,
  File,
  Download,
  X,
  Loader2,
} from 'lucide-react';

interface Attachment {
  id: string;
  storageKey: string;
  filename: string;
  contentType: string;
  fileSize: number;
  folder: string;
  description: string | null;
  createdAt: string;
  uploadedByName: string | null;
  url: string;
}

interface FileAttachmentsProps {
  entityType: string;
  entityId: string;
  folder?: string;
  title?: string;
  readOnly?: boolean;
  compact?: boolean; // inline mode without card wrapper
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(contentType: string) {
  if (contentType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
  if (contentType === 'application/pdf') return <FileText className="h-4 w-4 text-red-500" />;
  return <File className="h-4 w-4 text-gray-500" />;
}

export function FileAttachments({
  entityType,
  entityId,
  folder = 'uploads',
  title = 'Attachments',
  readOnly = false,
  compact = false,
}: FileAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAttachments = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/attachments?entityType=${entityType}&entityId=${entityId}`
      );
      if (res.ok) {
        setAttachments(await res.json());
      }
    } catch {
      // silently fail on fetch
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const handleUpload = async (files: FileList | File[]) => {
    setError(null);
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);
        formData.append('entityType', entityType);
        formData.append('entityId', entityId);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Upload failed');
        }
      }
      await fetchAttachments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this attachment?')) return;

    try {
      const res = await fetch(`/api/attachments?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAttachments((prev) => prev.filter((a) => a.id !== id));
      }
    } catch {
      setError('Failed to delete');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  const content = (
    <div className="space-y-3">
      {/* Upload area */}
      {!readOnly && (
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
            dragOver
              ? 'border-orange-400 bg-orange-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) {
                handleUpload(e.target.files);
                e.target.value = '';
              }
            }}
          />
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Upload className="h-5 w-5 text-gray-400" />
              <p className="text-sm text-gray-500">
                Drop files here or <span className="text-orange-600 font-medium">browse</span>
              </p>
              <p className="text-xs text-gray-400">
                Images, PDF, Excel, Word, CSV — max 10MB
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-md p-2">
          <X className="h-4 w-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* File list */}
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        </div>
      ) : attachments.length === 0 ? (
        !readOnly ? null : (
          <p className="text-sm text-gray-400 text-center py-2">No attachments</p>
        )
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 group"
            >
              {/* Preview / icon */}
              {attachment.contentType.startsWith('image/') ? (
                <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={attachment.url}
                    alt={attachment.filename}
                    className="h-10 w-10 rounded object-cover border"
                  />
                </a>
              ) : (
                <div className="h-10 w-10 rounded border bg-white flex items-center justify-center">
                  {getFileIcon(attachment.contentType)}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-gray-900 hover:text-orange-600 truncate block"
                >
                  {attachment.filename}
                </a>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{formatFileSize(attachment.fileSize)}</span>
                  {attachment.uploadedByName && (
                    <>
                      <span>•</span>
                      <span>{attachment.uploadedByName}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{new Date(attachment.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded hover:bg-gray-200"
                >
                  <Download className="h-4 w-4 text-gray-500" />
                </a>
                {!readOnly && (
                  <button
                    onClick={() => handleDelete(attachment.id)}
                    className="p-1 rounded hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (compact) return content;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-gray-500" />
          <CardTitle className="text-lg">{title}</CardTitle>
          {attachments.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {attachments.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
