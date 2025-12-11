import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Send, X } from 'lucide-react';

interface MessageInputProps {
    onSendMessage: (content: string, file: File | null) => Promise<void>;
    disabled?: boolean;
}

export default function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
    const [text, setText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!text.trim() && !file) || sending) return;

        setSending(true);
        try {
            await onSendMessage(text, file);
            setText('');
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } finally {
            setSending(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
        }
    };

    return (
        <div className="p-4 border-t bg-background">
            {file && (
                <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded-md w-fit">
                    <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                            setFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2 items-center">
                <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || sending}
                >
                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                </Button>

                <Input
                    placeholder="Type a message..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={disabled || sending}
                    className="flex-1"
                />

                <Button
                    type="submit"
                    disabled={(!text.trim() && !file) || disabled || sending}
                    size="icon"
                >
                    <Send className="h-5 w-5" />
                </Button>
            </form>
        </div>
    );
}
