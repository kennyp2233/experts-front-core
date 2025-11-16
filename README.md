# Experts Front Core

Admin panel construido con Next.js 16, React 19, TypeScript y Material-UI para gestión de datos maestros.

## 🚀 Stack Tecnológico

- **Framework:** Next.js 16.0.1 (App Router)
- **UI Library:** React 19.2.0
- **Lenguaje:** TypeScript 5
- **UI Components:** Material-UI (MUI) 7.3.5
- **Styling:** Tailwind CSS 4 + Emotion (CSS-in-JS)
- **Data Fetching:** SWR 2.3.6 + Axios 1.13.2
- **State Management:** React Context API
- **Autenticación:** httpOnly cookies

## 📦 Instalación

### Prerrequisitos

- Node.js 20+
- npm o pnpm

### Setup

1. **Clonar el repositorio**

```bash
git clone <repository-url>
cd experts-front-core
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

Copia `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Edita `.env.local` y configura:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001  # URL de tu backend API
```

4. **Ejecutar en desarrollo**

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🏗️ Arquitectura del Proyecto

### Estructura de Carpetas

```
experts-front-core/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (app)/               # Rutas autenticadas
│   │   │   ├── dashboard/
│   │   │   └── admin/master-data/
│   │   └── auth/                # Página de autenticación
│   │
│   ├── features/                # Módulos por funcionalidad
│   │   ├── auth/                # Autenticación
│   │   ├── dashboard/           # Dashboard
│   │   └── master-data/         # Gestión de datos maestros
│   │       ├── components/      # Componentes reutilizables
│   │       ├── hooks/           # Custom hooks
│   │       ├── configs/         # Configuraciones por entidad
│   │       └── types/           # TypeScript types
│   │
│   └── shared/                  # Código compartido
│       ├── components/          # Componentes globales
│       ├── hooks/               # Hooks compartidos
│       ├── services/            # API y servicios
│       ├── utils/               # Utilidades
│       ├── providers/           # Context Providers
│       └── theme/               # Sistema de temas MUI
│
├── public/                      # Assets estáticos
└── package.json
```

### Patrones de Arquitectura

#### 1. **Config-Driven CRUD**

Los módulos de master-data siguen un patrón config-driven que permite crear nuevas entidades sin duplicar código:

```typescript
// Ejemplo: src/features/master-data/configs/paises.config.ts
export const paisesConfig: MasterDataConfig = {
  entityName: 'País',
  apiEndpoint: '/master-data/paises',
  idField: 'idPais',
  fields: [
    { name: 'siglasPais', label: 'Siglas', type: 'text', required: true },
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    // ...
  ],
  tableColumns: [
    { key: 'idPais', label: 'ID' },
    { key: 'siglasPais', label: 'Siglas' },
    // ...
  ],
};
```

#### 2. **Generic Hooks**

Hooks genéricos para eliminar duplicación:

- `useMasterData<T>`: CRUD base para todas las entidades
- `useForeignKeyOptions`: Carga opciones de foreign keys
- `useAuth`: Manejo de autenticación

#### 3. **Feature-Based Structure**

Cada feature es autocontenida con:
- Components
- Hooks
- Types
- Services
- Configs

## 🔑 Características Principales

### Autenticación

- Login/Register con httpOnly cookies
- Verificación automática de sesión
- Interceptor de 401 con logout automático
- Retry logic para verificación de tokens

### Master Data

Sistema CRUD genérico para gestionar:
- Países
- Productos
- Aerolíneas
- Consignatarios
- Y 18 entidades más...

Características:
- Búsqueda con debounce (500ms)
- Paginación
- Ordenamiento
- Validación dinámica
- Formularios con pestañas
- Componentes customizables

### Sistema de Temas

- Light/Dark mode
- Persistencia en localStorage
- Sincronización con preferencias del sistema
- Componentes MUI personalizados

## 🛠️ Scripts Disponibles

```bash
npm run dev       # Desarrollo local
npm run build     # Build para producción
npm start         # Servidor de producción
npm run lint      # Linting con ESLint
```

## 📚 Guía de Desarrollo

### Agregar una Nueva Entidad Master Data

1. **Crear configuración**

```typescript
// src/features/master-data/configs/mi-entidad.config.ts
export const miEntidadConfig: MasterDataConfig = {
  entityName: 'Mi Entidad',
  apiEndpoint: '/master-data/mi-entidad',
  idField: 'id',
  fields: [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
  ],
  tableColumns: [
    { key: 'id', label: 'ID' },
    { key: 'nombre', label: 'Nombre' },
  ],
};
```

2. **Crear página**

```typescript
// src/app/(app)/admin/master-data/mi-entidad/page.tsx
import { MasterDataPage } from '@/features/master-data/components/common/MasterDataPage';
import { miEntidadConfig } from '@/features/master-data/configs/mi-entidad.config';

export default function MiEntidadPage() {
  return <MasterDataPage config={miEntidadConfig} />;
}
```

3. **Agregar ruta al sidebar** (opcional)

### Usar el Logger

```typescript
import { logger } from '@/shared/utils';

// Crear logger con contexto
const myLogger = logger.createChild('MyComponent');

// Logs solo en desarrollo
myLogger.debug('Mensaje de debug', { data: 123 });
myLogger.info('Información general');

// Logs en desarrollo y producción
myLogger.warn('Advertencia');
myLogger.error('Error crítico', error);
```

### Cargar Foreign Key Options

```typescript
import { useForeignKeyOptions } from '@/shared/hooks';

const { options, loading } = useForeignKeyOptions([
  {
    key: 'paises',
    endpoint: '/master-data/paises',
    mapper: (p) => ({ value: p.id, label: p.nombre })
  }
]);

// Usar: options.paises
```

## 🔒 Seguridad

- **httpOnly cookies** para tokens de autenticación
- **Security headers** configurados en `next.config.ts`
- **TypeScript strict mode** habilitado
- **CSRF protection** vía cookies
- **XSS protection** headers
- **Content Security Policy** ready

## 🎨 Convenciones de Código

- **Imports:** Usar path alias `@/*` para imports absolutos
- **Components:** PascalCase para nombres de componentes
- **Hooks:** camelCase empezando con `use`
- **Types:** PascalCase para interfaces y types
- **Logger:** Crear logger con contexto en cada módulo
- **No console.log:** Usar el logger centralizado

## 📊 Estado del Proyecto

### Completado ✅

- Arquitectura base con Next.js App Router
- Sistema de autenticación con cookies
- CRUD genérico para master data
- 22 entidades master data configuradas
- Sistema de temas light/dark
- Logger centralizado
- Retry logic para auth
- Hook genérico para foreign keys
- Optimizaciones de Next.js

### En Desarrollo 🚧

- Tests unitarios e integración
- Dashboard con widgets
- Lazy loading de rutas
- Error boundaries
- Performance optimizations

## 🤝 Contribuir

1. Crear una rama feature: `git checkout -b feature/mi-feature`
2. Commit cambios: `git commit -m 'Add: mi feature'`
3. Push a la rama: `git push origin feature/mi-feature`
4. Crear Pull Request

## 📝 Licencia

Privado - Todos los derechos reservados

## 👥 Equipo

Desarrollado por el equipo de Experts

---

**Versión:** 0.1.0
**Última actualización:** 2025
