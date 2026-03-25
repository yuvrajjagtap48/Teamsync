import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Archive,
  Download,
  File,
  FileText,
  Image,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const getFileIcon = (type) => {
  if (type.startsWith("image/")) return Image;
  if (type.includes("pdf") || type.includes("document")) return FileText;
  if (type.includes("zip") || type.includes("rar")) return Archive;
  return File;
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

function buildStorageFileName(entityType, entityId, originalName) {
  const fileExt = originalName.split(".").pop();
  const randomPart = Math.random().toString(36).slice(2);
  return `${entityType}_${entityId}_${Date.now()}_${randomPart}.${fileExt}`;
}

export function FileUpload({
  entityType,
  entityId,
  onUploadComplete,
  maxFiles = 10,
  maxSize = 10,
}) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (!acceptedFiles.length) return;

      setUploading(true);
      setUploadProgress(0);

      try {
        for (let i = 0; i < acceptedFiles.length; i += 1) {
          const file = acceptedFiles[i];
          const fileName = buildStorageFileName(
            entityType,
            entityId,
            file.name,
          );

          const { error: uploadError } = await supabase.storage
            .from("attachments")
            .upload(fileName, file, { cacheControl: "3600", upsert: false });

          if (uploadError) {
            toast.error(
              `Failed to upload ${file.name}: ${uploadError.message}`,
            );
            continue;
          }

          const { data: urlData } = supabase.storage
            .from("attachments")
            .getPublicUrl(fileName);

          const { error: dbError } = await supabase
            .from("file_attachments")
            .insert({
              entity_type: entityType,
              entity_id: entityId,
              file_name: file.name,
              file_size: file.size,
              file_path: fileName,
              mime_type: file.type,
              uploaded_by: user?.id,
            });

          if (dbError) {
            toast.error(`Failed to save file metadata: ${dbError.message}`);
            continue;
          }

          setUploadedFiles((prev) => [
            ...prev,
            {
              id: fileName,
              name: file.name,
              size: file.size,
              type: file.type,
              url: urlData.publicUrl,
              uploaded_at: new Date().toISOString(),
            },
          ]);

          setUploadProgress(((i + 1) / acceptedFiles.length) * 100);
        }

        toast.success(`Successfully uploaded ${acceptedFiles.length} file(s)`);
        onUploadComplete?.();
      } catch (error) {
        toast.error("Upload failed");
        console.error("Upload error:", error);
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [entityId, entityType, onUploadComplete, user?.id],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize: maxSize * 1024 * 1024,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "text/plain": [".txt"],
      "application/zip": [".zip"],
      "application/x-rar-compressed": [".rar"],
    },
  });

  const handleDeleteFile = async (fileName) => {
    try {
      const { error: storageError } = await supabase.storage
        .from("attachments")
        .remove([fileName]);
      if (storageError)
        return toast.error("Failed to delete file from storage");

      const { error: dbError } = await supabase
        .from("file_attachments")
        .delete()
        .eq("file_path", fileName);
      if (dbError) return toast.error("Failed to delete file record");

      setUploadedFiles((prev) => prev.filter((file) => file.id !== fileName));
      toast.success("File deleted successfully");
      onUploadComplete?.();
    } catch (error) {
      toast.error("Failed to delete file");
      console.error("Delete error:", error);
    }
  };

  const handleDownloadFile = (file) => {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const dropzoneClass = `cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
    isDragActive
      ? "border-primary bg-primary/5"
      : "border-gray-300 hover:border-gray-400"
  }`;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div {...getRootProps()} className={dropzoneClass}>
            <input {...getInputProps()} />
            <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="mb-2 text-lg font-medium">
              {isDragActive ? "Drop files here" : "Upload files"}
            </p>
            <p className="mb-4 text-sm text-gray-500">
              Drag and drop files here, or click to select files
            </p>
            <p className="text-xs text-gray-400">
              Max {maxFiles} files, {maxSize}MB each
            </p>
          </div>

          {uploading && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Uploading...</span>
                <span className="text-sm text-gray-500">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Uploaded Files</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file) => {
              const FileIcon = getFileIcon(file.type);
              return (
                <Card key={file.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileIcon className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadFile(file)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFile(file.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
