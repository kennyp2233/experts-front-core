'use client';

import React from 'react';
import { FitoPage as FitoPageComponent } from '../../../../features/fito';

// El título, el subtítulo y el control de acceso (solo ADMIN) viven en el componente.
export default function FitoPage() {
    return <FitoPageComponent />;
}
