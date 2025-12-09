import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import api from '@/lib/axios';

interface ShareButtonProps {
    url: string;
    title?: string;
}

export function ShareButton({ url, title }: ShareButtonProps) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [shortUrl, setShortUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        // If Web Share API is available and we don't need a shortlink specifically to track (or we do?)
        // Requirement: "ShareButton that uses Web Share API or copies link"
        // Requirement: "Shortlink share: POST /api/v1/shortlinks/ ... returning short_url"

        // We should probably generate the shortlink FIRST, then share IT.

        setLoading(true);
        try {
            // 1. Generate Shortlink
            let finalUrl = url;
            try {
                // Check if we already have a short code? Ideally backend handles idempotency (which I implemented).
                const response = await api.post('/api/v1/shortlinks/', { target_url: url });
                if (response.data.short_url) {
                    finalUrl = response.data.short_url;
                    setShortUrl(finalUrl);
                }
            } catch (err) {
                console.error("Failed to shorten link", err);
                // Fallback to original URL
            }

            // 2. Web Share API
            if (navigator.share) {
                await navigator.share({
                    title: title || 'SmartDalali',
                    url: finalUrl,
                });
                setLoading(false);
                return;
            }

            // 3. Fallback to Popover with Copy
            setShortUrl(finalUrl);
            setIsOpen(true);

        } catch (error) {
            console.error("Share failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(shortUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
            description: "Link copied to clipboard",
        });
    };

    if (isOpen) {
        return (
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Share2 className="h-4 w-4" />
                        Share
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                    <div className="flex flex-col gap-4">
                        <h4 className="font-medium leading-none">Share this property</h4>
                        <div className="flex items-center gap-2">
                            <div className="grid flex-1 gap-2">
                                <input
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={shortUrl}
                                    readOnly
                                />
                            </div>
                            <Button size="sm" className="px-3" onClick={handleCopy}>
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        )
    }

    return (
        <Button variant="outline" size="sm" className="gap-2" onClick={handleShare} disabled={loading}>
            {loading ? (
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            ) : (
                <Share2 className="h-4 w-4" />
            )}
            Share
        </Button>
    );
}
