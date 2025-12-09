import { useFormContext, Controller, FieldValues, Path } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

// Helper to get nested values safely
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

interface BaseFieldProps<T extends FieldValues> {
    name: Path<T>;
    label?: string;
    placeholder?: string;
    description?: string;
    className?: string;
    disabled?: boolean;
}

interface InputFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
    type?: React.HTMLInputTypeAttribute;
}

export function FormInputField<T extends FieldValues>({
    name,
    label,
    placeholder,
    description,
    type = 'text',
    className,
    disabled
}: InputFieldProps<T>) {
    const { control, formState: { errors, dirtyFields } } = useFormContext<T>();
    const hasError = !!errors[name];
    // Simple check for "success" state: field is dirty and has no error
    const isSuccess = dirtyFields[name] && !hasError;

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem className={className}>
                    {label && <FormLabel className={cn(hasError ? "text-destructive" : "")}>{label}</FormLabel>}
                    <FormControl>
                        <div className="relative">
                            <Input
                                {...field}
                                type={type}
                                placeholder={placeholder}
                                disabled={disabled}
                                className={cn(
                                    isSuccess && "border-green-500 focus-visible:ring-green-500",
                                    hasError && "border-destructive focus-visible:ring-destructive"
                                )}
                            />
                        </div>
                    </FormControl>
                    {description && <FormDescription>{description}</FormDescription>}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

interface TextareaFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
    rows?: number;
}

export function FormTextareaField<T extends FieldValues>({
    name,
    label,
    placeholder,
    description,
    rows = 4,
    className,
    disabled
}: TextareaFieldProps<T>) {
    const { control, formState: { errors, dirtyFields } } = useFormContext<T>();
    const hasError = !!errors[name];
    const isSuccess = dirtyFields[name] && !hasError;

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem className={className}>
                    {label && <FormLabel className={cn(hasError ? "text-destructive" : "")}>{label}</FormLabel>}
                    <FormControl>
                        <Textarea
                            {...field}
                            placeholder={placeholder}
                            rows={rows}
                            disabled={disabled}
                            className={cn(
                                isSuccess && "border-green-500 focus-visible:ring-green-500",
                                hasError && "border-destructive focus-visible:ring-destructive"
                            )}
                        />
                    </FormControl>
                    {description && <FormDescription>{description}</FormDescription>}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

interface SelectOption {
    label: string;
    value: string;
}

interface SelectFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
    options: SelectOption[];
}

export function FormSelectField<T extends FieldValues>({
    name,
    label,
    placeholder,
    description,
    options,
    className,
    disabled
}: SelectFieldProps<T>) {
    const { control, formState: { errors } } = useFormContext<T>();
    const hasError = !!errors[name];

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem className={className}>
                    {label && <FormLabel className={cn(hasError ? "text-destructive" : "")}>{label}</FormLabel>}
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={disabled}>
                        <FormControl>
                            <SelectTrigger className={cn(hasError && "border-destructive ring-destructive")}>
                                <SelectValue placeholder={placeholder} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {options.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {description && <FormDescription>{description}</FormDescription>}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
