// ─────────────────────────────────────────────────────────────────────────────
// lib/networks.ts
// Single source of truth for all distribution network partner data.
// Used by: map components, Anathema API (chain resolution), AnathemaPanel (autocomplete)
// ─────────────────────────────────────────────────────────────────────────────

export type NetworkPartner = {
  id: number
  name: string
  city: string
  state: string
  coords: [number, number]
  website: string
  segment?: string  // AmeriLife and SMS have segments; Integrity does not
  tree: 'integrity' | 'amerilife' | 'sms'
  // Search aliases — alternate names, abbreviations, or known DBAs for this partner.
  // Used by the chain resolver to broaden SERP matching beyond the canonical name.
  aliases?: string[]
}

// ─── STATE NEIGHBOR MAP ──────────────────────────────────────────────────────
// Used by chain resolver to expand search to adjacent states when no in-state
// match is found. Agents frequently cross state lines for their upline.
export const STATE_NEIGHBORS: Record<string, string[]> = {
  AL: ['FL', 'GA', 'TN', 'MS'],
  AK: [],
  AZ: ['CA', 'NV', 'UT', 'CO', 'NM'],
  AR: ['MO', 'TN', 'MS', 'LA', 'TX', 'OK'],
  CA: ['OR', 'NV', 'AZ'],
  CO: ['WY', 'NE', 'KS', 'OK', 'NM', 'AZ', 'UT'],
  CT: ['NY', 'MA', 'RI'],
  DE: ['MD', 'PA', 'NJ'],
  FL: ['GA', 'AL'],
  GA: ['FL', 'AL', 'TN', 'NC', 'SC'],
  HI: [],
  ID: ['MT', 'WY', 'UT', 'NV', 'OR', 'WA'],
  IL: ['WI', 'IA', 'MO', 'KY', 'IN'],
  IN: ['MI', 'OH', 'KY', 'IL'],
  IA: ['MN', 'WI', 'IL', 'MO', 'NE', 'SD'],
  KS: ['NE', 'MO', 'OK', 'CO'],
  KY: ['OH', 'WV', 'VA', 'TN', 'MO', 'IL', 'IN'],
  LA: ['TX', 'AR', 'MS'],
  ME: ['NH'],
  MD: ['PA', 'DE', 'WV', 'VA'],
  MA: ['RI', 'CT', 'NY', 'NH', 'VT'],
  MI: ['OH', 'IN', 'WI'],
  MN: ['WI', 'IA', 'SD', 'ND'],
  MS: ['TN', 'AL', 'LA', 'AR'],
  MO: ['IA', 'IL', 'KY', 'TN', 'AR', 'OK', 'KS', 'NE'],
  MT: ['ID', 'WY', 'SD', 'ND'],
  NE: ['SD', 'IA', 'MO', 'KS', 'CO', 'WY'],
  NV: ['OR', 'ID', 'UT', 'AZ', 'CA'],
  NH: ['VT', 'ME', 'MA'],
  NJ: ['NY', 'PA', 'DE'],
  NM: ['CO', 'OK', 'TX', 'AZ'],
  NY: ['VT', 'MA', 'CT', 'NJ', 'PA'],
  NC: ['VA', 'TN', 'GA', 'SC'],
  ND: ['MT', 'SD', 'MN'],
  OH: ['PA', 'WV', 'KY', 'IN', 'MI'],
  OK: ['KS', 'MO', 'AR', 'TX', 'NM', 'CO'],
  OR: ['WA', 'ID', 'NV', 'CA'],
  PA: ['NY', 'NJ', 'DE', 'MD', 'WV', 'OH'],
  RI: ['CT', 'MA'],
  SC: ['NC', 'GA'],
  SD: ['ND', 'MN', 'IA', 'NE', 'WY', 'MT'],
  TN: ['KY', 'VA', 'NC', 'GA', 'AL', 'MS', 'AR', 'MO'],
  TX: ['NM', 'OK', 'AR', 'LA'],
  UT: ['ID', 'WY', 'CO', 'NM', 'AZ', 'NV'],
  VT: ['NY', 'NH', 'MA'],
  VA: ['MD', 'WV', 'KY', 'TN', 'NC'],
  WA: ['OR', 'ID'],
  WV: ['OH', 'PA', 'MD', 'VA', 'KY'],
  WI: ['MN', 'MI', 'IL', 'IA'],
  WY: ['MT', 'SD', 'NE', 'CO', 'UT', 'ID'],
  DC: ['MD', 'VA'],
}

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRITY MARKETING GROUP — 181 partners
// ─────────────────────────────────────────────────────────────────────────────
export const INTEGRITY_PARTNERS: NetworkPartner[] = [
  { id: 1,   tree: 'integrity', name: 'Premier Marketing',                  city: 'Norfolk',           state: 'NE', coords: [-97.4,   42.0],  website: 'premiersmi.com' },
  { id: 2,   tree: 'integrity', name: 'American Benefit LLC',               city: 'La Crosse',         state: 'WI', coords: [-91.25,  43.8],  website: 'americanbenefitllc.com' },
  { id: 3,   tree: 'integrity', name: 'AIMC',                               city: 'Woodstock',         state: 'GA', coords: [-84.5,   34.1],  website: 'aimc.net' },
  { id: 4,   tree: 'integrity', name: 'Neishloss & Fleming',                city: 'Canonsburg',        state: 'PA', coords: [-80.2,   40.3],  website: 'neishloss.com' },
  { id: 5,   tree: 'integrity', name: 'Insurance Marketing Group',          city: 'Clinton',           state: 'CT', coords: [-72.5,   41.3],  website: 'img-sis.com', aliases: ['IMG'] },
  { id: 6,   tree: 'integrity', name: 'American Independent Marketing',     city: 'Yakima',            state: 'WA', coords: [-120.5,  46.6],  website: 'whyaim.com', aliases: ['AIM'] },
  { id: 7,   tree: 'integrity', name: 'Western Penn Marketing',             city: 'Mesa',              state: 'AZ', coords: [-111.8,  33.4],  website: 'westernpenn.com' },
  { id: 8,   tree: 'integrity', name: 'GoldenCare USA',                     city: 'Plymouth',          state: 'MN', coords: [-93.45,  45.0],  website: 'goldencareagent.com' },
  { id: 9,   tree: 'integrity', name: 'Cornerstone Senior Marketing',       city: 'Powell',            state: 'OH', coords: [-83.07,  40.15], website: 'cornerstoneseniormarketing.com' },
  { id: 10,  tree: 'integrity', name: 'Agent Service Connection',           city: 'Sarasota',          state: 'FL', coords: [-82.5,   27.3],  website: 'ascfinalexpense.com', aliases: ['ASC'] },
  { id: 11,  tree: 'integrity', name: 'Scott Riddle Agency',                city: 'Waco',              state: 'TX', coords: [-97.15,  31.55], website: 'scottriddleagency.com' },
  { id: 12,  tree: 'integrity', name: 'EIS Eldercare Insurance Services',   city: 'Hot Springs',       state: 'AR', coords: [-93.05,  34.5],  website: 'eldercarebroker.com', aliases: ['EIS'] },
  { id: 13,  tree: 'integrity', name: 'Tidewater Management',               city: 'Raleigh',           state: 'NC', coords: [-78.64,  35.78], website: 'tidewatermg.com' },
  { id: 14,  tree: 'integrity', name: 'NEAT Management Group',              city: 'Austin',            state: 'TX', coords: [-97.73,  30.26], website: 'neatmgmt.com', aliases: ['NEAT'] },
  { id: 15,  tree: 'integrity', name: 'Senior Select',                      city: 'LaGrange',          state: 'GA', coords: [-85.03,  33.04], website: 'seniorselectins.com' },
  { id: 16,  tree: 'integrity', name: 'MultiState Insurance',               city: 'Grand Haven',       state: 'MI', coords: [-86.22,  43.06], website: 'multistateinsurance.com' },
  { id: 17,  tree: 'integrity', name: 'Savers Marketing',                   city: 'Winston-Salem',     state: 'NC', coords: [-80.24,  36.1],  website: 'saversmarketing.com' },
  { id: 18,  tree: 'integrity', name: 'Emrick Group',                       city: 'Griggsville',       state: 'IL', coords: [-90.72,  39.7],  website: 'emrickgroup.com' },
  { id: 19,  tree: 'integrity', name: 'American Senior Benefits',           city: 'Olathe',            state: 'KS', coords: [-94.82,  38.88], website: 'americanseniorbenefits.com', aliases: ['ASB'] },
  { id: 20,  tree: 'integrity', name: 'Senior Insurance Brokers',           city: 'Fort Worth',        state: 'TX', coords: [-97.33,  32.75], website: 'seniorinsbrokers.com' },
  { id: 21,  tree: 'integrity', name: 'Pinnacle Benefits Group',            city: 'Winston-Salem',     state: 'NC', coords: [-80.3,   36.2],  website: 'pinnaclebenefits.com' },
  { id: 22,  tree: 'integrity', name: 'Drennan Insurance Marketing',        city: 'Little Rock',       state: 'AR', coords: [-92.29,  34.75], website: 'drennancompanies.com' },
  { id: 23,  tree: 'integrity', name: 'MAS Insurance Marketing',            city: 'Hoover',            state: 'AL', coords: [-86.8,   33.4],  website: 'masinsurancemarketing.com', aliases: ['MAS'] },
  { id: 24,  tree: 'integrity', name: 'Family First Life',                  city: 'Uncasville',        state: 'CT', coords: [-72.1,   41.45], website: 'familyfirstlife.com', aliases: ['FFL'] },
  { id: 25,  tree: 'integrity', name: 'Your Insurance Group',               city: 'Melbourne',         state: 'FL', coords: [-80.6,   28.08], website: 'yourinsurancegroup.net' },
  { id: 26,  tree: 'integrity', name: 'Great American Legacy',              city: 'Cedar Rapids',      state: 'IA', coords: [-91.67,  42.0],  website: 'americanseniorbenefits.com' },
  { id: 27,  tree: 'integrity', name: 'North American Senior Benefits',     city: 'Lawrenceville',     state: 'GA', coords: [-83.99,  33.96], website: 'nasbinc.com', aliases: ['NASB'] },
  { id: 28,  tree: 'integrity', name: 'Senior Solutions',                   city: 'Omaha',             state: 'NE', coords: [-95.93,  41.26], website: 'americanseniorbenefits.com' },
  { id: 29,  tree: 'integrity', name: 'Agent Pipeline',                     city: 'St. Albans',        state: 'WV', coords: [-81.85,  38.38], website: 'agentpipeline.com' },
  { id: 30,  tree: 'integrity', name: 'ThomasArts',                         city: 'Farmington',        state: 'UT', coords: [-111.9,  40.98], website: 'thomasarts.com' },
  { id: 31,  tree: 'integrity', name: 'Palmetto Senior Benefits',           city: 'Greer',             state: 'SC', coords: [-82.15,  34.93], website: 'palmettosb.com' },
  { id: 32,  tree: 'integrity', name: 'Family First Life USA',              city: 'Las Vegas',         state: 'NV', coords: [-115.14, 36.17], website: 'familyfirstlifeusa.com', aliases: ['FFL USA'] },
  { id: 33,  tree: 'integrity', name: 'LifeSmart Senior Services',          city: 'Elgin',             state: 'IL', coords: [-88.28,  42.03], website: 'lifesmartseniorservices.com' },
  { id: 34,  tree: 'integrity', name: 'Family First Life Southeast',        city: 'Kennesaw',          state: 'GA', coords: [-84.61,  34.02], website: 'familyfirstlifesoutheast.com', aliases: ['FFL Southeast'] },
  { id: 35,  tree: 'integrity', name: 'The Brokerage Resource',             city: 'Apex',              state: 'NC', coords: [-78.85,  35.73], website: 'tbrins.com', aliases: ['TBR'] },
  { id: 36,  tree: 'integrity', name: 'Equis Financial',                    city: 'Asheville',         state: 'NC', coords: [-82.55,  35.57], website: 'equisfinancial.com', aliases: ['Equis'] },
  { id: 37,  tree: 'integrity', name: 'Senior Benefit Services',            city: 'Columbia',          state: 'MO', coords: [-92.33,  38.95], website: 'sbsteam.net', aliases: ['SBS'] },
  { id: 38,  tree: 'integrity', name: 'Senior Marketing Specialists',       city: 'Columbia',          state: 'MO', coords: [-92.28,  38.9],  website: 'smsteam.net', aliases: ['SMS Team'] },
  { id: 39,  tree: 'integrity', name: 'The Alliance',                       city: 'Burlington',        state: 'NC', coords: [-79.44,  36.1],  website: 'naaleads.com' },
  { id: 40,  tree: 'integrity', name: 'McClain Insurance',                  city: 'Hesperia',          state: 'CA', coords: [-117.3,  34.43], website: 'fflwestcoast.com', aliases: ['FFL West Coast'] },
  { id: 41,  tree: 'integrity', name: 'New Horizons Insurance Marketing',   city: 'Decatur',           state: 'IL', coords: [-88.95,  39.84], website: 'newhorizonsmktg.com' },
  { id: 42,  tree: 'integrity', name: 'Heartland Retirement Group',         city: 'Johnston',          state: 'IA', coords: [-93.72,  41.68], website: 'yourhrg.com', aliases: ['HRG'] },
  { id: 43,  tree: 'integrity', name: 'ASB Financial',                      city: 'Tampa',             state: 'FL', coords: [-82.46,  27.95], website: 'asbfinancial.com' },
  { id: 44,  tree: 'integrity', name: 'Southern Insurance Group',           city: 'Lawrenceburg',      state: 'TN', coords: [-87.33,  35.25], website: 'southerninsurance.net' },
  { id: 45,  tree: 'integrity', name: 'The Assurance Group',                city: 'Archdale',          state: 'NC', coords: [-79.96,  35.9],  website: 'assuregrp.com', aliases: ['TAG'] },
  { id: 46,  tree: 'integrity', name: 'Insurance Administrative Solutions', city: 'Clearwater',        state: 'FL', coords: [-82.8,   27.97], website: 'iasadmin.com', aliases: ['IAS'] },
  { id: 47,  tree: 'integrity', name: 'The Health Insurance Place',         city: 'Johnstown',         state: 'PA', coords: [-78.92,  40.33], website: 'thehealthinsuranceplace.com' },
  { id: 48,  tree: 'integrity', name: 'Western Asset Protection',           city: 'Phoenix',           state: 'AZ', coords: [-112.07, 33.45], website: 'westernassetprotection.com', aliases: ['WAP'] },
  { id: 49,  tree: 'integrity', name: 'Smith Agency',                       city: 'Vancouver',         state: 'WA', coords: [-122.66, 45.63], website: 'fflinw.com', aliases: ['FFL NW', 'FFL Northwest'] },
  { id: 50,  tree: 'integrity', name: 'American Group',                     city: 'Dallas',            state: 'TX', coords: [-96.8,   32.78], website: 'americangroupinsurance.com' },
  { id: 51,  tree: 'integrity', name: 'Best Value Insurance Services',      city: 'Ferndale',          state: 'WA', coords: [-122.6,  48.85], website: 'bestvaluesins.com' },
  { id: 52,  tree: 'integrity', name: 'IFC National Marketing',             city: 'Coon Rapids',       state: 'MN', coords: [-93.31,  45.12], website: 'ifcnationalmarketing.com', aliases: ['IFC'] },
  { id: 53,  tree: 'integrity', name: 'Connexion Point',                    city: 'Sandy',             state: 'UT', coords: [-111.86, 40.57], website: 'connexionpoint.com' },
  { id: 54,  tree: 'integrity', name: 'CSG Actuarial',                      city: 'Omaha',             state: 'NE', coords: [-96.0,   41.3],  website: 'csgactuarial.com', aliases: ['CSG'] },
  { id: 55,  tree: 'integrity', name: 'Priority Life',                      city: 'Boca Raton',        state: 'FL', coords: [-80.1,   26.35], website: 'prioritylifegroup.com' },
  { id: 56,  tree: 'integrity', name: 'Advisors Insurance Brokers',         city: 'Clifton Park',      state: 'NY', coords: [-73.84,  42.86], website: 'advisorsib.com' },
  { id: 57,  tree: 'integrity', name: 'J. Berg & Associates',               city: 'St. Louis',         state: 'MO', coords: [-90.19,  38.63], website: 'jbergassociates.com' },
  { id: 58,  tree: 'integrity', name: 'Copeland Insurance Group',           city: 'Longview',          state: 'TX', coords: [-94.74,  32.5],  website: 'copelandgroupusa.com' },
  { id: 59,  tree: 'integrity', name: 'MERIT Insurance Services',           city: 'West Hartford',     state: 'CT', coords: [-72.74,  41.76], website: 'meritins.com', aliases: ['MERIT'] },
  { id: 60,  tree: 'integrity', name: 'Access Capital Group',               city: 'Omaha',             state: 'NE', coords: [-95.9,   41.2],  website: 'accesscapitalgrp.com' },
  { id: 61,  tree: 'integrity', name: 'Brokers International',              city: 'Urbandale',         state: 'IA', coords: [-93.71,  41.63], website: 'biltd.com' },
  { id: 62,  tree: 'integrity', name: 'Modern Insurance Marketing',         city: 'Wilsonville',       state: 'OR', coords: [-122.77, 45.3],  website: 'moderninsurance.com' },
  { id: 63,  tree: 'integrity', name: 'Kellogg Insurance Partners',         city: 'Draper',            state: 'UT', coords: [-111.86, 40.52], website: 'kelloggins.com' },
  { id: 64,  tree: 'integrity', name: 'Polcyn Insurance',                   city: 'Mesa',              state: 'AZ', coords: [-111.7,  33.42], website: 'polcynfinancial.com' },
  { id: 65,  tree: 'integrity', name: 'Deft Research',                      city: 'Minneapolis',       state: 'MN', coords: [-93.27,  44.98], website: 'deftresearch.com' },
  { id: 66,  tree: 'integrity', name: 'Plan Advisors',                      city: 'Doral',             state: 'FL', coords: [-80.35,  25.82], website: 'myplanadvisors.com' },
  { id: 67,  tree: 'integrity', name: 'Anthony Insurance Agency',           city: 'Boca Raton',        state: 'FL', coords: [-80.12,  26.38], website: 'familyfirstlife.com' },
  { id: 68,  tree: 'integrity', name: 'PSI Groups',                         city: 'Celebration',       state: 'FL', coords: [-81.55,  28.32], website: 'psigroups.net', aliases: ['PSI'] },
  { id: 69,  tree: 'integrity', name: 'Unified Health',                     city: 'Sunrise',           state: 'FL', coords: [-80.26,  26.17], website: 'unifiedhealth.com' },
  { id: 70,  tree: 'integrity', name: 'ASPECT Management',                  city: 'Columbia',          state: 'SC', coords: [-81.03,  34.0],  website: 'aspect-mgmt.com', aliases: ['ASPECT'] },
  { id: 71,  tree: 'integrity', name: 'Advanced Planning Services',         city: 'Brown Deer',        state: 'WI', coords: [-87.97,  43.17], website: 'advanceps.com', aliases: ['APS'] },
  { id: 72,  tree: 'integrity', name: 'Agent Force',                        city: 'Kennesaw',          state: 'GA', coords: [-84.59,  34.04], website: 'fflagentforce.com', aliases: ['FFL Agent Force'] },
  { id: 73,  tree: 'integrity', name: 'Family First Life AMS',              city: "Coeur d'Alene",     state: 'ID', coords: [-116.78, 47.68], website: 'fflams.com', aliases: ['FFL AMS'] },
  { id: 74,  tree: 'integrity', name: 'Health Insurance Store',             city: 'Kissimmee',         state: 'FL', coords: [-81.41,  28.29], website: '4insurancestore.com' },
  { id: 75,  tree: 'integrity', name: 'The Cornerstone Group',              city: 'Wake Forest',       state: 'NC', coords: [-78.51,  35.97], website: 'thecornerstonegroup.life' },
  { id: 76,  tree: 'integrity', name: 'Theodore Group',                     city: 'Cape Coral',        state: 'FL', coords: [-81.99,  26.65], website: 'theodoregroup.info' },
  { id: 77,  tree: 'integrity', name: 'Montalto United Insurance Agency',   city: 'Fort Walton Beach', state: 'FL', coords: [-86.62,  30.41], website: 'fflunited.com', aliases: ['FFL United'] },
  { id: 78,  tree: 'integrity', name: 'Carolina Senior Marketing',          city: 'Cary',              state: 'NC', coords: [-78.78,  35.79], website: 'carolinaseniormarketing.com' },
  { id: 79,  tree: 'integrity', name: 'The Leazer Group',                   city: 'Raleigh',           state: 'NC', coords: [-78.7,   35.82], website: 'leazergroup.com' },
  { id: 80,  tree: 'integrity', name: "Michael O'Brien Insurance",          city: 'Mayfield',          state: 'NY', coords: [-74.26,  43.1],  website: 'ob1insurance.com' },
  { id: 81,  tree: 'integrity', name: 'Senior Security Benefits',           city: 'Fort Worth',        state: 'TX', coords: [-97.37,  32.72], website: 'seniorsecuritybenefits.com' },
  { id: 82,  tree: 'integrity', name: 'Universe Financial Insurance Svc',   city: 'Naperville',        state: 'IL', coords: [-88.15,  41.77], website: 'ffluniverse.com', aliases: ['FFL Universe'] },
  { id: 83,  tree: 'integrity', name: 'GarityAdvantage',                    city: 'Norwell',           state: 'MA', coords: [-70.8,   42.16], website: 'garityadvantage.com', aliases: ['Garity'] },
  { id: 84,  tree: 'integrity', name: 'Star Benefit Associates',            city: 'Indianapolis',      state: 'IN', coords: [-86.15,  39.77], website: 'starbenefitassociates.com' },
  { id: 85,  tree: 'integrity', name: 'Berwick Insurance Group',            city: 'Tucson',            state: 'AZ', coords: [-110.93, 32.22], website: 'berwickinsurance.com' },
  { id: 86,  tree: 'integrity', name: 'One Resource Group',                 city: 'Roanoke',           state: 'IN', coords: [-85.37,  40.96], website: 'oneresourcegroup.com', aliases: ['ORG'] },
  { id: 87,  tree: 'integrity', name: 'Twardowski Insurance Agency',        city: 'Denver',            state: 'CO', coords: [-104.99, 39.74], website: 'fflmilehigh.com', aliases: ['FFL Mile High'] },
  { id: 88,  tree: 'integrity', name: 'Oberlin Marketing',                  city: 'Fort Wayne',        state: 'IN', coords: [-85.14,  41.08], website: 'oberlinmarketing.com' },
  { id: 89,  tree: 'integrity', name: 'Aegis Financial',                    city: 'Denver',            state: 'CO', coords: [-104.95, 39.7],  website: 'aegisfinancial.com' },
  { id: 90,  tree: 'integrity', name: 'Fidelis Consultants',                city: 'Gilbert',           state: 'AZ', coords: [-111.79, 33.35], website: 'fidelisins.com' },
  { id: 91,  tree: 'integrity', name: 'WealthFirm',                         city: 'Norfolk',           state: 'NE', coords: [-97.42,  42.03], website: 'wealthfirm.info' },
  { id: 92,  tree: 'integrity', name: 'Brokerage 1 Agency',                 city: 'Brunswick',         state: 'OH', coords: [-81.84,  41.24], website: 'brokerage1agency.com' },
  { id: 93,  tree: 'integrity', name: 'D&D Insurance',                      city: 'Ferndale',          state: 'WA', coords: [-122.59, 48.84], website: 'danddinsurance.com' },
  { id: 94,  tree: 'integrity', name: 'Shields Brokerage',                  city: 'Exeter',            state: 'NH', coords: [-70.95,  42.98], website: 'shieldsbrokerage.com' },
  { id: 95,  tree: 'integrity', name: 'Modern District Financial',          city: 'Traverse City',     state: 'MI', coords: [-85.62,  44.76], website: 'moderndistrict.com' },
  { id: 96,  tree: 'integrity', name: 'Community Connections',              city: 'Manchester',        state: 'KY', coords: [-83.76,  37.15], website: 'communityconnections.live' },
  { id: 97,  tree: 'integrity', name: 'Golden Years Design Benefits',       city: 'Freehold',          state: 'NJ', coords: [-74.28,  40.26], website: 'yourmedicaremarketplace.net' },
  { id: 98,  tree: 'integrity', name: 'DuBose Senior Insurance Marketing',  city: 'Florence',          state: 'SC', coords: [-79.78,  34.2],  website: 'duboseseniorinsurance.com' },
  { id: 99,  tree: 'integrity', name: 'The Fitz Group',                     city: 'Addison',           state: 'TX', coords: [-96.83,  32.96], website: 'thefitzgroup.org' },
  { id: 100, tree: 'integrity', name: 'Stateline Senior Services',          city: 'Somers',            state: 'CT', coords: [-72.43,  41.99], website: 'statelineseniorservices.com' },
  { id: 101, tree: 'integrity', name: 'Golden State Insurance Agency',      city: 'Carlsbad',          state: 'CA', coords: [-117.35, 33.16], website: 'fflgoldenstate.com', aliases: ['FFL Golden State'] },
  { id: 102, tree: 'integrity', name: 'Brokers Clearing House',             city: 'Des Moines',        state: 'IA', coords: [-93.62,  41.6],  website: 'bchlife.com', aliases: ['BCH'] },
  { id: 103, tree: 'integrity', name: 'PIPAC Health & Life Insurance',      city: 'Cedar Falls',       state: 'IA', coords: [-92.45,  42.53], website: 'pipac.com', aliases: ['PIPAC'] },
  { id: 104, tree: 'integrity', name: 'Northwest Farmer-Stockman',          city: 'Spokane',           state: 'WA', coords: [-117.43, 47.66], website: 'northwestfarmerstockman.com' },
  { id: 105, tree: 'integrity', name: 'The Diversified Companies',          city: 'Parsippany',        state: 'NJ', coords: [-74.42,  40.86], website: 'thediv.com' },
  { id: 106, tree: 'integrity', name: 'Schmidt Insurance Services',         city: 'Ellington',         state: 'CT', coords: [-72.47,  41.9],  website: 'fflnortheast.com', aliases: ['FFL Northeast'] },
  { id: 107, tree: 'integrity', name: 'Maryland Life Insurance Services',   city: 'Bel Air',           state: 'MD', coords: [-76.35,  39.54], website: 'fflnational.com', aliases: ['FFL National'] },
  { id: 108, tree: 'integrity', name: 'AIP Marketing Alliance',             city: 'Troy',              state: 'MI', coords: [-83.15,  42.6],  website: 'aipma.com', aliases: ['AIP'] },
  { id: 109, tree: 'integrity', name: 'Lion Street',                        city: 'Austin',            state: 'TX', coords: [-97.75,  30.3],  website: 'lionstreet.com' },
  { id: 110, tree: 'integrity', name: 'Senior Insurance Marketing',         city: 'Lincoln',           state: 'NE', coords: [-96.67,  40.81], website: 'simkt.com', aliases: ['SIM'] },
  { id: 111, tree: 'integrity', name: 'Osborn Insurance Group',             city: 'Springfield',       state: 'MO', coords: [-93.29,  37.22], website: 'osborn-ins.com' },
  { id: 112, tree: 'integrity', name: 'Global Premier Benefits',            city: 'Owings Mills',      state: 'MD', coords: [-76.78,  39.41], website: 'globalpremierbenefits.com', aliases: ['GPB'] },
  { id: 113, tree: 'integrity', name: 'Senior Advisory Insurance Services', city: 'Cicero',            state: 'NY', coords: [-76.07,  43.18], website: 'senioradvisoryinsurance.com' },
  { id: 114, tree: 'integrity', name: 'Trusted Senior Specialists',         city: 'Houston',           state: 'TX', coords: [-95.37,  29.76], website: 'trustedseniorspecialists.com', aliases: ['TSS'] },
  { id: 115, tree: 'integrity', name: 'J. Gavin Financial Services',        city: 'Kennewick',         state: 'WA', coords: [-119.14, 46.21], website: 'jgavinfs.com' },
  { id: 116, tree: 'integrity', name: 'J. Helbig & Company',                city: 'St. Louis',         state: 'MO', coords: [-90.12,  38.7],  website: 'jhelbig.com' },
  { id: 117, tree: 'integrity', name: 'The Foschini Group',                 city: 'Farmington',        state: 'CT', coords: [-72.83,  41.72], website: 'foschinigroup.com' },
  { id: 118, tree: 'integrity', name: 'Resource Brokerage',                 city: 'Schaumburg',        state: 'IL', coords: [-88.08,  42.03], website: 'resourcebrokerage.com' },
  { id: 119, tree: 'integrity', name: 'Carothers Insurance Agency',         city: 'Las Vegas',         state: 'NV', coords: [-115.2,  36.1],  website: 'carothersinsurance.com' },
  { id: 120, tree: 'integrity', name: 'Penn Global Marketing',              city: 'St. Louis',         state: 'MO', coords: [-90.25,  38.6],  website: 'pennglobalmarketing.com' },
  { id: 121, tree: 'integrity', name: 'First American Insurance Underwrtrs', city: 'Boston',           state: 'MA', coords: [-71.06,  42.36], website: 'faiu.com', aliases: ['FAIU'] },
  { id: 122, tree: 'integrity', name: 'J. Manning & Associates',            city: 'Chicago',           state: 'IL', coords: [-87.63,  41.88], website: 'jmanningltc.com' },
  { id: 123, tree: 'integrity', name: 'Western Marketing',                  city: 'Missouri Valley',   state: 'IA', coords: [-95.89,  41.56], website: 'wmacorp.com', aliases: ['WMA'] },
  { id: 124, tree: 'integrity', name: 'J.D. Mullens',                       city: 'Jacksonville',      state: 'FL', coords: [-81.66,  30.33], website: 'jdmullens.com' },
  { id: 125, tree: 'integrity', name: 'Yellowstone Life Insurance Agency',  city: 'Weatherford',       state: 'TX', coords: [-97.8,   32.76], website: 'yellowstonelifegroup.com' },
  { id: 126, tree: 'integrity', name: 'The Valdez Group',                   city: 'Ontario',           state: 'OH', coords: [-82.6,   40.76], website: 'thevaldezgroup.org' },
  { id: 127, tree: 'integrity', name: 'Greenhill Management',               city: 'Ridgeland',         state: 'MS', coords: [-90.11,  32.41], website: 'greenhillmgmt.com' },
  { id: 128, tree: 'integrity', name: 'Senior Insurance Specialists',       city: 'Joplin',            state: 'MO', coords: [-94.51,  37.08], website: 'seniorinsurancespecialists.com' },
  { id: 129, tree: 'integrity', name: 'Applied General Agency',             city: 'Anaheim',           state: 'CA', coords: [-117.91, 33.84], website: 'appliedga.com', aliases: ['AGA'] },
  { id: 130, tree: 'integrity', name: 'Honeycutt Insurance Marketing',      city: 'Victorville',       state: 'CA', coords: [-117.29, 34.54], website: 'teamffl.com', aliases: ['Team FFL'] },
  { id: 131, tree: 'integrity', name: 'Mail Pro Leads',                     city: 'Las Vegas',         state: 'NV', coords: [-115.13, 36.2],  website: 'mailproleads.com' },
  { id: 132, tree: 'integrity', name: 'Limitless Insurance Services',       city: 'Scottsdale',        state: 'AZ', coords: [-111.92, 33.5],  website: 'ffllimitless.com', aliases: ['FFL Limitless'] },
  { id: 133, tree: 'integrity', name: 'Relentless Insurance Agency',        city: 'Las Vegas',         state: 'NV', coords: [-115.16, 36.15], website: 'familyfirstliferelentless.com', aliases: ['FFL Relentless'] },
  { id: 134, tree: 'integrity', name: 'Ash Brokerage',                      city: 'Fort Wayne',        state: 'IN', coords: [-85.12,  41.13], website: 'ashbrokerage.com' },
  { id: 135, tree: 'integrity', name: 'Russek Financial Services',          city: 'North Haven',       state: 'CT', coords: [-72.86,  41.38], website: 'russekfs.com' },
  { id: 136, tree: 'integrity', name: 'Ritter Insurance Marketing',         city: 'Harrisburg',        state: 'PA', coords: [-76.89,  40.27], website: 'ritterim.com', aliases: ['Ritter IM'] },
  { id: 137, tree: 'integrity', name: 'HGI',                                city: 'Alpharetta',        state: 'GA', coords: [-84.3,   34.08], website: 'hgicrusade.com', aliases: ['Hegemon Group International'] },
  { id: 138, tree: 'integrity', name: 'Abernathy Financial Services',       city: 'Fort Walton Beach', state: 'FL', coords: [-86.6,   30.44], website: 'abernathyfinancial.com' },
  { id: 139, tree: 'integrity', name: 'Hovis & Associates',                 city: 'St. Louis',         state: 'MO', coords: [-90.3,   38.57], website: 'hovisandassociates.com' },
  { id: 140, tree: 'integrity', name: 'SkyPoint Financial',                 city: 'Las Vegas',         state: 'NV', coords: [-115.1,  36.24], website: 'fflskyp.com', aliases: ['FFL SkyPoint'] },
  { id: 141, tree: 'integrity', name: 'Annuity Agents Alliance',            city: 'Denver',            state: 'CO', coords: [-104.93, 39.76], website: 'annuityagentsalliance.com', aliases: ['AAA'] },
  { id: 142, tree: 'integrity', name: 'Velocity Life Insurance Agency',     city: 'Roanoke',           state: 'VA', coords: [-79.94,  37.27], website: 'fflvelocity.com', aliases: ['FFL Velocity'] },
  { id: 143, tree: 'integrity', name: 'Statz Agency',                       city: 'Phoenix',           state: 'AZ', coords: [-112.0,  33.5],  website: 'statzagency.com' },
  { id: 144, tree: 'integrity', name: 'Legacy Insurance and Financial',     city: 'Salt Lake City',    state: 'UT', coords: [-111.89, 40.76], website: 'legacyifs.com' },
  { id: 145, tree: 'integrity', name: 'PHP Agency',                         city: 'Addison',           state: 'TX', coords: [-96.85,  32.95], website: 'phpagency.com', aliases: ['PHP'] },
  { id: 146, tree: 'integrity', name: 'Annexus',                            city: 'Scottsdale',        state: 'AZ', coords: [-111.95, 33.48], website: 'annexus.com' },
  { id: 147, tree: 'integrity', name: 'Richman Insurance Agency',           city: 'Dallas',            state: 'TX', coords: [-96.77,  32.8],  website: 'ffl-apex.com', aliases: ['FFL Apex'] },
  { id: 148, tree: 'integrity', name: 'American Business',                  city: 'New York',          state: 'NY', coords: [-74.01,  40.71], website: 'americanbusiness.com' },
  { id: 149, tree: 'integrity', name: 'Senior Resource Services',           city: 'Fayetteville',      state: 'NC', coords: [-78.88,  35.05], website: 'seniorresourceservices.com' },
  { id: 150, tree: 'integrity', name: 'Senior Planning Center',             city: 'Farmington',        state: 'ME', coords: [-70.15,  44.67], website: 'seniorplanningcenter.com' },
  { id: 151, tree: 'integrity', name: 'Heartland Financial Group',          city: 'Kansas City',       state: 'MO', coords: [-94.58,  39.1],  website: 'hfgagents.com', aliases: ['HFG'] },
  { id: 152, tree: 'integrity', name: 'Compass Group Insurance',            city: 'Fernandina Beach',  state: 'FL', coords: [-81.46,  30.67], website: 'compassgroupinsurance.com' },
  { id: 153, tree: 'integrity', name: 'Gott Professional Insurance Svc',   city: 'Sacramento',        state: 'CA', coords: [-121.49, 38.58], website: 'gpis4u.org', aliases: ['GPIS'] },
  { id: 154, tree: 'integrity', name: 'Insurance Marketplace Agency',       city: 'Portland',          state: 'OR', coords: [-122.68, 45.52], website: 'healthplansinoregon.com' },
  { id: 155, tree: 'integrity', name: 'Anderson-Kent Insurance Agency',     city: 'Waco',              state: 'TX', coords: [-97.16,  31.57], website: 'andersonkent.com' },
  { id: 156, tree: 'integrity', name: 'Senior Services of North America',   city: 'Melville',          state: 'NY', coords: [-73.41,  40.79], website: 'ssnaopportunity.com', aliases: ['SSNA'] },
  { id: 157, tree: 'integrity', name: 'Elevation Sales Coaching',           city: 'Wake Forest',       state: 'NC', coords: [-78.5,   35.98], website: 'elevation.market' },
  { id: 158, tree: 'integrity', name: 'Mason Insurance',                    city: 'Colleyville',       state: 'TX', coords: [-97.08,  32.89], website: 'masoninsurance.net' },
  { id: 159, tree: 'integrity', name: 'Milner Financial',                   city: 'Lawrenceville',     state: 'GA', coords: [-84.0,   33.95], website: 'milnerfinancial.com' },
  { id: 160, tree: 'integrity', name: 'American Health Plans',              city: 'Detroit',           state: 'MI', coords: [-83.05,  42.33], website: 'americanhealthplansinsurance.com' },
  { id: 161, tree: 'integrity', name: 'Gladstone Wealth Partners',          city: 'Boca Raton',        state: 'FL', coords: [-80.08,  26.33], website: 'gladstonewealth.com' },
  { id: 162, tree: 'integrity', name: 'DeLong Sales Group',                 city: 'LaGrange',          state: 'GA', coords: [-85.02,  33.02], website: 'delongsalesgroup.com' },
  { id: 163, tree: 'integrity', name: 'Senior Solutions & Services',        city: 'Chesterfield',      state: 'VA', coords: [-77.5,   37.38], website: 'seniorsolutionsservices.com' },
  { id: 164, tree: 'integrity', name: 'Easy Street Insurance',              city: 'Indianapolis',      state: 'IN', coords: [-86.17,  39.72], website: 'easystreetins.com' },
  { id: 165, tree: 'integrity', name: 'MediSource',                         city: 'Little Rock',       state: 'AR', coords: [-92.35,  34.72], website: 'medisourcear.com' },
  { id: 166, tree: 'integrity', name: 'Sellyei & Rundle',                   city: 'Tucson',            state: 'AZ', coords: [-110.97, 32.19], website: 'sellyeiandrundle.com' },
  { id: 167, tree: 'integrity', name: 'Consolidated Marketing Group',       city: 'Knoxville',         state: 'TN', coords: [-83.92,  35.96], website: 'cmgincorp.com', aliases: ['CMG'] },
  { id: 168, tree: 'integrity', name: 'The Insurance Superstore',           city: 'Colorado Springs',  state: 'CO', coords: [-104.82, 38.83], website: 'insurancess.org' },
  { id: 169, tree: 'integrity', name: 'Patriot Family Financial',           city: 'Fredericksburg',    state: 'VA', coords: [-77.46,  38.3],  website: 'patriotfamilyfinancial.com' },
  { id: 170, tree: 'integrity', name: 'Christian Brindle Insurance',        city: 'Sandy',             state: 'UT', coords: [-111.87, 40.57], website: 'christianbrindleinsuranceservices.com' },
  { id: 171, tree: 'integrity', name: 'Alliance Insurance Solutions',       city: 'El Paso',           state: 'TX', coords: [-106.49, 31.76], website: 'ais-ep.com' },
  { id: 172, tree: 'integrity', name: 'The Porter Group',                   city: 'Morehead',          state: 'KY', coords: [-83.43,  38.19], website: 'portergroupinsurance.com' },
  { id: 173, tree: 'integrity', name: 'Allen and Associates',               city: 'Memphis',           state: 'TN', coords: [-90.05,  35.15], website: 'allenandassociates.agency' },
  { id: 174, tree: 'integrity', name: 'South Atlantic Management',          city: 'Anderson',          state: 'SC', coords: [-82.65,  34.5],  website: 'southatlanticmgt.com' },
  { id: 175, tree: 'integrity', name: 'Senior Health & Life Benefits',      city: 'Savannah',          state: 'GA', coords: [-81.1,   32.08], website: 'seniorhealthlifebenefits.com' },
  { id: 176, tree: 'integrity', name: 'River City Senior Benefits',         city: 'Chattanooga',       state: 'TN', coords: [-85.31,  35.05], website: 'seniorbenefitsolutionsinc.com' },
  { id: 177, tree: 'integrity', name: 'Stockton Agency',                    city: 'Bentonville',       state: 'AR', coords: [-94.21,  36.37], website: 'stocktonagency.com' },
  { id: 178, tree: 'integrity', name: 'Ballard & Associates',               city: 'Fulton',            state: 'NY', coords: [-76.42,  43.32], website: 'ballardassoc.com' },
  { id: 179, tree: 'integrity', name: 'Community Care Agency',              city: 'Dallas',            state: 'TX', coords: [-96.82,  32.85], website: 'communitycare.com' },
  { id: 180, tree: 'integrity', name: 'INS Marketing Systems',              city: 'DeSoto',            state: 'TX', coords: [-96.86,  32.59], website: 'insuranceconsumerbenefits.com' },
  { id: 181, tree: 'integrity', name: 'Invictus Marketing Solutions',       city: 'Jefferson City',    state: 'MO', coords: [-92.17,  38.57], website: 'invictushealthandwealth.com' },
]

