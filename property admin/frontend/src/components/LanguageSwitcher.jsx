import { useTranslation } from 'react-i18next';
import { ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { Translate } from '@mui/icons-material';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleChange = (_, newLang) => {
    if (!newLang) return;
    i18n.changeLanguage(newLang);
    localStorage.setItem('lang', newLang);
  };

  return (
    <Tooltip title="Switch language">
      <ToggleButtonGroup
        value={i18n.language}
        exclusive
        onChange={handleChange}
        size="small"
        sx={{
          bgcolor: 'rgba(255,255,255,0.1)',
          '& .MuiToggleButton-root': {
            color: 'rgba(255,255,255,0.7)',
            border: 'none',
            px: 1.2,
            py: 0.4,
            fontSize: '0.75rem',
            fontWeight: 600,
            '&.Mui-selected': {
              bgcolor: 'rgba(255,255,255,0.25)',
              color: 'white',
            },
            '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
          },
        }}
      >
        <ToggleButton value="en" aria-label="English">EN</ToggleButton>
        <ToggleButton value="am" aria-label="አማርኛ">አማ</ToggleButton>
        <ToggleButton value="om" aria-label="Afaan Oromoo">OM</ToggleButton>
      </ToggleButtonGroup>
    </Tooltip>
  );
}
