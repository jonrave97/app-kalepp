import { MessageCircle } from 'lucide-react';

function Footer() {
    const currentYear = new Date().getFullYear();
    const whatsappNumber = '56912345678'; // Cambia este número

    return (
        <footer className="bg-primary border-t border-primary-dark mt-auto">
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-white">
                    
                    {/* Derechos Reservados */}
                    <div className="text-sm text-center md:text-left">
                        <p>© {currentYear} Kaltire. Todos los derechos reservados.</p>
                    </div>

                    {/* Contacto WhatsApp */}
                    <div className="flex items-center gap-2">
                        <a
                            href={`https://wa.me/${whatsappNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 
                                       text-white rounded transition-all
                                       hover:bg-white/10 active:scale-95"
                        >
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-sm">Contáctanos</span>
                        </a>
                    </div>

                </div>
            </div>
        </footer>
    );
}

export default Footer;