// ─────────────────────────────────────────────────────────────────────────────
// AMERILIFE — 78 partners
// ─────────────────────────────────────────────────────────────────────────────
export const AMERILIFE_PARTNERS: NetworkPartner[] = [
  // ── Health ──
  { id: 1,  tree: 'amerilife', segment: 'Health',   name: 'AAA Marketing Services',        city: 'Clearwater',      state: 'FL', coords: [-82.8,   27.97], website: 'aaamarketingservices.com' },
  { id: 2,  tree: 'amerilife', segment: 'Health',   name: 'Agent Boost Marketing',         city: 'Clearwater',      state: 'FL', coords: [-82.75,  27.95], website: 'agentboost.com' },
  { id: 3,  tree: 'amerilife', segment: 'Health',   name: 'ABX',                           city: 'Nashville',       state: 'TN', coords: [-86.78,  36.17], website: 'thinkabx.com' },
  { id: 4,  tree: 'amerilife', segment: 'Health',   name: 'American Federal',              city: 'Omaha',           state: 'NE', coords: [-95.93,  41.26], website: 'americanfederal.org' },
  { id: 5,  tree: 'amerilife', segment: 'Health',   name: 'AmeriLife Marketing Group',     city: 'Clearwater',      state: 'FL', coords: [-82.82,  27.98], website: 'amerilifemarketinggroup.com', aliases: ['AMG'] },
  { id: 6,  tree: 'amerilife', segment: 'Health',   name: 'BGA Insurance',                 city: 'Tampa',           state: 'FL', coords: [-82.46,  27.95], website: 'bgainsurance.net', aliases: ['BGA'] },
  { id: 7,  tree: 'amerilife', segment: 'Health',   name: 'Bobby Brock Insurance',         city: 'Booneville',      state: 'MS', coords: [-88.57,  34.66], website: 'bobbybrockinsurance.com' },
  { id: 8,  tree: 'amerilife', segment: 'Health',   name: 'Camas Prairie Insurance',       city: 'Cottonwood',      state: 'ID', coords: [-116.35, 46.05], website: 'camasprairieinsurance.com' },
  { id: 9,  tree: 'amerilife', segment: 'Health',   name: 'Crowe & Associates',            city: 'Milford',         state: 'CT', coords: [-73.06,  41.22], website: 'croweandassociates.com' },
  { id: 10, tree: 'amerilife', segment: 'Health',   name: 'Davies Agency',                 city: 'Glastonbury',     state: 'CT', coords: [-72.61,  41.71], website: 'daviesagency.net' },
  { id: 11, tree: 'amerilife', segment: 'Health',   name: 'Diversified Health Services',   city: 'Clearwater',      state: 'FL', coords: [-82.78,  27.96], website: 'diversifiedhealth.services' },
  { id: 12, tree: 'amerilife', segment: 'Health',   name: 'Elite Insurance Group',         city: 'Alpharetta',      state: 'GA', coords: [-84.29,  34.07], website: 'elite-insgroup.com' },
  { id: 13, tree: 'amerilife', segment: 'Health',   name: 'Gordon Marketing',              city: 'Noblesville',     state: 'IN', coords: [-86.01,  40.05], website: 'gordonmarketing.com' },
  { id: 14, tree: 'amerilife', segment: 'Health',   name: 'GLS Insurance',                 city: 'St. Louis',       state: 'MO', coords: [-90.19,  38.63], website: 'insurancegls.com', aliases: ['GLS'] },
  { id: 15, tree: 'amerilife', segment: 'Health',   name: 'GS National Insurance',         city: 'Boca Raton',      state: 'FL', coords: [-80.10,  26.36], website: 'gsnational.com' },
  { id: 16, tree: 'amerilife', segment: 'Health',   name: 'Health Insurance Store',        city: 'Louisville',      state: 'KY', coords: [-85.76,  38.25], website: 'getyourbestplan.com' },
  { id: 17, tree: 'amerilife', segment: 'Health',   name: 'HealthOne',                     city: 'Independence',    state: 'MO', coords: [-94.42,  39.09], website: 'healthonecorp.com' },
  { id: 18, tree: 'amerilife', segment: 'Health',   name: 'Health Resource Advisors',      city: 'Ocala',           state: 'FL', coords: [-82.14,  29.19], website: 'healthresourceadvisors.com', aliases: ['HRA'] },
  { id: 19, tree: 'amerilife', segment: 'Health',   name: 'HIPE Financial',                city: 'Austin',          state: 'TX', coords: [-97.73,  30.26], website: 'hipe.financial', aliases: ['HIPE'] },
  { id: 20, tree: 'amerilife', segment: 'Health',   name: 'Insurance 360',                 city: 'Scottsdale',      state: 'AZ', coords: [-111.93, 33.49], website: 'insurance360.net' },
  { id: 21, tree: 'amerilife', segment: 'Health',   name: 'Insurance Specialist Group',    city: 'Clearwater',      state: 'FL', coords: [-82.84,  27.94], website: 'amerilife.com', aliases: ['ISG'] },
  { id: 22, tree: 'amerilife', segment: 'Health',   name: 'IS Zelienople',                 city: 'Zelienople',      state: 'PA', coords: [-80.14,  40.79], website: 'zelieinsurance.com' },
  { id: 23, tree: 'amerilife', segment: 'Health',   name: 'Insurance Services LLC',        city: 'Sarasota',        state: 'FL', coords: [-82.53,  27.34], website: 'myinsuranceteam.com' },
  { id: 24, tree: 'amerilife', segment: 'Health',   name: 'JSA Online',                    city: 'Jacksonville',    state: 'FL', coords: [-81.66,  30.33], website: 'jsaonline.com', aliases: ['JSA'] },
  { id: 25, tree: 'amerilife', segment: 'Health',   name: 'LG-3',                          city: 'Memphis',         state: 'TN', coords: [-90.05,  35.15], website: 'lg-3.org' },
  { id: 26, tree: 'amerilife', segment: 'Health',   name: 'Maximum Senior Benefits',       city: 'Clearwater',      state: 'FL', coords: [-82.77,  27.99], website: 'maximumseniorbenefits.com', aliases: ['MSB'] },
  { id: 27, tree: 'amerilife', segment: 'Health',   name: 'MCC Brokerage',                 city: 'Chesterfield',    state: 'MO', coords: [-90.58,  38.66], website: 'mccbrokerage.com', aliases: ['MCC'] },
  { id: 28, tree: 'amerilife', segment: 'Health',   name: 'Midwestern Marketing',          city: 'Wichita',         state: 'KS', coords: [-97.34,  37.69], website: 'midwesternmarketing.com' },
  { id: 29, tree: 'amerilife', segment: 'Health',   name: 'Med-Care AZ',                   city: 'Chandler',        state: 'AZ', coords: [-111.84, 33.31], website: 'med-careaz.com' },
  { id: 30, tree: 'amerilife', segment: 'Health',   name: 'NISH Direct',                   city: 'Orlando',         state: 'FL', coords: [-81.38,  28.54], website: 'nishd.com' },
  { id: 31, tree: 'amerilife', segment: 'Health',   name: 'One Health Benefits',           city: 'Clearwater',      state: 'FL', coords: [-82.74,  27.93], website: 'onehealthbenefits.com' },
  { id: 32, tree: 'amerilife', segment: 'Health',   name: 'Open Access Insurance',         city: 'Sunrise',         state: 'FL', coords: [-80.26,  26.17], website: 'openaccessinsurance.com' },
  { id: 33, tree: 'amerilife', segment: 'Health',   name: 'ORCA Life',                     city: 'Fort Lauderdale', state: 'FL', coords: [-80.14,  26.12], website: 'orca.life', aliases: ['ORCA'] },
  { id: 34, tree: 'amerilife', segment: 'Health',   name: 'Parker Marketing',              city: 'Little Rock',     state: 'AR', coords: [-92.29,  34.75], website: 'pmiagents.com', aliases: ['PMI'] },
  { id: 35, tree: 'amerilife', segment: 'Health',   name: 'Paul Proffitt',                 city: 'Louisville',      state: 'KY', coords: [-85.74,  38.27], website: 'askpaulforinfo.com' },
  { id: 36, tree: 'amerilife', segment: 'Health',   name: 'PFS Insurance',                 city: 'Clearwater',      state: 'FL', coords: [-82.73,  27.97], website: 'pfsinsurance.com', aliases: ['PFS'] },
  { id: 37, tree: 'amerilife', segment: 'Health',   name: 'Plan Medicare',                 city: 'Tampa',           state: 'FL', coords: [-82.49,  27.98], website: 'planmedicare.com' },
  { id: 38, tree: 'amerilife', segment: 'Health',   name: 'Platinum Choice Healthcare',    city: 'Dallas',          state: 'TX', coords: [-96.80,  32.78], website: 'platinumchoicehealthcare.com' },
  { id: 39, tree: 'amerilife', segment: 'Health',   name: 'PSM Brokerage',                 city: 'Overland Park',   state: 'KS', coords: [-94.67,  38.98], website: 'psmbrokerage.com', aliases: ['PSM'] },
  { id: 40, tree: 'amerilife', segment: 'Health',   name: 'PIP',                           city: 'Miami',           state: 'FL', coords: [-80.19,  25.77], website: 'pip1.com' },
  { id: 41, tree: 'amerilife', segment: 'Health',   name: 'RB Insurance Group',            city: 'Deerfield Beach', state: 'FL', coords: [-80.10,  26.32], website: 'rbi-group.com', aliases: ['RBI'] },
  { id: 42, tree: 'amerilife', segment: 'Health',   name: 'Right Choice Community',        city: 'Phoenix',         state: 'AZ', coords: [-112.07, 33.45], website: 'rightchoicecommunitycommitment.org' },
  { id: 43, tree: 'amerilife', segment: 'Health',   name: 'Senior Elite Services',         city: 'Clearwater',      state: 'FL', coords: [-82.80,  27.92], website: 'senioreliteservices.com' },
  { id: 44, tree: 'amerilife', segment: 'Health',   name: 'Senior Healthcare Direct',      city: 'Clearwater',      state: 'FL', coords: [-82.76,  27.94], website: 'seniorhealthcaredirect.com', aliases: ['SHD'] },
  { id: 45, tree: 'amerilife', segment: 'Health',   name: 'Senior Health Insurance Direct', city: 'Clearwater',     state: 'FL', coords: [-82.71,  27.96], website: 'seniorhealthinsurancedirect.com', aliases: ['SHID'] },
  { id: 46, tree: 'amerilife', segment: 'Health',   name: 'Senior Market Advisors',        city: 'Charlotte',       state: 'NC', coords: [-80.84,  35.23], website: 'seniormarketadvisors.com', aliases: ['SMA'] },
  { id: 47, tree: 'amerilife', segment: 'Health',   name: 'SSI Insurance',                 city: 'Clearwater',      state: 'FL', coords: [-82.72,  27.91], website: 'ssiinsure.com', aliases: ['SSI'] },
  { id: 48, tree: 'amerilife', segment: 'Health',   name: 'Sherman Insurance',             city: 'Louisville',      state: 'KY', coords: [-85.72,  38.26], website: 'shermanins.com' },
  { id: 49, tree: 'amerilife', segment: 'Health',   name: 'Southern Life Insurance',       city: 'Mobile',          state: 'AL', coords: [-88.04,  30.69], website: 'southernlifeins.com' },
  { id: 50, tree: 'amerilife', segment: 'Health',   name: 'Stephens-Matthews',             city: 'Baton Rouge',     state: 'LA', coords: [-91.15,  30.45], website: 'stephens-matthews.com' },
  { id: 51, tree: 'amerilife', segment: 'Health',   name: 'USABG',                         city: 'Clearwater',      state: 'FL', coords: [-82.79,  27.90], website: 'usabg.com', aliases: ['USA Benefits Group'] },
  { id: 52, tree: 'amerilife', segment: 'Health',   name: 'Willamette Valley Benefits',    city: 'Salem',           state: 'OR', coords: [-123.03, 44.94], website: 'wvbenefits.com', aliases: ['WVB'] },
  { id: 53, tree: 'amerilife', segment: 'Health',   name: 'Your Family Bank',              city: 'Atlanta',         state: 'GA', coords: [-84.39,  33.75], website: 'yourfamilybank.org' },
  // ── Wealth ──
  { id: 54, tree: 'amerilife', segment: 'Wealth',   name: 'ASG Life',                      city: 'Clearwater',      state: 'FL', coords: [-82.83,  27.89], website: 'asglife.com', aliases: ['ASG'] },
  { id: 55, tree: 'amerilife', segment: 'Wealth',   name: 'Allied Elite Financial',        city: 'Phoenix',         state: 'AZ', coords: [-112.10, 33.48], website: 'alliedelitefinancial.com' },
  { id: 56, tree: 'amerilife', segment: 'Wealth',   name: 'Brookstone Capital Management', city: 'Wheaton',         state: 'IL', coords: [-88.11,  41.86], website: 'brookstonecm.com', aliases: ['Brookstone'] },
  { id: 57, tree: 'amerilife', segment: 'Wealth',   name: 'CFN',                           city: 'Fort Lauderdale', state: 'FL', coords: [-80.15,  26.13], website: 'cfnsfl.com' },
  { id: 58, tree: 'amerilife', segment: 'Wealth',   name: 'Crump Life Insurance Services', city: 'Charlotte',       state: 'NC', coords: [-80.86,  35.22], website: 'crump.com', aliases: ['Crump'] },
  { id: 59, tree: 'amerilife', segment: 'Wealth',   name: 'Dallas Financial Wholesalers',  city: 'Dallas',          state: 'TX', coords: [-96.82,  32.80], website: 'ronrawlings.com' },
  { id: 60, tree: 'amerilife', segment: 'Wealth',   name: 'FSIB',                          city: 'Boca Raton',      state: 'FL', coords: [-80.13,  26.37], website: 'fsib2000.com' },
  { id: 61, tree: 'amerilife', segment: 'Wealth',   name: 'Hoffman Financial Group',       city: 'Minneapolis',     state: 'MN', coords: [-93.27,  44.98], website: 'hoffmancorporation.com' },
  { id: 62, tree: 'amerilife', segment: 'Wealth',   name: 'KME Insurance Brokerage',       city: 'Clearwater',      state: 'FL', coords: [-82.86,  27.88], website: 'kmeins.com', aliases: ['KME'] },
  { id: 63, tree: 'amerilife', segment: 'Wealth',   name: 'Levinson & Associates',         city: 'Walnut Creek',    state: 'CA', coords: [-122.06, 37.91], website: 'carylevinson.com' },
  { id: 64, tree: 'amerilife', segment: 'Wealth',   name: 'Meritage WIA',                  city: 'Scottsdale',      state: 'AZ', coords: [-111.90, 33.52], website: 'meritagewia.com', aliases: ['Meritage'] },
  { id: 65, tree: 'amerilife', segment: 'Wealth',   name: 'The Ohlson Group',              city: 'Omaha',           state: 'NE', coords: [-96.0,   41.28], website: 'ohlsongroup.com' },
  { id: 66, tree: 'amerilife', segment: 'Wealth',   name: 'Peak Financial Freedom Group',  city: 'Sacramento',      state: 'CA', coords: [-121.50, 38.58], website: 'peakfinancialfreedomgroup.com', aliases: ['Peak Financial'] },
  { id: 67, tree: 'amerilife', segment: 'Wealth',   name: 'Pro Advantage Marketing',       city: 'Kansas City',     state: 'MO', coords: [-94.58,  39.10], website: 'proadvantagemkt.com' },
  { id: 68, tree: 'amerilife', segment: 'Wealth',   name: 'Saybrus Partners',              city: 'Hartford',        state: 'CT', coords: [-72.68,  41.76], website: 'saybruspartners.com', aliases: ['Saybrus'] },
  { id: 69, tree: 'amerilife', segment: 'Wealth',   name: 'Southwest Annuities Marketing', city: 'Scottsdale',      state: 'AZ', coords: [-111.88, 33.51], website: 'southwestannuitiesmarketing.com' },
  { id: 70, tree: 'amerilife', segment: 'Wealth',   name: 'Sterling Bridge',               city: 'Phoenix',         state: 'AZ', coords: [-112.05, 33.47], website: 'sterlingbridge.com' },
  { id: 71, tree: 'amerilife', segment: 'Wealth',   name: 'Succession Capital',            city: 'Austin',          state: 'TX', coords: [-97.71,  30.28], website: 'successioncapital.com' },
  { id: 72, tree: 'amerilife', segment: 'Wealth',   name: 'TAG Partners',                  city: 'Atlanta',         state: 'GA', coords: [-84.42,  33.77], website: 'tagpartners.org', aliases: ['TAG'] },
  { id: 73, tree: 'amerilife', segment: 'Wealth',   name: 'The Annuity Store',             city: 'Sioux Falls',     state: 'SD', coords: [-96.73,  43.55], website: 'annuity1.com' },
  { id: 74, tree: 'amerilife', segment: 'Wealth',   name: 'USA Financial',                 city: 'Grand Rapids',    state: 'MI', coords: [-85.67,  42.96], website: 'usafinancial.com' },
  { id: 75, tree: 'amerilife', segment: 'Wealth',   name: 'V2 Financial',                  city: 'Denver',          state: 'CO', coords: [-104.99, 39.74], website: 'v2fm.com', aliases: ['V2'] },
  { id: 76, tree: 'amerilife', segment: 'Wealth',   name: 'MyLifeWerks',                   city: 'St. Louis',       state: 'MO', coords: [-90.22,  38.65], website: 'mylifewerksinsurance.com' },
  // ── Worksite ──
  { id: 77, tree: 'amerilife', segment: 'Worksite', name: 'Benefits Direct',               city: 'Clearwater',      state: 'FL', coords: [-82.85,  27.87], website: 'amerilife.com' },
  { id: 78, tree: 'amerilife', segment: 'Worksite', name: 'Flex Made Easy',                city: 'Tampa',           state: 'FL', coords: [-82.52,  27.97], website: 'flexmadeeasy.com' },
]

