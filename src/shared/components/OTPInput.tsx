"use client";

import { Stack, TextField } from '@mui/material';
import { useEffect, useRef } from 'react';

interface OTPInputProps {
    value: string[];
    onChange: (newValue: string[]) => void;
    disabled?: boolean;
    length?: number;
}

export default function OTPInput({
    value,
    onChange,
    disabled = false,
    length = 6
}: OTPInputProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Initialize refs array
        inputRefs.current = inputRefs.current.slice(0, length);
    }, [length]);

    const handleChange = (index: number, inputValue: string) => {
        const sanitizedValue = inputValue.replace(/\D/g, '');
        if (sanitizedValue.length <= 1) {
            const newValue = [...value];
            newValue[index] = sanitizedValue;
            onChange(newValue);

            // Auto-focus to next input
            if (sanitizedValue && index < length - 1) {
                inputRefs.current[index + 1]?.focus();
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !value[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
        if (pastedData.length === length) {
            const newValue = pastedData.split('');
            onChange(newValue);
            // Focus the last input
            inputRefs.current[length - 1]?.focus();
        }
    };

    return (
        <Stack direction="row" spacing={1} justifyContent="center">
            {Array.from({ length }, (_, index) => (
                <TextField
                    key={index}
                    value={value[index] || ''}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    inputProps={{
                        maxLength: 1,
                        style: { textAlign: 'center', fontSize: '1.2rem' },
                    }}
                    inputRef={(el) => (inputRefs.current[index] = el)}
                    variant="outlined"
                    size="small"
                    sx={{ width: 40, height: 40 }}
                    disabled={disabled}
                />
            ))}
        </Stack>
    );
}