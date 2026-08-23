import {
  CanopyIcon, ChairsIcon, TablesIcon, TentIcon, StageIcon, SoundIcon, DjIcon, LightingIcon,
  LedScreenIcon, ProjectorIcon, MicrophoneIcon, DecorationIcon, CoolingFanIcon, GeneratorIcon,
  ToiletIcon, PartyAccessoriesIcon,
  WeddingIcon, BirthdayIcon, ConferenceIcon, GraduationIcon, ConcertIcon, EngagementIcon,
  HousePartyIcon, MemorialIcon,
} from './domainIcons'

// Keyed by the exact `name` used in services/listings.js CATEGORIES
export const CATEGORY_ICONS = {
  Canopy: CanopyIcon,
  Chairs: ChairsIcon,
  Tables: TablesIcon,
  Tent: TentIcon,
  Stage: StageIcon,
  'Sound & AV': SoundIcon,
  'DJ Equipment': DjIcon,
  Lighting: LightingIcon,
  'LED Screens': LedScreenIcon,
  Projectors: ProjectorIcon,
  Microphones: MicrophoneIcon,
  Decoration: DecorationIcon,
  'Cooling Fans': CoolingFanIcon,
  Generators: GeneratorIcon,
  'Mobile Toilets': ToiletIcon,
  'Party Accessories': PartyAccessoriesIcon,
}

// Keyed by the exact `id` used in utils/eventChecklist.js EVENT_TYPES
export const EVENT_ICONS = {
  wedding: WeddingIcon,
  birthday: BirthdayIcon,
  conference: ConferenceIcon,
  graduation: GraduationIcon,
  concert: ConcertIcon,
  engagement: EngagementIcon,
  house_party: HousePartyIcon,
  burial: MemorialIcon,
}