// ─────────────────────────────────────────────────────────────────────────────
// SENIOR MARKET SALES (SMS) — 27 partners
// ─────────────────────────────────────────────────────────────────────────────
export const SMS_PARTNERS: NetworkPartner[] = [
  // ── Medicare ──
  { id: 1,  tree: 'sms', segment: 'Medicare', name: 'Abt Insurance Agency',          city: 'Austin',        state: 'TX', coords: [-97.74,   30.27], website: 'abtinsuranceagency.com' },
  { id: 2,  tree: 'sms', segment: 'Medicare', name: 'Breitenfeldt Group',             city: 'Minneapolis',   state: 'MN', coords: [-93.26,   44.98], website: 'bghealthplans.com' },
  { id: 3,  tree: 'sms', segment: 'Medicare', name: 'The Buckley Insurance Group',    city: 'Brick',         state: 'NJ', coords: [-74.11,   40.06], website: 'thebuckleyinsurancegroup.com', aliases: ['Buckley'] },
  { id: 4,  tree: 'sms', segment: 'Medicare', name: 'CareValue',                      city: 'Canandaigua',   state: 'NY', coords: [-77.28,   42.88], website: 'carevalue.com' },
  { id: 5,  tree: 'sms', segment: 'Medicare', name: 'Centurion Senior Services',      city: 'Philadelphia',  state: 'PA', coords: [-75.16,   39.95], website: 'centurionseniorservices.com' },
  { id: 6,  tree: 'sms', segment: 'Medicare', name: 'Fair Square Medicare',           city: 'New York',      state: 'NY', coords: [-74.00,   40.71], website: 'fairsquaremedicare.com', aliases: ['Fair Square'] },
  { id: 7,  tree: 'sms', segment: 'Medicare', name: 'Gerber & Associates',            city: 'Columbus',      state: 'OH', coords: [-82.99,   39.96], website: 'gerberinsagency.com' },
  { id: 8,  tree: 'sms', segment: 'Medicare', name: 'Giardini Medicare',              city: 'Brighton',      state: 'MI', coords: [-83.78,   42.53], website: 'gmedicareteam.com', aliases: ['Giardini'] },
  { id: 9,  tree: 'sms', segment: 'Medicare', name: 'Insuractive',                    city: 'Omaha',         state: 'NE', coords: [-95.93,   41.26], website: 'insuractive.com' },
  { id: 10, tree: 'sms', segment: 'Medicare', name: 'Medicare Instructors',           city: 'Omaha',         state: 'NE', coords: [-95.95,   41.24], website: 'medicareinstructors.com' },
  { id: 11, tree: 'sms', segment: 'Medicare', name: 'Medicare Solutions Network',     city: 'Lisle',         state: 'IL', coords: [-88.08,   41.80], website: 'medicaresolutionsnetwork.com', aliases: ['MSN'] },
  { id: 12, tree: 'sms', segment: 'Medicare', name: 'Medigap Life',                   city: 'Charlotte',     state: 'NC', coords: [-80.84,   35.23], website: 'medigaplife.com' },
  { id: 13, tree: 'sms', segment: 'Medicare', name: 'Medi-Solutions',                 city: 'Parsippany',    state: 'NJ', coords: [-74.43,   40.86], website: 'medi-solutions.org' },
  { id: 14, tree: 'sms', segment: 'Medicare', name: 'MIC Insurance Services',         city: 'Kinnelon',      state: 'NJ', coords: [-74.37,   41.00], website: 'micinsurance.com', aliases: ['MIC'] },
  { id: 15, tree: 'sms', segment: 'Medicare', name: 'Pro Insurance Resources',        city: 'Omaha',         state: 'NE', coords: [-95.91,   41.28], website: 'proinsuranceresources.com', aliases: ['PIR'] },
  { id: 16, tree: 'sms', segment: 'Medicare', name: 'Senior Savings Network',         city: 'Columbia',      state: 'SC', coords: [-81.03,   34.00], website: 'seniorsavingsnetwork.org', aliases: ['SSN'] },
  { id: 17, tree: 'sms', segment: 'Medicare', name: 'Seniors Advisory Services',      city: 'New Orleans',   state: 'LA', coords: [-90.07,   29.95], website: 'seniorsadvisoryservices.net' },
  { id: 18, tree: 'sms', segment: 'Medicare', name: 'Sizeland Medicare Strategies',   city: 'Omaha',         state: 'NE', coords: [-95.89,   41.22], website: 'sizelandmedicare.com' },
  { id: 19, tree: 'sms', segment: 'Medicare', name: 'Thomas Insurance Group',         city: 'Omaha',         state: 'NE', coords: [-95.87,   41.20], website: 'tig-ins.com', aliases: ['TIG'] },
  // ── Life / ACA / Multi-line ──
  { id: 20, tree: 'sms', segment: 'Life',     name: 'The ASA Group',                  city: 'Little Rock',   state: 'AR', coords: [-92.29,   34.75], website: 'theasagroup.com', aliases: ['ASA'] },
  { id: 21, tree: 'sms', segment: 'Life',     name: 'EMG Insurance Brokerage',        city: 'Omaha',         state: 'NE', coords: [-95.85,   41.26], website: 'emgbrokerage.com', aliases: ['EMG'] },
  { id: 22, tree: 'sms', segment: 'Life',     name: 'Futurity First',                 city: 'Omaha',         state: 'NE', coords: [-95.83,   41.24], website: 'futurityfirst.com' },
  { id: 23, tree: 'sms', segment: 'Life',     name: "O'Neill Marketing",              city: 'Omaha',         state: 'NE', coords: [-95.81,   41.22], website: 'oneillmarketing.net', aliases: ["O'Neill"] },
  { id: 24, tree: 'sms', segment: 'Life',     name: 'Transitions Benefit Group',      city: 'Omaha',         state: 'NE', coords: [-95.79,   41.20], website: 'transitionsrbg.com', aliases: ['TBG'] },
  { id: 25, tree: 'sms', segment: 'Life',     name: 'Withrow Insurance Services',     city: 'Redding',       state: 'CA', coords: [-122.39,  40.59], website: 'withrowinsurance.com' },
  // ── Annuity ──
  { id: 26, tree: 'sms', segment: 'Annuity',  name: 'Sequent Planning',               city: 'Omaha',         state: 'NE', coords: [-95.77,   41.26], website: 'sequentplanning.com' },
  { id: 27, tree: 'sms', segment: 'Annuity',  name: 'Travel Insurance Center',        city: 'Omaha',         state: 'NE', coords: [-95.75,   41.24], website: 'travelinsurancecenter.com', aliases: ['TIC'] },
]

