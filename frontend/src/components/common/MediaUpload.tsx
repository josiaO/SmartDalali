import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Video, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';

interface MediaUploadProps {
    type: 'image' | 'video';
    files: File[];
    previews: string[];
    maxFiles: number;
    onFilesChange: (files: File[]) => void;
    onPreviewsChange: (previews: string[]) => void;
    onRemove: (index: number) => void;
    className?: string;
    existingMedia?: string[];
    onRemoveExisting?: (index: number) => void;
}

interface UploadProgress {
    [key: string]: number; // fileName -> 0-100
}

export function MediaUpload({
    type,
    files,
    previews,
    maxFiles,
    onFilesChange,
    onPreviewsChange,
    onRemove,
    className,
    existingMedia = [],
    onRemoveExisting
}: MediaUploadProps) {
    const { t } = useTranslation();
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
    const [dragActive, setDragActive] = useState(false);

    // Max size in MB
    const MAX_SIZE_MB = type === 'image' ? 5 : 50;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement> | { target: { files: FileList | null } }) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const totalFiles = (existingMedia?.length || 0) + files.length + newFiles.length;

            if (totalFiles > maxFiles) {
                toast({
                    title: t('common.error'),
                    description: t('form.max_files', { count: maxFiles }),
                    variant: 'destructive',
                });
                return;
            }

            // Validate size
            const validFiles: File[] = [];
            newFiles.forEach(file => {
                if (file.size > MAX_SIZE_MB * 1024 * 1024) {
                    toast({
                        title: t('common.error'),
                        description: `${file.name} is too large. Max ${MAX_SIZE_MB}MB`,
                        variant: 'destructive',
                    });
                } else {
                    validFiles.push(file);
                }
            });

            if (validFiles.length === 0) return;

            const combinedFiles = [...files, ...validFiles];
            onFilesChange(combinedFiles);

            const newPreviews = validFiles.map(file => URL.createObjectURL(file));
            onPreviewsChange([...previews, ...newPreviews]);

            // Simulate progress
            validFiles.forEach(file => {
                let progress = 0;
                const interval = setInterval(() => {
                    progress += 10;
                    setUploadProgress(prev => ({ ...prev, [file.name]: Math.min(progress, 100) }));
                    if (progress >= 100) clearInterval(interval);
                }, 150);
            });

            // Reset input
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange({ target: { files: e.dataTransfer.files } });
        }
    };

    return (
        <div className={cn("space-y-4", className)}>
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors relative",
                    dragActive ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                )}
            >
                <Input
                    ref={inputRef}
                    type="file"
                    accept={type === 'image' ? "image/*" : "video/*"}
                    multiple={true} // Explicitly true
                    onChange={handleFileChange}
                    className="hidden"
                />
                <div className="flex flex-col items-center justify-center">
                    <div className={cn("p-4 rounded-full bg-muted mb-4 transition-transform group-hover:scale-110", dragActive && "scale-110")}>
                        {type === 'image' ? (
                            <Upload className="h-6 w-6 text-muted-foreground" />
                        ) : (
                            <Video className="h-6 w-6 text-muted-foreground" />
                        )}
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium">
                            {type === 'image' ? t('common.click_upload_image') : t('common.click_upload_video')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Max {maxFiles} files, up to {MAX_SIZE_MB}MB each
                        </p>
                    </div>
                </div>

                <div className="absolute top-4 right-4 text-xs font-medium px-2 py-1 rounded bg-muted">
                    {existingMedia.length + files.length} / {maxFiles}
                </div>
            </div>

            {(previews.length > 0 || existingMedia.length > 0) && (
                <div className={cn("grid gap-4 mt-4 animate-in fade-in slide-in-from-top-2", type === 'image' ? "grid-cols-2 md:grid-cols-4 lg:grid-cols-5" : "grid-cols-1 md:grid-cols-2")}>
                    {/* Existing Media */}
                    {existingMedia.map((src, i) => (
                        <div key={`existing-${i}`} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted shadow-sm">
                            {type === 'image' ? (
                                <img src={src} alt="Existing" className="w-full h-full object-cover transition-transform hover:scale-105" />
                            ) : (
                                <video src={src} className="w-full h-full object-cover" controls playsInline />
                            )}
                            {onRemoveExisting && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onRemoveExisting(i); }}
                                    className="absolute top-1 right-1 bg-destructive/90 hover:bg-destructive text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all scale-90 hover:scale-100 shadow-sm"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                                Existing
                            </div>
                        </div>
                    ))}

                    {/* New Media */}
                    {previews.map((src, i) => {
                        const file = files[i];
                        const progress = uploadProgress[file?.name] || 0;
                        const isComplete = progress >= 100;

                        return (
                            <div key={`new-${i}`} className="relative group aspect-square rounded-lg overflow-hidden border bg-background shadow-sm">
                                {type === 'image' ? (
                                    <img src={src} alt="Preview" className={cn("w-full h-full object-cover transition-opacity", !isComplete && "opacity-50")} />
                                ) : (
                                    <video src={src} className="w-full h-full object-cover" controls={isComplete} />
                                )}

                                {!isComplete && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
                                        <div className="w-3/4 space-y-2 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                            <Progress value={progress} className="h-1.5 w-full" />
                                        </div>
                                    </div>
                                )}

                                {isComplete && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                                        className="absolute top-1 right-1 bg-destructive/90 hover:bg-destructive text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all scale-90 hover:scale-100 shadow-sm"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                                <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow-sm">
                                    New
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
