# Componentes UI Reutilizables

Esta carpeta contiene componentes UI reutilizables que centralizan estilos y comportamientos comunes en toda la aplicación.

## Componentes Disponibles

### 1. MasterDataCard

Card reutilizable para páginas de master data con estilos y animaciones consistentes.

**Uso:**
```tsx
import { MasterDataCard } from '@/shared/components/ui';

<MasterDataCard
  icon={<PersonIcon />}
  label="Clientes"
  description="Gestiona los clientes del sistema"
  color="#1976d2"
  onClick={() => router.push('/admin/master-data/clientes')}
/>
```

**Props:**
- `icon`: React.ReactNode - Ícono del card
- `label`: string - Título del card
- `description?`: string - Descripción opcional
- `color?`: string - Color del ícono (por defecto: primary.main)
- `onClick?`: () => void - Handler del click
- `sx?`: SxProps<Theme> - Estilos adicionales

**Características:**
- Animación de hover (translateY -4px)
- Border color cambia a primary.main en hover
- Background color con alpha en hover
- Icon container con background color alpha

---

### 2. CategorySection

Sección de categoría con header y grid de contenido.

**Uso:**
```tsx
import { CategorySection, MasterDataCard } from '@/shared/components/ui';

<CategorySection
  icon={<CategoryIcon />}
  title="Configuración"
  itemCount={5}
>
  <MasterDataCard {...props1} />
  <MasterDataCard {...props2} />
  {/* ... más cards */}
</CategorySection>
```

**Props:**
- `icon?`: React.ReactNode - Ícono de la categoría
- `title`: string - Título de la categoría
- `itemCount?`: number - Cantidad de elementos (muestra "X elemento(s)")
- `children`: React.ReactNode - Contenido del grid
- `sx?`: SxProps<Theme> - Estilos adicionales

**Características:**
- Header con border bottom
- Grid responsivo (1 col en xs, 2 en sm, 3 en md, 4 en lg)
- Gap de 2.5 entre elementos

---

### 3. MasterDataDialog

Dialog reutilizable con estilos consistentes para formularios.

**Uso:**
```tsx
import { MasterDataDialog } from '@/shared/components/ui';

<MasterDataDialog
  open={open}
  onClose={handleClose}
  title="Crear Cliente"
  size="lg"
  actions={
    <>
      <Button onClick={handleClose}>Cancelar</Button>
      <Button variant="contained" onClick={handleSave}>Guardar</Button>
    </>
  }
>
  {/* Contenido del formulario */}
</MasterDataDialog>
```

**Props:**
- `title?`: React.ReactNode - Título del dialog
- `children`: React.ReactNode - Contenido del dialog
- `actions?`: React.ReactNode - Botones del footer
- `header?`: React.ReactNode - Header personalizado (reemplaza title)
- `footer?`: React.ReactNode - Footer personalizado (reemplaza actions)
- `contentSx?`: SxProps<Theme> - Estilos del DialogContent
- `titleSx?`: SxProps<Theme> - Estilos del DialogTitle
- `size?`: 'sm' | 'md' | 'lg' | 'xl' - Tamaño del dialog (default: 'lg')
- Hereda todos los props de MUI Dialog

**Características:**
- Border radius de 3
- Box shadow de 24
- Max height de 95vh
- Content scrollable con flex layout
- Header y footer con flexShrink: 0

---

### 4. PageHeader

Header de página con título, subtítulo y acciones.

**Uso:**
```tsx
import { PageHeader } from '@/shared/components/ui';

<PageHeader
  title="Datos Maestros"
  subtitle="Gestiona la información base del sistema"
  gradient
  actions={
    <Button variant="contained" onClick={handleNew}>
      Nuevo
    </Button>
  }
/>
```

**Props:**
- `title`: string - Título de la página
- `subtitle?`: string - Subtítulo opcional
- `gradient?`: boolean - Aplica gradiente de color al título (default: false)
- `actions?`: React.ReactNode - Acciones a la derecha del header
- `sx?`: SxProps<Theme> - Estilos adicionales

**Características:**
- Título con h3 variant, fontWeight 700
- Gradiente opcional (primary.main -> secondary.main)
- Subtítulo con max-width de 700px
- Layout flex con espacio entre título y acciones

---

### 5. FormTabs

Tabs reutilizables para formularios con estilos consistentes.

**Uso:**
```tsx
import { FormTabs } from '@/shared/components/ui';

const tabs = [
  { key: 'general', label: 'General' },
  { key: 'config', label: 'Configuración' },
];

<FormTabs
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>
```

**Props:**
- `tabs`: FormTab[] - Array de tabs ({ key: string, label: string })
- `activeTab`: number - Índice del tab activo
- `onTabChange`: (newTab: number) => void - Handler del cambio de tab
- `sx?`: SxProps<Theme> - Estilos adicionales
- Hereda todos los props de MUI Tabs

**Características:**
- Variant fullWidth
- Border bottom con divider color
- Tab font weight 500 (normal), 600 (selected)
- Text transform none
- Margin bottom de 2

---

## Buenas Prácticas

1. **Siempre usar estos componentes** en lugar de crear estilos inline similares
2. **Extender con sx prop** cuando necesites estilos adicionales específicos
3. **No duplicar estilos** - Si necesitas un nuevo patrón, agrégalo aquí
4. **Mantener consistencia** - Usa los mismos espaciados, colores y transiciones

## Ejemplos Completos

### Página de Master Data con Cards
```tsx
import { Container } from '@mui/material';
import { MasterDataCard, CategorySection, PageHeader } from '@/shared/components/ui';

export default function MasterDataPage() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader
        title="Datos Maestros"
        subtitle="Gestiona la información base del sistema"
        gradient
      />

      <CategorySection
        icon={<SettingsIcon />}
        title="Configuración"
        itemCount={3}
      >
        <MasterDataCard
          icon={<PersonIcon />}
          label="Clientes"
          description="Gestiona los clientes"
          onClick={() => router.push('/clientes')}
        />
        {/* Más cards... */}
      </CategorySection>
    </Container>
  );
}
```

### Formulario con Dialog y Tabs
```tsx
import { MasterDataDialog, FormTabs } from '@/shared/components/ui';

export function MyForm({ open, onClose }) {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { key: 'general', label: 'General' },
    { key: 'advanced', label: 'Avanzado' },
  ];

  return (
    <MasterDataDialog
      open={open}
      onClose={onClose}
      title="Crear Elemento"
      size="lg"
      actions={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="contained">Guardar</Button>
        </>
      }
    >
      <form>
        <FormTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        {/* Contenido del tab activo */}
      </form>
    </MasterDataDialog>
  );
}
```

## Migración de Código Existente

Si encuentras código con estilos inline similares a estos componentes:

1. **Identifica el patrón** - ¿Es un card, dialog, header?
2. **Reemplaza con el componente** - Usa el componente reutilizable
3. **Mueve estilos específicos a sx** - Solo los que son únicos para ese caso
4. **Verifica el resultado** - Asegúrate que se ve igual o mejor

**Antes:**
```tsx
<Card
  elevation={0}
  sx={{
    height: '100%',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    border: 1,
    borderColor: 'divider',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: 6,
      // ... más estilos
    },
  }}
>
  {/* Contenido */}
</Card>
```

**Después:**
```tsx
<MasterDataCard
  icon={icon}
  label={label}
  description={description}
  onClick={onClick}
/>
```