// ─────────────────────────────────────────────────────────────────────────────
// COMBINED + UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const ALL_PARTNERS: NetworkPartner[] = [
  ...INTEGRITY_PARTNERS,
  ...AMERILIFE_PARTNERS,
  ...SMS_PARTNERS,
]

/** Return the partner list for a given tree */
export function getPartnersByTree(tree: 'integrity' | 'amerilife' | 'sms'): NetworkPartner[] {
  switch (tree) {
    case 'integrity': return INTEGRITY_PARTNERS
    case 'amerilife': return AMERILIFE_PARTNERS
    case 'sms':       return SMS_PARTNERS
  }
}

/**
 * Get candidate partners for chain resolution.
 * Returns partners from the given tree that are in the agent's state OR
 * in neighboring states, sorted so same-state results come first.
 * Falls back to ALL partners in the tree if no regional candidates found.
 */
export function getCandidatePartners(
  tree: 'integrity' | 'amerilife' | 'sms',
  agentState: string
): NetworkPartner[] {
  const partners = getPartnersByTree(tree)
  const state = agentState.toUpperCase()
  const neighbors = STATE_NEIGHBORS[state] || []

  const inState     = partners.filter(p => p.state === state)
  const inNeighbors = partners.filter(p => neighbors.includes(p.state))

  // Deduplicate and sort: same-state first, then neighbors
  const seen = new Set<number>()
  const candidates: NetworkPartner[] = []
  for (const p of [...inState, ...inNeighbors]) {
    if (!seen.has(p.id)) { seen.add(p.id); candidates.push(p) }
  }

  // If we have fewer than 5 candidates, supplement with the full tree list
  // (some partners serve national markets regardless of HQ state)
  if (candidates.length < 5) {
    for (const p of partners) {
      if (!seen.has(p.id)) { seen.add(p.id); candidates.push(p) }
    }
  }

  return candidates
}

