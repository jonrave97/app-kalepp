import { useState, useEffect } from 'react';
import { getMyTeam, type TeamMember } from '@/services/userAdminServices';

export function useMyTeam() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading]  = useState(true);
    const [error,   setError]    = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        getMyTeam()
            .then(setMembers)
            .catch(() => setError('Error al cargar el equipo'))
            .finally(() => setLoading(false));
    }, []);

    return { members, loading, error };
}

