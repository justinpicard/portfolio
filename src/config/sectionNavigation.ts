export const SECTION_NAVIGATION_ITEMS = [
	{ id: 'intro', number: '01', labelKey: 'sectionNavigation.intro' },
	{ id: 'about', number: '02', labelKey: 'sectionNavigation.about' },
	{ id: 'work', number: '03', labelKey: 'sectionNavigation.work' },
	{ id: 'life', number: '04', labelKey: 'sectionNavigation.life' },
	{ id: 'say-hi', number: '05', labelKey: 'sectionNavigation.sayHi' }
] as const

export type SectionNavigationItem = typeof SECTION_NAVIGATION_ITEMS[number]
export type SectionNavigationId = SectionNavigationItem['id']

// Sections become active when their top crosses this portion of the viewport.
export const SECTION_NAVIGATION_ACTIVE_THRESHOLD = 0.4

// Adds breathing room around the longest item when the navigation is open.
export const SECTION_NAVIGATION_OPEN_EXTRA_WIDTH = 24
