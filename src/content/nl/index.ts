import type { PortfolioContentOverrides } from '../types'
import about from './about'
import hero from './hero'
import footer from './footer'

const nl: PortfolioContentOverrides = {
	home: {
		hero,
		about,
		footer
	},
	projects: []
}

export default nl