/**
 * Fuzzy-match a freetext sub_imo string against all known partners.
 * Returns the best matching partner or null if confidence is too low.
 * Used to normalize historical freetext confirmed_sub_imo values.
 */
export function matchPartnerByName(input: string): NetworkPartner | null {
  if (!input?.trim()) return null
  const normalized = input.trim().toLowerCase()

  // Exact name match first
  const exact = ALL_PARTNERS.find(p => p.name.toLowerCase() === normalized)
  if (exact) return exact

  // Alias match
  const aliasMatch = ALL_PARTNERS.find(p =>
    p.aliases?.some(a => a.toLowerCase() === normalized)
  )
  if (aliasMatch) return aliasMatch

  // Contains match (input contains partner name or vice versa)
  const contains = ALL_PARTNERS.find(p =>
    normalized.includes(p.name.toLowerCase()) ||
    p.name.toLowerCase().includes(normalized) ||
    p.aliases?.some(a => normalized.includes(a.toLowerCase()) || a.toLowerCase().includes(normalized))
  )
  if (contains) return contains

  return null
}

/**
 * Get all partners for a state + optional tree filter.
 * Used by territory intelligence queries.
 */
export function getPartnersByState(
  state: string,
  tree?: 'integrity' | 'amerilife' | 'sms'
): NetworkPartner[] {
  const pool = tree ? getPartnersByTree(tree) : ALL_PARTNERS
  return pool.filter(p => p.state === state.toUpperCase())
}

/** All unique states that have at least one partner, optionally filtered by tree */
export function getActiveStates(tree?: 'integrity' | 'amerilife' | 'sms'): string[] {
  const pool = tree ? getPartnersByTree(tree) : ALL_PARTNERS
  return [...new Set(pool.map(p => p.state))].sort()
}
