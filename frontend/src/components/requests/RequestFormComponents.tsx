import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ImagePlus, Loader2, X } from 'lucide-react';

// ─── SearchSelect ─────────────────────────────────────────────────────────────
export interface SelectOption { label: string; value: string; }

interface SearchSelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function SearchSelect({ options, value, onChange, placeholder = 'Seleccionar...', disabled }: SearchSelectProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    const filtered = query
        ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
        : options;

    const selectedLabel = options.find(o => o.value === value)?.label ?? '';

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => { setOpen(prev => !prev); setQuery(''); }}
                className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-200
                           rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40
                           disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-gray-50 transition-colors"
            >
                <span className={selectedLabel ? 'text-gray-800' : 'text-gray-400'}>
                    {selectedLabel || placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-gray-100">
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Buscar..."
                            autoFocus
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg
                                       focus:outline-none focus:ring-1 focus:ring-primary/40"
                        />
                    </div>
                    <ul className="max-h-48 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <li className="px-3 py-2 text-sm text-gray-400 text-center">Sin resultados</li>
                        ) : (
                            filtered.map(o => (
                                <li
                                    key={o.value}
                                    onClick={() => { onChange(o.value); setOpen(false); setQuery(''); }}
                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors
                                                ${o.value === value ? 'text-primary font-medium bg-primary/5' : 'text-gray-700'}`}
                                >
                                    {o.label}
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}

// ─── ImageDropzone ────────────────────────────────────────────────────────────
interface ImageDropzoneProps {
    images: File[];
    onAdd: (files: File[]) => Promise<void>;
    onRemove: (index: number) => void;
    isCompressing: boolean;
    required?: boolean;
    error?: string;
}

export function ImageDropzone({ images, onAdd, onRemove, isCompressing, required, error }: ImageDropzoneProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const handleFiles = useCallback((files: FileList | null) => {
        if (!files || files.length === 0) return;
        onAdd(Array.from(files));
    }, [onAdd]);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const previews = images.map(f => URL.createObjectURL(f));

    return (
        <div className="space-y-3">
            <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => !isCompressing && inputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-2 rounded-xl
                            border-2 border-dashed p-6 cursor-pointer transition-colors select-none
                            ${dragging
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-200 bg-gray-50 hover:border-primary/50 hover:bg-primary/5'}
                            ${isCompressing ? 'opacity-60 cursor-wait' : ''}`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    multiple
                    className="hidden"
                    onChange={e => handleFiles(e.target.files)}
                    onClick={e => { (e.target as HTMLInputElement).value = ''; }}
                />

                {isCompressing ? (
                    <>
                        <Loader2 className="w-7 h-7 text-primary animate-spin" />
                        <p className="text-sm text-primary font-medium">Comprimiendo imágenes…</p>
                    </>
                ) : (
                    <>
                        <ImagePlus className="w-7 h-7 text-gray-300" />
                        <p className="text-sm text-gray-500">
                            <span className="text-primary font-medium">Haz clic</span> o arrastra imágenes aquí
                        </p>
                        <p className="text-xs text-gray-400">JPG, PNG, WEBP · Máx. 10 MB por imagen · Máx. 5 imágenes</p>
                        {required && images.length === 0 && (
                            <span className="text-xs text-red-500 font-medium">* Obligatorio para motivo "Deterioro"</span>
                        )}
                    </>
                )}
            </div>

            {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {images.map((_file, i) => (
                        <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                            <img
                                src={previews[i]}
                                alt={`Imagen ${i + 1}`}
                                className="w-full h-full object-cover"
                                onLoad={() => URL.revokeObjectURL(previews[i])}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                            <button
                                type="button"
                                onClick={e => { e.stopPropagation(); onRemove(i); }}
                                className="absolute top-1 right-1 p-0.5 rounded-full bg-white/90 text-gray-600
                                           opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all shadow"
                                title="Eliminar imagen"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                            <span className="absolute bottom-1 left-1 text-xs text-white font-medium
                                             bg-black/40 px-1 rounded">
                                {i + 1}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

