import {
	ActionIcon,
	Badge,
	Button,
	Card,
	createTheme,
	Input,
	Paper,
	rem,
	SegmentedControl,
	Select,
	Switch,
	TextInput,
	Tooltip,
	type MantineColorsTuple,
} from '@mantine/core';

const brand: MantineColorsTuple = [
	'#e9eef5',
	'#ccd8e8',
	'#9bb2d1',
	'#6a8bb8',
	'#42689b',
	'#2a4f7d',
	'#152f51',
	'#102642',
	'#0c1d33',
	'#081424',
];

export const themeOverride = createTheme({
	colors: { brand },
	primaryColor: 'brand',
	primaryShade: 6,
	fontFamily: '"Plus Jakarta Sans", sans-serif',
	headings: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '600' },
	defaultRadius: 'md',
	radius: { xs: rem(4), sm: rem(6), md: rem(10), lg: rem(14), xl: rem(20) },
	fontSizes: { xs: rem(12), sm: rem(14), md: rem(16), lg: rem(18), xl: rem(22) },
	shadows: {
		xs: '0 1px 2px rgb(16 24 40 / 4%)',
		sm: '0 1px 3px rgb(16 24 40 / 6%), 0 1px 2px rgb(16 24 40 / 4%)',
	},
	other: {
		surfaceMuted: '#f6f6f8',
		borderSubtle: '#ececf1',
	},
	components: {
		Button: Button.extend({ defaultProps: { radius: 'md', fw: 500 } }),
		ActionIcon: ActionIcon.extend({ defaultProps: { radius: 'md', variant: 'subtle', color: 'gray' } }),
		Card: Card.extend({ defaultProps: { radius: 'md', withBorder: true, shadow: 'xs', padding: 'md' } }),
		Paper: Paper.extend({ defaultProps: { radius: 'md' } }),
		Badge: Badge.extend({ defaultProps: { radius: 'sm', variant: 'light', tt: 'none', fw: 500 } }),
		Input: Input.extend({ defaultProps: { radius: 'md' } }),
		TextInput: TextInput.extend({ defaultProps: { radius: 'md' } }),
		Select: Select.extend({ defaultProps: { radius: 'md' } }),
		Switch: Switch.extend({ defaultProps: { size: 'md', withThumbIndicator: false } }),
		SegmentedControl: SegmentedControl.extend({
			defaultProps: { radius: 'md', color: 'brand', fullWidth: true },
		}),
		Tooltip: Tooltip.extend({ defaultProps: { withArrow: true, openDelay: 200 } }),
	},
});
