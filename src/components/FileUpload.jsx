import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Upload, File, X, Download, Image, FileText, Archive } from 'lucide-react';
const getFileIcon = (type) => {
    if (type.startsWith('image/'))
        return Image;
    if (type.includes('pdf') || type.includes('document'))
        return FileText;
    if (type.includes('zip') || type.includes('rar'))
        return Archive;
    return File;
};
const formatFileSize = (bytes) => {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
export function FileUpload({ entityType, entityId, onUploadComplete, maxFiles = 10, maxSize = 10 }) {
    const { user } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const onDrop = useCallback(async (acceptedFiles) => {
        if (acceptedFiles.length === 0)
            return;
        setUploading(true);
        setUploadProgress(0);
        try {
            for (let i = 0; i < acceptedFiles.length; i++) {
                const file = acceptedFiles[i];
                // Create a unique filename
                const fileExt = file.name.split('.').pop();
                const fileName = `${entityType}_${entityId}_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
                // Upload to Supabase Storage
                const { data, error } = await supabase.storage
                    .from('attachments')
                    .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });
                if (error) {
                    toast.error(`Failed to upload ${file.name}: ${error.message}`);
                    continue;
                }
                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('attachments')
                    .getPublicUrl(fileName);
                // Save file metadata to database
                const { error: dbError } = await supabase
                    .from('file_attachments')
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
                // Add to uploaded files list
                setUploadedFiles(prev => [...prev, {
                        id: fileName,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        url: urlData.publicUrl,
                        uploaded_at: new Date().toISOString(),
                    }]);
                setUploadProgress(((i + 1) / acceptedFiles.length) * 100);
            }
            toast.success(`Successfully uploaded ${acceptedFiles.length} file(s)`);
            onUploadComplete();
        }
        catch (error) {
            toast.error('Upload failed');
            console.error('Upload error:', error);
        }
        finally {
            setUploading(false);
            setUploadProgress(0);
        }
    }, [entityType, entityId, onUploadComplete]);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles,
        maxSize: maxSize * 1024 * 1024, // Convert MB to bytes
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'text/plain': ['.txt'],
            'application/zip': ['.zip'],
            'application/x-rar-compressed': ['.rar'],
        },
    });
    const handleDeleteFile = async (fileName) => {
        try {
            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from('attachments')
                .remove([fileName]);
            if (storageError) {
                toast.error('Failed to delete file from storage');
                return;
            }
            // Delete from database
            const { error: dbError } = await supabase
                .from('file_attachments')
                .delete()
                .eq('file_path', fileName);
            if (dbError) {
                toast.error('Failed to delete file record');
                return;
            }
            setUploadedFiles(prev => prev.filter(file => file.id !== fileName));
            toast.success('File deleted successfully');
            onUploadComplete();
        }
        catch (error) {
            toast.error('Failed to delete file');
            console.error('Delete error:', error);
        }
    };
    const handleDownloadFile = (file) => {
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(Card, { children: _jsxs(CardContent, { className: "p-6", children: [_jsxs("div", { ...getRootProps(), className: `border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-300 hover:border-gray-400'}`, children: [_jsx("input", { ...getInputProps() }), _jsx(Upload, { className: "h-12 w-12 mx-auto mb-4 text-gray-400" }), _jsx("p", { className: "text-lg font-medium mb-2", children: isDragActive ? 'Drop files here' : 'Upload files' }), _jsx("p", { className: "text-sm text-gray-500 mb-4", children: "Drag and drop files here, or click to select files" }), _jsxs("p", { className: "text-xs text-gray-400", children: ["Max ", maxFiles, " files, ", maxSize, "MB each"] })] }), uploading && (_jsxs("div", { className: "mt-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-medium", children: "Uploading..." }), _jsxs("span", { className: "text-sm text-gray-500", children: [Math.round(uploadProgress), "%"] })] }), _jsx(Progress, { value: uploadProgress, className: "h-2" })] }))] }) }), uploadedFiles.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "font-medium", children: "Uploaded Files" }), _jsx("div", { className: "space-y-2", children: uploadedFiles.map((file) => {
                            const FileIcon = getFileIcon(file.type);
                            return (_jsx(Card, { children: _jsx(CardContent, { className: "p-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(FileIcon, { className: "h-5 w-5 text-gray-500" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: file.name }), _jsx("p", { className: "text-xs text-gray-500", children: formatFileSize(file.size) })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleDownloadFile(file), children: _jsx(Download, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleDeleteFile(file.id), className: "text-red-600 hover:text-red-700", children: _jsx(X, { className: "h-4 w-4" }) })] })] }) }) }, file.id));
                        }) })] }))] }));
}
