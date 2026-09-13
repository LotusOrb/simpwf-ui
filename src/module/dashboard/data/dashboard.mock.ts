import type { IconType } from 'react-icons';
import { SiDropbox, SiFirebase, SiGmail, SiGoogledocs, SiGooglesheets, SiNotion, SiShopify } from 'react-icons/si';

export interface ExplorerItem {
	id: string;
	name: string;
	description: string;
	icon: IconType;
	iconColor: string;
	starred: boolean;
}

export interface ExplorerSection {
	id: string;
	label: string;
	items: ExplorerItem[];
}

export const explorerSections: ExplorerSection[] = [
	{ id: 'favorites', label: 'Favorites', items: [] },
	{
		id: 'integration',
		label: 'Integration',
		items: [
			{
				id: 'gmail',
				name: 'Gmail',
				description: 'Automate email communication',
				icon: SiGmail,
				iconColor: '#ea4335',
				starred: false,
			},
			{
				id: 'sheet',
				name: 'Sheet',
				description: 'Seamless data management',
				icon: SiGooglesheets,
				iconColor: '#0f9d58',
				starred: true,
			},
			{
				id: 'docs',
				name: 'Docs',
				description: 'Automatic document generation',
				icon: SiGoogledocs,
				iconColor: '#4285f4',
				starred: false,
			},
			{
				id: 'dropbox',
				name: 'Dropbox',
				description: 'File storage and sharing',
				icon: SiDropbox,
				iconColor: '#0061ff',
				starred: true,
			},
			{
				id: 'notion',
				name: 'Notion',
				description: 'Notes and data in one place',
				icon: SiNotion,
				iconColor: '#191919',
				starred: false,
			},
		],
	},
	{
		id: 'stores',
		label: 'Stores & Utility',
		items: [
			{
				id: 'firebase',
				name: 'Firebase',
				description: 'Connect to cloud storage',
				icon: SiFirebase,
				iconColor: '#ffa000',
				starred: false,
			},
			{
				id: 'shopify',
				name: 'Shopify',
				description: 'Sync orders across platforms',
				icon: SiShopify,
				iconColor: '#7ab55c',
				starred: false,
			},
		],
	},
];

export type StatTrend = 'up' | 'down';

export interface DashboardStat {
	id: string;
	label: string;
	value: string;
	delta: string;
	trend: StatTrend;
	upIsGood: boolean;
}

export const dashboardStats: DashboardStat[] = [
	{ id: 'runs', label: 'Total runs', value: '12,480', delta: '12.4%', trend: 'up', upIsGood: true },
	{ id: 'success', label: 'Success rate', value: '98.2%', delta: '0.6%', trend: 'up', upIsGood: true },
	{ id: 'duration', label: 'Avg. duration', value: '1.8s', delta: '4.1%', trend: 'down', upIsGood: false },
	{ id: 'failed', label: 'Failed runs', value: '224', delta: '8.3%', trend: 'up', upIsGood: false },
];

export interface RunsPoint {
	date: string;
	runs: number;
}

export const runsSeries: RunsPoint[] = [
	{ date: 'Sep 3', runs: 720 },
	{ date: 'Sep 4', runs: 810 },
	{ date: 'Sep 5', runs: 760 },
	{ date: 'Sep 6', runs: 540 },
	{ date: 'Sep 7', runs: 490 },
	{ date: 'Sep 8', runs: 880 },
	{ date: 'Sep 9', runs: 940 },
	{ date: 'Sep 10', runs: 910 },
	{ date: 'Sep 11', runs: 1020 },
	{ date: 'Sep 12', runs: 980 },
	{ date: 'Sep 13', runs: 690 },
	{ date: 'Sep 14', runs: 640 },
	{ date: 'Sep 15', runs: 1080 },
	{ date: 'Sep 16', runs: 1150 },
];

export type ExecutionStatus = 'success' | 'running' | 'failed';

export interface Execution {
	id: string;
	workflow: string;
	trigger: string;
	icon: IconType;
	iconColor: string;
	status: ExecutionStatus;
	duration: string;
	startedAt: string;
}

export const recentExecutions: Execution[] = [
	{
		id: 'ex-1',
		workflow: 'Client fills out the form',
		trigger: 'Google form',
		icon: SiGoogledocs,
		iconColor: '#7248b9',
		status: 'success',
		duration: '1.2s',
		startedAt: '2 min ago',
	},
	{
		id: 'ex-2',
		workflow: 'Store into database',
		trigger: 'Firebase',
		icon: SiFirebase,
		iconColor: '#ffa000',
		status: 'running',
		duration: '—',
		startedAt: '5 min ago',
	},
	{
		id: 'ex-3',
		workflow: 'Send onboarding email',
		trigger: 'Gmail',
		icon: SiGmail,
		iconColor: '#ea4335',
		status: 'failed',
		duration: '4.8s',
		startedAt: '18 min ago',
	},
	{
		id: 'ex-4',
		workflow: 'Tracking shopify orders',
		trigger: 'Shopify',
		icon: SiShopify,
		iconColor: '#7ab55c',
		status: 'success',
		duration: '2.1s',
		startedAt: '32 min ago',
	},
];

export const storageUsage = {
	uploadedGb: 12.4,
	reservedGb: 117.8,
	usedGb: 123.2,
	totalGb: 200,
};
