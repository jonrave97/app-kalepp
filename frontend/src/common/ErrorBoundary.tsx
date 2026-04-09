import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, info.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center space-y-4">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                            <span className="text-red-500 text-2xl">!</span>
                        </div>
                        <h2 className="text-base font-semibold text-gray-900">Algo salió mal</h2>
                        <p className="text-sm text-gray-400">
                            {this.state.error?.message ?? 'Ha ocurrido un error inesperado en esta vista.'}
                        </p>
                        <button
                            onClick={this.handleReset}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:opacity-85 transition-opacity"
                        >
                            Intentar de nuevo
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
