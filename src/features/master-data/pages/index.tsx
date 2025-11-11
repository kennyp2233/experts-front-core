'use client';

import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Container,
  Chip,
  alpha,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { getAvailableEntitiesByCategory, MASTER_DATA_CATEGORIES } from '../configs';

export default function MasterDataPage() {
  const router = useRouter();
  const categorizedOptions = getAvailableEntitiesByCategory();

  const handleCardClick = (href: string) => {
    router.push(href);
  };

  const renderCategorySection = (category: typeof MASTER_DATA_CATEGORIES[0]) => {
    if (category.entities.length === 0) return null;

    return (
      <Box key={category.title} sx={{ mb: 6 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 3,
            pb: 2,
            borderBottom: 2,
            borderColor: 'divider',
          }}
        >
          <Box 
            sx={{ 
              mr: 2.5, 
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              fontSize: '2rem',
            }}
          >
            {category.icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 0.5 }}>
              {category.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {category.entities.length} {category.entities.length === 1 ? 'elemento' : 'elementos'}
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: 2.5,
          }}
        >
          {category.entities.map((entity) => (
            <Card
              key={entity.id}
              elevation={0}
              sx={{
                height: '100%',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: 1,
                borderColor: 'divider',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                  borderColor: 'primary.main',
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
                },
              }}
            >
              <CardActionArea
                onClick={() => handleCardClick(entity.href)}
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  p: 2.5,
                }}
              >
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      bgcolor: (theme) => alpha(entity.color || theme.palette.primary.main, 0.1),
                      color: entity.color || 'primary.main',
                      mb: 2,
                      fontSize: '1.75rem',
                    }}
                  >
                    {entity.icon}
                  </Box>
                  <Typography 
                    variant="h6" 
                    component="h3" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 1,
                      fontSize: '1.1rem',
                    }}
                  >
                    {entity.label}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.5,
                    }}
                  >
                    {entity.description}
                  </Typography>
                </Box>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 5 }}>
        <Typography 
          variant="h3" 
          component="h1" 
          sx={{ 
            fontWeight: 700, 
            mb: 1.5,
            background: (theme) => 
              `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Datos Maestros
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ 
            fontSize: '1.1rem',
            maxWidth: 700,
          }}
        >
          Gestiona la información base del sistema. Selecciona una categoría para administrar sus elementos.
        </Typography>
      </Box>

      {MASTER_DATA_CATEGORIES.map((category) => renderCategorySection(category))}
    </Container>
  );
}