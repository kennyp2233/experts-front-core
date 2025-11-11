import { Box, Typography } from '@mui/material';

interface SidebarUserInfoProps {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export function SidebarUserInfo({ firstName = '', lastName = '', email = '' }: SidebarUserInfoProps) {
  return (
    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
        {firstName} {lastName}
      </Typography>
      <Typography variant="caption" color="text.secondary" noWrap>
        {email}
      </Typography>
    </Box>
  );
}
