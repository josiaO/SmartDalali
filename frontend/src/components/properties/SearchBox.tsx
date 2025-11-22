import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { debounce } from '@/lib/helpers';

interface SearchBoxProps {
    onSearch: (query: string) => void;
    placeholder?: string;
}

export function SearchBox({ onSearch, placeholder = 'Search properties...' }: SearchBoxProps) {
    const [value, setValue] = useState('');

    const handleSearch = debounce((query: string) => {
        onSearch(query);
    }, 500);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setValue(newValue);
        handleSearch(newValue);
    };

    return (
        <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                type="text"
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                className="pl-10 h-12 rounded-2xl text-base"
            />
        </div>
    );
}
