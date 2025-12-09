import { useState, useRef, ChangeEvent } from 'react';
import { Upload, X, File as FileIcon, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

interface FileUploadProps {
    onFilesSelected: (files: File[]) => void;
    maxSizeMB?: number;
    acceptedTypes?: string[];
    maxFiles?: number;
    existingFiles?: File[];
    className?: string;
    disabled?: boolean;
}

interface FilePreview {
    file: File;
    previewUrl?: string;
    progress: number;
    status: 'uploading' | 'success' | 'error';
}

export function FileUpload({
    onFilesSelected,
    maxSizeMB = 5,
    acceptedTypes = ['image/*', 'application/pdf'],
    maxFiles = 5,
    existingFiles = [],
    className,
    disabled = false
}: FileUploadProps) {
    const { t } = useTranslation();
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [previews, setPreviews] = useState<FilePreview[]>(
        existingFiles.map(f => ({
            file: f,
            previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
            progress: 100,
            status: 'success'
        }))
    );

    const handleFiles = (files: FileList | null) => {
        if (!files) return;

        const newFiles: File[] = [];
        const newPreviews: FilePreview[] = [];

        Array.from(files).forEach(file => {
            // Validate Size
            if (file.size > maxSizeMB * 1024 * 1024) {
                toast({
                    title: t('common.error'),
                    description: `${file.name} is too large. Max ${maxSizeMB}MB`,
                    variant: "destructive"
                });
                return;
            }

            // Validate Type (Simple check)
            // Note: A more robust check might be needed for complex requirements

            newFiles.push(file);
            newPreviews.push({
                file,
                previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
                progress: 0,
                status: 'uploading'
            });
        });

        if (previews.length + newFiles.length > maxFiles) {
            toast({
                title: t('common.error'),
                description: `You can only upload a maximum of ${maxFiles} files.`,
                variant: "destructive"
            });
            return;
        }

        setPreviews(prev => [...prev, ...newPreviews]);

        // Simulate upload progress for UX (since actual upload happens on form submit usually)
        newPreviews.forEach((preview, index) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                setPreviews(curr =>
                    curr.map(p => p.file === preview.file ? { ...p, progress: Math.min(progress, 100) } : p)
                );
                if (progress >= 100) {
                    clearInterval(interval);
                    setPreviews(curr =>
                        curr.map(p => p.file === preview.file ? { ...p, status: 'success' } : p)
                    );
                }
            }, 200);
        });

        // Notify parent
        // We combine existing successful files with new ones
        // In a real app, you might handle "existing vs field value" differently
        const allFiles = [...previews.map(p => p.file), ...newFiles];
        onFilesSelected(allFiles);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files) {
            handleFiles(e.target.files);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && !disabled) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setDragActive(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    const removeFile = (index: number) => {
        const updated = [...previews];
        URL.revokeObjectURL(updated[index].previewUrl || '');
        updated.splice(index, 1);
        setPreviews(updated);
        onFilesSelected(updated.map(p => p.file));
    };

    const retryUpload = (index: number) => {
        // Logic to retry - for now just reset progress
        setPreviews(curr =>
            curr.map((p, i) => i === index ? { ...p, status: 'uploading', progress: 0 } : p)
        );
        // Re-trigger simulation
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            setPreviews(curr =>
                curr.map((p, i) => i === index ? { ...p, progress: Math.min(progress, 100) } : p)
            );
            if (progress >= 100) {
                clearInterval(interval);
                setPreviews(curr =>
                    curr.map((p, i) => i === index ? { ...p, status: 'success' } : p)
                );
            }
        }, 200);
    };

    return (
        <div className={cn("w-full space-y-4", className)}>
            <div
                className={cn(
                    "flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed transition-colors",
                    dragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25 bg-muted/50",
                    disabled && "opacity-50 cursor-not-allowed",
                    !disabled && "cursor-pointer hover:bg-muted"
                )}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => !disabled && inputRef.current?.click()}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="mb-1 text-sm text-muted-foreground">
                        <span className="font-semibold">{t('common.click_upload')}</span> {t('common.or_drag_drop')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Max {maxFiles} files, up to {maxSizeMB}MB each
                    </p>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept={acceptedTypes.join(',')}
                    onChange={handleChange}
                    disabled={disabled}
                />
            </div>

            {previews.length > 0 && (
                <div className="space-y-2">
                    {previews.map((preview, index) => (
                        <div key={index} className="flex items-center p-2 bg-card border rounded-md gap-3 relative group">
                            {preview.previewUrl ? (
                                <img src={preview.previewUrl} alt="Preview" className="h-10 w-10 object-cover rounded" />
                            ) : (
                                <FileIcon className="h-10 w-10 p-2 text-muted-foreground bg-muted rounded" />
                            )}

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{preview.file.name}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">{(preview.file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    {preview.status === 'error' && <span className="text-xs text-destructive">Failed</span>}
                                </div>
                                {preview.status === 'uploading' && (
                                    <Progress value={preview.progress} className="h-1 mt-1" />
                                )}
                            </div>

                            <div className="flex items-center gap-1">
                                {preview.status === 'error' && (
                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => retryUpload(index)}>
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                )}
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeFile(index)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
