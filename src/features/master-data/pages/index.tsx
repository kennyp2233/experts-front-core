'use client';

import { Container } from '@mui/material';
import { useRouter } from 'next/navigation';
import { getAvailableEntitiesByCategory, MASTER_DATA_CATEGORIES } from '../configs';
import { MasterDataCard, CategorySection, PageHeader } from '@/shared/components/ui';

export default function MasterDataPage() {
  const router = useRouter();
  const categorizedOptions = getAvailableEntitiesByCategory();

  const handleCardClick = (href: string) => {
    router.push(href);
  };

  const renderCategorySection = (category: typeof MASTER_DATA_CATEGORIES[0]) => {
    if (category.entities.length === 0) return null;

    return (
      <CategorySection
        key={category.title}
        icon={category.icon}
        title={category.title}
        itemCount={category.entities.length}
      >
        {category.entities.map((entity) => (
          <MasterDataCard
            key={entity.id}
            icon={entity.icon}
            label={entity.label}
            description={entity.description}
            color={entity.color}
            onClick={() => handleCardClick(entity.href)}
          />
        ))}
      </CategorySection>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader
        title="Datos Maestros"
        subtitle="Gestiona la información base del sistema. Selecciona una categoría para administrar sus elementos."
        gradient
      />

      {MASTER_DATA_CATEGORIES.map((category) => renderCategorySection(category))}
    </Container>
  );
}