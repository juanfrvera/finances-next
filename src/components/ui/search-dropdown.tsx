import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchDropdownProps {
    label: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    options: string[];
    id?: string;
    required?: boolean;
    createNewLabel?: string;
    onCreateNew?: (value: string) => void;
}

export function SearchDropdown({
    label,
    placeholder,
    value,
    onChange,
    options,
    id,
    required = false,
    createNewLabel = "Create new",
    onCreateNew
}: SearchDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchValue, setSearchValue] = useState(value);
    const [filteredOptions, setFilteredOptions] = useState(options);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Update search value when value prop changes
    useEffect(() => {
        setSearchValue(value);
    }, [value]);

    // Filter options based on search value
    useEffect(() => {
        if (searchValue.trim() === '') {
            setFilteredOptions(options);
        } else {
            const filtered = options.filter(option =>
                option.toLowerCase().includes(searchValue.toLowerCase())
            );
            setFilteredOptions(filtered);
        }
    }, [searchValue, options]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setSearchValue(newValue);
        onChange(newValue);
        if (!isOpen) {
            setIsOpen(true);
        }
    };

    const handleOptionSelect = (option: string) => {
        setSearchValue(option);
        onChange(option);
        setIsOpen(false);
    };

    const handleCreateNew = () => {
        if (onCreateNew && searchValue.trim()) {
            onCreateNew(searchValue.trim());
            setIsOpen(false);
        }
    };

    const handleInputFocus = () => {
        setIsOpen(true);
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setIsOpen(true);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredOptions.length > 0) {
                handleOptionSelect(filteredOptions[0]);
            } else if (onCreateNew && searchValue.trim()) {
                handleCreateNew();
            }
        }
    };

    const showCreateNew = onCreateNew && searchValue.trim() && 
        !filteredOptions.some(option => option.toLowerCase() === searchValue.toLowerCase());

    return (
        <div className="grid w-full gap-3" ref={dropdownRef}>
            <Label htmlFor={id}>{label}</Label>
            <div className="relative">
                <Input
                    ref={inputRef}
                    id={id}
                    placeholder={placeholder}
                    value={searchValue}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onKeyDown={handleInputKeyDown}
                    required={required}
                    className="pr-8"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                </Button>
                
                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredOptions.length > 0 && (
                            <div className="py-1">
                                {filteredOptions.map((option, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                                        onClick={() => handleOptionSelect(option)}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        {showCreateNew && (
                            <>
                                {filteredOptions.length > 0 && <div className="border-t" />}
                                <div className="py-1">
                                    <button
                                        type="button"
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none flex items-center gap-2"
                                        onClick={handleCreateNew}
                                    >
                                        <Plus className="h-4 w-4" />
                                        {createNewLabel}: &quot;{searchValue}&quot;
                                    </button>
                                </div>
                            </>
                        )}
                        
                        {filteredOptions.length === 0 && !showCreateNew && (
                            <div className="py-2 px-3 text-sm text-muted-foreground">
                                No results found
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
