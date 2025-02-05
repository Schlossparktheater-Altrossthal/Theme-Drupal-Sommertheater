// Defines custom Storybook theme.
import { addons } from '@storybook/manager-api';
import MercuryTheme from './mercury-theme';

addons.setConfig({
  theme: MercuryTheme,
});
